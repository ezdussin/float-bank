package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Transaction struct {
	ID          string    `json:"id" bson:"id"`
	SenderID    string    `json:"sender_id" bson:"sender_id"`     // Crucial para o filtro
	ReceiverID  string    `json:"receiver_id" bson:"receiver_id"` // Crucial para o filtro
	Amount      float64   `json:"amount" bson:"amount"`
	Status      string    `json:"status" bson:"status"`
	Description string    `json:"description" bson:"description"`
	CreatedAt   time.Time `json:"createdAt" bson:"createdAt"`
}

// Constantes para evitar strings soltas (Magic Strings) no código
const (
	TransactionTypeCredit = "CREDIT"
	TransactionTypeDebit  = "DEBIT"
	StatusSuccess         = "SUCCESS"
	StatusPending         = "PENDING"
	StatusFailed          = "FAILED"
)

// NewTransaction gera o ID automaticamente e define o status inicial
func NewTransaction(senderID, receiverID, description string, amount float64) (*Transaction, error) {
	if receiverID == "" {
		return nil, errors.New("user id is required")
	}

	if amount <= 0 {
		return nil, errors.New("amount must be greater than zero")
	}

	// Gera o ID único (UUID v4)
	id := uuid.New().String()

	return &Transaction{
		ID:          id,
		ReceiverID:  receiverID,
		SenderID:    senderID,
		Amount:      amount,
		Status:      StatusPending, // Toda nova transação nasce pendente
		Description: description,
		CreatedAt:   time.Now().UTC(),
	}, nil
}
