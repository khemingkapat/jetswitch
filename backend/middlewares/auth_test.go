package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/khemingkapat/jetswitch/backend/config"
	middleware "github.com/khemingkapat/jetswitch/backend/middlewares"
	"github.com/stretchr/testify/assert"
)

func init() {
	config.LoadConfig()
}

// Helper to create a signed JWT token for testing.
func generateTestJWT(userID int, username string, expiry time.Time) string {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      expiry.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(config.AppConfig.JWTSecret))
	return tokenString
}

// TestAuthRequiredSuccess verifies middleware passes with a valid token and sets user context.
func TestAuthRequiredSuccess(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", middleware.AuthRequired, func(c *fiber.Ctx) error {
		// Assert that the user info was correctly set by the middleware
		assert.Equal(t, 55, c.Locals("user_id"), "Middleware should set correct user_id")
		assert.Equal(t, "authuser", c.Locals("username"), "Middleware should set correct username")
		return c.SendStatus(fiber.StatusOK)
	})

	token := generateTestJWT(55, "authuser", time.Now().Add(time.Hour))
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode, "Middleware failed to pass with valid token")
}

// TestAuthRequiredMissingHeader verifies rejection when the Authorization header is missing.
func TestAuthRequiredMissingHeader(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", middleware.AuthRequired, func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode, "Missing header should result in 401 Unauthorized")
}

// TestAuthRequiredExpiredToken verifies rejection with an expired token.
func TestAuthRequiredExpiredToken(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", middleware.AuthRequired, func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	// Create a token that expired one hour ago
	expiredToken := generateTestJWT(56, "expired", time.Now().Add(-time.Hour))
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+expiredToken)

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode, "Expired token should result in 401 Unauthorized")
}

// TestAuthRequiredInvalidTokenFormat verifies rejection with bad header format.
func TestAuthRequiredInvalidTokenFormat(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", middleware.AuthRequired, func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "BadPrefix tokenvalue")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode, "Invalid token format should result in 401 Unauthorized")
}
