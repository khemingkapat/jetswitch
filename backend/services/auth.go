package services

import (
	"database/sql"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/models"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPassword compares a password with its hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateJWT creates a JWT token for the user
func GenerateJWT(userID int, username string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

// RegisterUser creates a new user account
func RegisterUser(req models.RegisterRequest) (*models.User, error) {
	// Validate passwords match
	if req.Password != req.ConfirmPassword {
		return nil, errors.New("passwords do not match")
	}

	// Validate user type
	if req.UserType != "listener" && req.UserType != "artist" {
		return nil, errors.New("invalid user type")
	}

	// Hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Insert user into database
	var user models.User
	query := `
        INSERT INTO users (username, email, password_hash, user_type, auth_provider)
        VALUES ($1, $2, $3, $4, 'local')
        RETURNING id, username, email, user_type, auth_provider, created_at, updated_at
    `

	err = database.DB.QueryRow(
		query,
		req.Username,
		req.Email,
		hashedPassword,
		req.UserType,
	).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.UserType,
		&user.AuthProvider,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// LoginUser authenticates a user and returns their data
func LoginUser(req models.LoginRequest) (*models.User, error) {
	var user models.User
	var passwordHash sql.NullString

	query := `
        SELECT id, username, email, password_hash, user_type, google_id, avatar_url, auth_provider, created_at, updated_at
        FROM users
        WHERE username = $1
    `

	err := database.DB.QueryRow(query, req.Username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&passwordHash,
		&user.UserType,
		&user.GoogleID,
		&user.AvatarURL,
		&user.AuthProvider,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid username or password")
	}
	if err != nil {
		return nil, err
	}

	// Check if user registered with Google
	if user.AuthProvider == "google" {
		return nil, errors.New("this account uses Google sign-in. Please use 'Login with Google'")
	}

	// Check password
	if !passwordHash.Valid || !CheckPassword(req.Password, passwordHash.String) {
		return nil, errors.New("invalid username or password")
	}

	return &user, nil
}

// FindOrCreateGoogleUser finds existing user or creates new one from Google OAuth
func FindOrCreateGoogleUser(googleInfo *models.GoogleUserInfo, userType string) (*models.User, bool, error) {
	var user models.User
	var isNewUser bool

	// Try to find existing user by Google ID
	query := `
        SELECT id, username, email, user_type, google_id, avatar_url, auth_provider, created_at, updated_at
        FROM users
        WHERE google_id = $1
    `

	err := database.DB.QueryRow(query, googleInfo.ID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.UserType,
		&user.GoogleID,
		&user.AvatarURL,
		&user.AuthProvider,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		// User doesn't exist, create new one
		isNewUser = true

		// Generate username from email
		username := generateUsernameFromEmail(googleInfo.Email)

		// If userType is not provided, default to listener
		if userType == "" {
			userType = "listener"
		}

		insertQuery := `
            INSERT INTO users (username, email, google_id, avatar_url, user_type, auth_provider)
            VALUES ($1, $2, $3, $4, $5, 'google')
            RETURNING id, username, email, user_type, google_id, avatar_url, auth_provider, created_at, updated_at
        `

		err = database.DB.QueryRow(
			insertQuery,
			username,
			googleInfo.Email,
			googleInfo.ID,
			googleInfo.Picture,
			userType,
		).Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.UserType,
			&user.GoogleID,
			&user.AvatarURL,
			&user.AuthProvider,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, false, err
		}
	} else if err != nil {
		return nil, false, err
	}

	return &user, isNewUser, nil
}

// UpdateUserType updates the user type for a new Google user
func UpdateUserType(userID int, userType string) error {
	if userType != "listener" && userType != "artist" {
		return errors.New("invalid user type")
	}

	query := `UPDATE users SET user_type = $1, updated_at = NOW() WHERE id = $2`
	_, err := database.DB.Exec(query, userType, userID)
	return err
}

func generateUsernameFromEmail(email string) string {
	// Extract username from email (before @)
	for i, char := range email {
		if char == '@' {
			return email[:i]
		}
	}
	return email
}
