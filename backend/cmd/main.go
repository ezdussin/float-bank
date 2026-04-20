package main

import (
	"context"
	"float-bank/internal/gateway"
	"float-bank/internal/gateway/broker"
	"float-bank/internal/gateway/db"
	"log"
	"net/http"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}
	mux := http.NewServeMux()

	prefix := "/api/v1"

	authRepo, err := db.InitWriteDB()
	if err != nil {
		log.Fatal("Falha ao iniciar banco de escrita:", err)
	}
	defer authRepo.DB.Close()

	readRepo, err := db.InitReadDB()
	if err != nil {
		log.Fatal("Falha ao iniciar banco de leitura:", err)
	}
	defer readRepo.Client.Disconnect(context.Background())

	rabbit, err := broker.InitRabbitMQ()
	if err != nil {
		log.Printf("Aviso: Falha ao conectar ao RabbitMQ: %v", err)
	} else {
		defer rabbit.Close()
	}

	log.Println("Gateway iniciado com sucesso")

	// Public routes
	mux.HandleFunc("POST "+prefix+"/login", gateway.HandleLogin(authRepo))
	mux.HandleFunc("POST "+prefix+"/register", gateway.HandleRegister(authRepo))

	// Protected routes
	mux.Handle("POST "+prefix+"/transfer", gateway.AuthMiddleware(gateway.HandleTransfer(rabbit, authRepo)))
	mux.Handle("GET "+prefix+"/transactions", gateway.AuthMiddleware(http.HandlerFunc(gateway.GetTransactionHistory(readRepo))))
	mux.Handle("GET "+prefix+"/dashboard", gateway.AuthMiddleware(http.HandlerFunc(gateway.GetDashboard(readRepo))))

	log.Println("Gateway FLOAT rodando na porta :8080")
	log.Fatal(http.ListenAndServe(":8080", gateway.CORSMiddleware(mux)))
}
