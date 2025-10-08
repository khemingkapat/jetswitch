package models

import (
	"time"
)

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Don't send password in JSON
	UserType     string    `json:"user_type"`
	GoogleID     *string   `json:"google_id,omitempty"`
	AvatarURL    *string   `json:"avatar_url,omitempty"`
	AuthProvider string    `json:"auth_provider"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Username        string `json:"username"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
	UserType        string `json:"user_type"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

type AuthResponse struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	Message   string `json:"message"`
	IsNewUser bool   `json:"is_new_user,omitempty"` // For Google OAuth flow
}
