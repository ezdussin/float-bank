package broker

import (
	"context"
	"encoding/json"
	"float-bank/internal/gateway/models"
	"log"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type RabbitMQ struct {
	conn    *amqp.Connection
	channel *amqp.Channel
}

func InitRabbitMQ() (*RabbitMQ, error) {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		url = "amqp://guest:guest@localhost:5672/"
	}

	var conn *amqp.Connection
	var err error

	// Retry connection logic
	for i := 0; i < 5; i++ {
		conn, err = amqp.Dial(url)
		if err == nil {
			break
		}
		log.Printf("Tentativa %d de conexão com RabbitMQ falhou: %v. Retentando em 5s...", i+1, err)
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		return nil, err
	}

	// Declare the queue
	_, err = ch.QueueDeclare(
		"transfers_queue", // name
		true,              // durable
		false,             // delete when unused
		false,             // exclusive
		false,             // no-wait
		nil,               // arguments
	)
	if err != nil {
		return nil, err
	}

	log.Println("Conectado ao RabbitMQ com sucesso")
	return &RabbitMQ{
		conn:    conn,
		channel: ch,
	}, nil
}

func (r *RabbitMQ) PublishTransfer(transfer *models.Transaction) error {
	body, err := json.Marshal(transfer)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err = r.channel.PublishWithContext(ctx,
		"",                // exchange
		"transfers_queue", // routing key
		false,             // mandatory
		false,             // immediate
		amqp.Publishing{
			Headers:         amqp.Table{"x-attempts": 0},
			ContentType:     "application/json",
			ContentEncoding: "utf-8",
			DeliveryMode:    amqp.Persistent,
			Priority:        0,
			Timestamp:       time.Now(),
			Body:            body,
		})

	if err != nil {
		log.Printf("Erro ao publicar mensagem no RabbitMQ: %v", err)
		return err
	}

	log.Printf("Mensagem enviada para a fila transfers_queue: %s", transfer.ID)
	return nil
}

func (r *RabbitMQ) Close() {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
}
