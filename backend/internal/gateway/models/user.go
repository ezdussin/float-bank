package models

import (
	"errors"
	"net/mail"
	"strings"
)

type User struct {
	FullName string
	Email    string
	Password string
}

// NewUser atua como o "Constructor" que valida os dados
func NewUser(fullName, email, password string) (*User, error) {
	if strings.TrimSpace(fullName) == "" {
		return nil, errors.New("nome completo é obrigatório")
	}

	// Validação de Email usando a lib nativa
	if _, err := mail.ParseAddress(email); err != nil {
		return nil, errors.New("formato de email inválido")
	}

	if len(password) < 6 {
		return nil, errors.New("a senha deve ter pelo menos 6 caracteres")
	}

	return &User{
		FullName: strings.TrimSpace(fullName),
		Email:    strings.ToLower(strings.TrimSpace(email)),
		Password: password,
	}, nil
}
