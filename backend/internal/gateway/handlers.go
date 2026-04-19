package gateway

import (
	"encoding/json"
	"float-bank/internal/gateway/db"
	"float-bank/internal/gateway/models"
	"log"
	"net/http"
)

func HandleTransfer(w http.ResponseWriter, r *http.Request) {
	// 1. Decodificar o JSON vindo do Angular
	// 2. Chamar o serviço gRPC (Write)
	// conn, err := grpc.Dial("ledger-service:50051", ...)

	log.Println("Enviando comando de transferência para o Ledger...")
}

func HandleLogin(repo *db.AuthRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "JSON inválido", http.StatusBadRequest)
			return
		}
		token, err := repo.Authenticate(req.Email, req.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		user, err := repo.GetUserByEmail(req.Email)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		response := map[string]interface{}{
			"token": token,
			"user": map[string]string{
				"full_name": user.FullName,
				"email":     user.Email,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(response)
	}
}

func HandleRegister(repo *db.AuthRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var input struct {
			FullName string `json:"full_name"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "JSON inválido", http.StatusBadRequest)
			return
		}

		// 1. Chama o "Constructor" para validar os valores
		newUser, err := models.NewUser(input.FullName, input.Email, input.Password)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// 2. Chama a função de salvamento
		if err := repo.Register(newUser); err != nil {
			http.Error(w, "Erro ao criar usuário: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Usuário criado com sucesso"})
	}
}

func HandleHistory(w http.ResponseWriter, r *http.Request) {
	log.Println("Buscando histórico...")
}
