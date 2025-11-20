package handlers

import (
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/models"
	"github.com/khemingkapat/jetswitch/backend/services"
	"github.com/khemingkapat/jetswitch/backend/config"
	"golang.org/x/oauth2"
)

// Register handles user registration
// @Summary Register a new local user
// @Description Creates a new account, hashes the password, and returns a JWT token.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "User registration details"
// @Success 201 {object} models.AuthResponse "User successfully registered and logged in."
// @Failure 400 {object} models.ErrorResponse "Invalid inputs, or username/email already exists."
// @Failure 500 {object} models.ErrorResponse "Internal server error (e.g., failed to hash password or generate token)."
// @Router /api/auth/register [post]
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
// @Summary Log in a local user
// @Description Authenticates a user with username and password and returns a JWT token.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "User login credentials"
// @Success 200 {object} models.AuthResponse "Login successful."
// @Failure 400 {object} models.ErrorResponse "Invalid request body."
// @Failure 401 {object} models.ErrorResponse "Invalid username/password or account uses Google sign-in."
// @Failure 500 {object} models.ErrorResponse "Internal server error."
// @Router /api/auth/login [post]
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
// @Summary Initiate Google OAuth
// @Description Redirects the client to the Google consent screen to begin OAuth process.
// @Tags Auth
// @Success 302 {string} string "Redirects to Google"
// @Router /api/auth/google [get]
func GoogleLogin(c *fiber.Ctx) error {
	url := services.GoogleOAuthConfig.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	return c.Redirect(url)
}

// GoogleCallback handles the OAuth callback
// @Summary Google OAuth Callback
// @Description Handles the redirect from Google, exchanges the code for a token, and finds/creates the user. Redirects to the frontend with a JWT.
// @Tags Auth
// @Param code query string true "Authorization code from Google"
// @Success 302 {string} string "Redirects to frontend with token in URL (either /auth/callback or /select-user-type)"
// @Failure 400 {object} models.ErrorResponse "No authorization code provided."
// @Failure 500 {object} models.ErrorResponse "Failed to exchange token or process user info."
// @Router /api/auth/google/callback [get]
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
		return c.Redirect(config.AppConfig.FrontendURL + "/select-user-type?token=" + jwtToken)
	}

	return c.Redirect(config.AppConfig.FrontendURL + "/auth/callback?token=" + jwtToken)
}

// UpdateUserTypeHandler handles updating user type for new Google users
// @Summary Update user type
// @Description Updates the user's role (listener/artist). Intended for use after OAuth registration.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body object{user_id:int, user_type:string} true "User ID and new type ('listener' or 'artist')"
// @Success 200 {object} models.MessageResponse "User type updated successfully."
// @Failure 400 {object} models.ErrorResponse "Invalid request body or user type."
// @Failure 500 {object} models.ErrorResponse "Database error during update."
// @Router /api/auth/update-user-type [post]
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
// @Summary Get Current User Info
// @Description Retrieves the authenticated user's details based on the provided JWT.
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} object{models.User} "Current authenticated user details."
// @Failure 401 {object} models.ErrorResponse "Missing or invalid JWT token."
// @Failure 404 {object} models.ErrorResponse "User not found in database."
// @Router /api/auth/me [get]
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
