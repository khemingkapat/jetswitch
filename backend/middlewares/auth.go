package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/models"
)

func AuthRequired(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Missing authorization header",
		})
	}

	// Extract token from "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid authorization header format",
		})
	}

	tokenString := parts[1]

	// Parse and validate token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token",
		})
	}

	// Extract claims and store in context
	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		c.Locals("user_id", int(claims["user_id"].(float64)))
		c.Locals("username", claims["username"].(string))
	}

	return c.Next()
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
