package services_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/services"
	"github.com/stretchr/testify/assert"
)

func init() {
	// Ensure config is loaded to get the JWT secret
	config.LoadConfig()
}

// TestHashPassword verifies that a password is securely hashed and not equal to the original.
func TestHashPassword(t *testing.T) {
	password := "securepassword123"
	hash, err := services.HashPassword(password)

	assert.NoError(t, err, "Hashing should not return an error")
	assert.NotEmpty(t, hash, "Hash should not be empty")
	assert.NotEqual(t, password, hash, "Hash must be different from the plain password")
}

// TestCheckPassword verifies the comparison logic for valid and invalid passwords.
func TestCheckPassword(t *testing.T) {
	password := "mySecretPass"
	hashedPassword, _ := services.HashPassword(password)

	// Test correct password
	assert.True(t, services.CheckPassword(password, hashedPassword), "Correct password should match the hash")

	// Test incorrect password
	assert.False(t, services.CheckPassword("wrongPassword", hashedPassword), "Incorrect password should not match")
}

// TestGenerateJWT verifies token generation and checks embedded claims and expiration.
func TestGenerateJWT(t *testing.T) {
	userID := 101
	username := "testuser_jwt"

	tokenString, err := services.GenerateJWT(userID, username)
	assert.NoError(t, err)
	assert.NotEmpty(t, tokenString)

	// Parse and validate the token signature
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTSecret), nil
	})

	assert.NoError(t, err, "Token parsing failed")
	assert.True(t, token.Valid, "Generated token should be valid")

	// Check claims content
	claims, ok := token.Claims.(jwt.MapClaims)
	assert.True(t, ok)

	// JWT numbers are float64 in Go map claims
	assert.Equal(t, float64(userID), claims["user_id"], "User ID claim mismatch")
	assert.Equal(t, username, claims["username"], "Username claim mismatch")

	// Check expiration time is correctly set in the future (within a reasonable window)
	exp, ok := claims["exp"].(float64)
	assert.True(t, ok)
	assert.True(t, exp > float64(time.Now().Unix()), "Token expiration time is not set in the future")
}
