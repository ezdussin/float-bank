package db

import (
	"context"
	"errors"
	"os"
	"time"

	"float-bank/internal/gateway/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ReadRepository struct {
	Client *mongo.Client
	Db     *mongo.Database
}

func InitReadDB() (*ReadRepository, error) {
	uri := os.Getenv("DB_READ_URI")      // mongodb://mongodb:27017
	dbName := os.Getenv("MONGO_DB_NAME") // float_read_db

	if uri == "" || dbName == "" {
		return nil, errors.New("configurações de MongoDB (URI ou DB Name) ausentes")
	}

	// Configura o contexto com timeout para a conexão inicial
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Conecta ao MongoDB
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	// 2. Verifica se a conexão está ativa (Ping)
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	return &ReadRepository{
		Client: client,
		Db:     client.Database(dbName),
	}, nil
}

func (r *ReadRepository) GetDashboard(userID string) (*models.DashboardData, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := r.Db.Collection("user_dashboards")

	var dashboard models.DashboardData
	filter := bson.M{"user_id": userID}

	// Busca o documento único do usuário
	err := collection.FindOne(ctx, filter).Decode(&dashboard)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("dashboard ainda não processado")
		}
		return nil, err
	}

	return &dashboard, nil
}

func (r *ReadRepository) GetTransactionHistory(userID string) ([]models.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := r.Db.Collection("transactions_history")

	var history []models.Transaction
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &history); err != nil {
		return nil, err
	}
	if history == nil {
		return []models.Transaction{}, nil
	}

	return history, nil
}

func (r *ReadRepository) GetRecentTransactions(userID string, limit int) ([]models.Transaction, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := r.Db.Collection("transactions_history")

	var history []models.Transaction
	filter := bson.M{"user_id": userID}
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}).SetLimit(int64(limit))

	cursor, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, &history); err != nil {
		return nil, err
	}
	if history == nil {
		return []models.Transaction{}, nil
	}

	return history, nil
}
