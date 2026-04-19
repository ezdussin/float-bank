package db

import (
	"context"
	"database/sql"
	"errors"
	"float-bank/internal/gateway/models"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository struct {
	DB *sql.DB
}

// InitWriteDB centraliza a conexão e retorna o repositório
func InitWriteDB() (*AuthRepository, error) {
	uri := os.Getenv("DB_WRITE_URI")
	if uri == "" {
		return nil, errors.New("DB_WRITE_URI não configurado")
	}

	db, err := sql.Open("postgres", uri)
	if err != nil {
		return nil, err
	}

	// Configurações de pool para não sobrecarregar o Cockroach
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &AuthRepository{DB: db}, nil
}

// Authenticate verifica e-mail/senha e retorna o Token
func (r *AuthRepository) Authenticate(email, password string) (string, error) {
	var id string
	var hashedPassword string

	query := `SELECT id, password_hash FROM users WHERE email = $1`
	err := r.DB.QueryRow(query, email).Scan(&id, &hashedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errors.New("usuário não encontrado")
		}
		return "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password)); err != nil {
		return "", errors.New("senha inválida")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": id,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	jwtSecret := os.Getenv("JWT_SECRET")
	return token.SignedString([]byte(jwtSecret))
}

// Register foca apenas na persistência dos dados no CockroachDB
func (r *AuthRepository) Register(u *models.User) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	ctx := context.Background()
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var userID string
	userQuery := `
		INSERT INTO users (full_name, email, password_hash) 
		VALUES ($1, $2, $3) 
		RETURNING id`

	err = tx.QueryRowContext(ctx, userQuery, u.FullName, u.Email, hashedPassword).Scan(&userID)
	if err != nil {
		return err // Ex: Email já existe
	}

	accountQuery := `INSERT INTO accounts (user_id, balance) VALUES ($1, 0.00)`
	_, err = tx.ExecContext(ctx, accountQuery, userID)
	if err != nil {
		return err
	}

	return tx.Commit()
}
