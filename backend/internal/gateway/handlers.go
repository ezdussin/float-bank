package gateway

import (
	"encoding/json"
	"float-bank/internal/gateway/broker"
	"float-bank/internal/gateway/db"
	"float-bank/internal/gateway/models"
	"net/http"
)

func HandleTransfer(rabbit *broker.RabbitMQ, repo *db.AuthRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ReceiverEmail string  `json:"receiver_email"`
			Amount        float64 `json:"amount"`
			Description   string  `json:"description"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "JSON inválido", http.StatusBadRequest)
			return
		}

		// Extract user_id from context (set by AuthMiddleware)
		senderID, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			http.Error(w, "User not authenticated", http.StatusUnauthorized)
			return
		}

		// Fetch user from DB to get the email
		receiverUser, err := repo.GetUserByEmail(req.ReceiverEmail)
		if err != nil {
			http.Error(w, "Failed to retrieve user info", http.StatusInternalServerError)
			return
		}

		transfer, err := models.NewTransaction(senderID, receiverUser.ID, req.Description, req.Amount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Publish to RabbitMQ
		if err := rabbit.PublishTransfer(transfer); err != nil {
			http.Error(w, "Erro ao processar transferência", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Transferência enviada para processamento",
			"id":      transfer.ID,
		})
	}
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

func GetDashboard(readRepo *db.ReadRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Extrair o ID do usuário do Contexto (setado pelo Middleware JWT)
		userID, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "usuário não autenticado"})
			return
		}

		// 2. Chamar o repositório para buscar o dashboard/histórico
		dashboard, err := readRepo.GetDashboard(userID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "erro ao buscar dashboard"})
			return
		}

		recent, err := readRepo.GetRecentTransactions(userID, 5)
		if err != nil {
			recent = []models.Transaction{}
		}

		// 3. Monta a resposta final unindo os dois
		response := models.DashboardData{
			UserID:             userID,
			Account:            dashboard.Account,
			RecentTransactions: recent,
			UpdatedAt:          dashboard.UpdatedAt,
		}

		// 3. Retornar apenas a lista de transações para o Angular
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		// Se o array for nulo no banco, enviamos um array vazio [] em vez de null
		if dashboard == nil {
			json.NewEncoder(w).Encode([]models.Transaction{})
			return
		}

		json.NewEncoder(w).Encode(response)
	}
}

func GetTransactionHistory(repo *db.ReadRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 1. Extrair o ID do usuário do Contexto (setado pelo Middleware JWT)
		userID, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "usuário não autenticado"})
			return
		}

		// 2. Chamar o repositório para buscar o dashboard/histórico
		dashboard, err := repo.GetTransactionHistory(userID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "erro ao buscar histórico"})
			return
		}

		// 3. Retornar apenas a lista de transações para o Angular
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		// Se o array for nulo no banco, enviamos um array vazio [] em vez de null
		if dashboard == nil {
			json.NewEncoder(w).Encode([]models.Transaction{})
			return
		}

		json.NewEncoder(w).Encode(dashboard)
	}
}
