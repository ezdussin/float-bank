package models

type Account struct {
	ID       string  `json:"id"`
	FullName string  `json:"full_name"`
	Email    string  `json:"email"`
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency"`
}
