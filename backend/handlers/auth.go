package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/models"
	"github.com/khemingkapat/jetswitch/backend/services"
	"golang.org/x/oauth2"
)

// Register handles user registration
func Register(c *fiber.Ctx) error {
	var req models.RegisterRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Basic validation
	if req.Username == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "All fields are required",
		})
	}

	user, err := services.RegisterUser(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Generate JWT token
	token, err := services.GenerateJWT(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(models.AuthResponse{
		Token:   token,
		User:    *user,
		Message: "Registration successful",
	})
}

// Login handles user authentication
func Login(c *fiber.Ctx) error {
	var req models.LoginRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := services.LoginUser(req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Generate JWT token
	token, err := services.GenerateJWT(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(models.AuthResponse{
		Token:   token,
		User:    *user,
		Message: "Login successful",
	})
}

// GoogleLogin initiates Google OAuth flow
func GoogleLogin(c *fiber.Ctx) error {
	url := services.GoogleOAuthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

// GoogleCallback handles the OAuth callback
func GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No authorization code provided",
		})
	}

	// Exchange code for token
	token, err := services.GoogleOAuthConfig.Exchange(c.Context(), code)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to exchange token",
		})
	}

	// Get user info from Google
	client := services.GoogleOAuthConfig.Client(c.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user info",
		})
	}
	defer resp.Body.Close()

	var googleInfo models.GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&googleInfo); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to decode user info",
		})
	}

	// Find or create user
	user, isNewUser, err := services.FindOrCreateGoogleUser(&googleInfo, "")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process user",
		})
	}

	// Generate JWT token
	jwtToken, err := services.GenerateJWT(user.ID, user.Username)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	// Redirect to frontend with token
	// If new user, redirect to user type selection page
	if isNewUser {
		return c.Redirect("http://localhost:5173/select-user-type?token=" + jwtToken)
	}

	return c.Redirect("http://localhost:5173/auth/callback?token=" + jwtToken)
}

// UpdateUserType handles updating user type for new Google users
func UpdateUserTypeHandler(c *fiber.Ctx) error {
	var req struct {
		UserID   int    `json:"user_id"`
		UserType string `json:"user_type"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := services.UpdateUserType(req.UserID, req.UserType); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "User type updated successfully",
	})
}

// GetMe returns the current user's information
func GetMe(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(int)

	var user models.User
	query := `
        SELECT id, username, email, user_type, google_id, avatar_url, auth_provider, created_at, updated_at
        FROM users
        WHERE id = $1
    `

	err := database.DB.QueryRow(query, userID).Scan(
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
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(fiber.Map{
		"user": user,
	})
}
