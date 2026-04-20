package models

import "time"

type AccountSummary struct {
	ID       string  `json:"id" bson:"id"`
	FullName string  `json:"fullName" bson:"fullName"`
	Balance  float64 `json:"balance" bson:"balance"`
	Currency string  `json:"currency" bson:"currency"`
}

type DashboardData struct {
	UserID  string         `json:"user_id" bson:"user_id"`
	Account AccountSummary `json:"account" bson:"account"`
	// Opcional: apenas as 5 mais recentes para a Home
	RecentTransactions []Transaction `json:"recent_transactions,omitempty" bson:"recent_transactions,omitempty"`
	UpdatedAt          time.Time     `json:"updated_at" bson:"updated_at"`
}
