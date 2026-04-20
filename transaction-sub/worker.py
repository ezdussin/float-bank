import pika
import json
import sys
from pymongo import MongoClient
from datetime import datetime

# --- CONFIGURAÇÕES ---
MONGO_URI = "mongodb://localhost:27017"
RABBITMQ_HOST = "localhost"
QUEUE_NAME = "transfers_queue"
DB_NAME = "float_read_db"

# Conexão MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def process_transfer(ch, method, properties, body):
    try:
        # 1. Decodifica o evento vindo do Go
        payload = json.loads(body)
        print(f"[*] Processando Transação: {payload}")

        sender_id = payload.get("sender_id")
        receiver_id = payload.get("receiver_id")
        amount = float(payload.get("amount"))
        tx_id = payload.get("id")
        description = payload.get("description", "Transferência")

        print(
            f"[*] Processando Transação {tx_id}: {sender_id} -> {receiver_id} | Valor: R$ {amount}"
        )

        # 2. Criar as entradas de Histórico (transactions_history)
        # Criamos duas visões: uma de débito para o remetente e uma de crédito para o destinatário

        history_entries = [
            {
                "id": f"{tx_id}_DEBIT",
                "user_id": sender_id,
                "related_user": receiver_id,
                "amount": -amount,  # Negativo para o remetente
                "type": "DEBIT",
                "status": "SUCCESS",
                "description": description,
                "createdAt": datetime.utcnow(),
            },
            {
                "id": f"{tx_id}_CREDIT",
                "user_id": receiver_id,
                "related_user": sender_id,
                "amount": amount,  # Positivo para o recebedor
                "type": "CREDIT",
                "status": "SUCCESS",
                "description": description,
                "createdAt": datetime.utcnow(),
            },
        ]

        # Insere no histórico (ignora se o ID já existir para garantir idempotência)
        for entry in history_entries:
            db.transactions_history.update_one(
                {"id": entry["id"]}, {"$setOnInsert": entry}, upsert=True
            )

        # 3. Atualizar Dashboards (Saldos e Variância)
        # Atualiza Remetente
        db.user_dashboards.update_one(
            {"user_id": sender_id},
            {
                "$inc": {"account.balance": -amount},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        # Atualiza Destinatário
        db.user_dashboards.update_one(
            {"user_id": receiver_id},
            {
                "$inc": {"account.balance": amount},
                "$set": {"updated_at": datetime.utcnow()},
            },
        )

        # 4. Confirma o processamento para o RabbitMQ
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"[v] Sucesso: Dashboards de {sender_id} e {receiver_id} atualizados.")

    except Exception as e:
        print(f"[!] Erro ao processar mensagem: {e}")
        # Rejeita a mensagem e coloca de volta na fila para tentar novamente
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    # Conexão RabbitMQ
    try:
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=RABBITMQ_HOST)
        )
        channel = connection.channel()

        # Garante que a fila existe e é durável
        channel.queue_declare(queue=QUEUE_NAME, durable=True)

        # Garante que o worker pegue apenas 1 mensagem por vez
        channel.basic_qos(prefetch_count=1)

        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_transfer)

        print(f' [*] Worker FLOAT aguardando mensagens na fila "{QUEUE_NAME}".')
        print(" [*] Para sair, pressione CTRL+C")
        channel.start_consuming()

    except pika.exceptions.AMQPConnectionError:
        print(
            "[!] Erro: Não foi possível conectar ao RabbitMQ. Verifique se o serviço está rodando."
        )
    except KeyboardInterrupt:
        print("\n[*] Worker encerrado pelo usuário.")
        sys.exit(0)


if __name__ == "__main__":
    main()
