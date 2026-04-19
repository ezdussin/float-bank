package main

import (
	"float-bank/internal/gateway"
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

	// O main nem sabe que é Postgres ou Cockroach, ele só recebe o repo
	log.Println("Gateway iniciado com sucesso")

	// Public routes
	mux.HandleFunc("POST "+prefix+"/login", gateway.HandleLogin(authRepo))
	mux.HandleFunc("POST "+prefix+"/register", gateway.HandleRegister(authRepo))

	// Protected routes
	mux.Handle("POST "+prefix+"/transfer", gateway.AuthMiddleware(http.HandlerFunc(gateway.HandleTransfer)))
	mux.Handle("GET "+prefix+"/history", gateway.AuthMiddleware(http.HandlerFunc(gateway.HandleHistory)))

	log.Println("Gateway FLOAT rodando na porta :8080")
	log.Fatal(http.ListenAndServe(":8080", gateway.CORSMiddleware(mux)))
}
