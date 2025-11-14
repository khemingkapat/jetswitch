package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	JWTSecret          string
	DatabaseURL        string
	MLServiceURL       string
}

var AppConfig Config

func LoadConfig() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	AppConfig = Config{
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		JWTSecret:          getEnv("JWT_SECRET", "default-secret-change-this"),
		DatabaseURL:        getEnv("DATABASE_URL", "postgres://admin:admin@postgres:5432/jetswitch?sslmode=disable"),
		MLServiceURL:       getEnv("ML_SERVICE_URL", "http://localhost:8000"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
