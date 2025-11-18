package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/handlers"
	"github.com/khemingkapat/jetswitch/backend/models"
	"github.com/khemingkapat/jetswitch/backend/testutils"
	"github.com/stretchr/testify/assert"
)

// setupAuthTestApp configures the Fiber app with the necessary auth routes for testing.
// It is critical for the test database connection to be initialized before the handlers run.
func setupAuthTestApp(t *testing.T) *fiber.App {
	app := fiber.New()
	app.Post("/api/auth/register", handlers.Register)
	app.Post("/api/auth/login", handlers.Login)
	app.Post("/api/auth/update-user-type", handlers.UpdateUserTypeHandler)
	return app
}

// NOTE: We rely on testutils.SetupTestDB to initialize database.DB globally before handler execution.
// The fix ensures testutils.SetupTestDB successfully assigns the connection to database.DB.

// TestRegisterSuccess verifies a new user can register successfully.
func TestRegisterSuccess(t *testing.T) {
	// Call SetupTestDB, which connects to DB and sets database.DB globally.
	db := testutils.SetupTestDB(t)
	defer testutils.TearDownTestDB(t, db) // IMPORTANT: Cleans up after the test

	app := setupAuthTestApp(t)

	reqBody := models.RegisterRequest{
		Username:        "test_register_ok",
		Email:           "register_ok@test.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req, 3000) // Added explicit timeout for safety
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusCreated, resp.StatusCode, "Expected 201 Created on successful registration")

	var res models.AuthResponse
	json.NewDecoder(resp.Body).Decode(&res)
	assert.NotEmpty(t, res.Token)
	assert.Equal(t, "test_register_ok", res.User.Username)
	assert.Equal(t, "listener", res.User.UserType, "New user should default to 'listener' type")
}

// TestRegisterDuplicateUser verifies failure on attempting to register with a duplicate username.
func TestRegisterDuplicateUser(t *testing.T) {
	db := testutils.SetupTestDB(t)
	defer testutils.TearDownTestDB(t, db)

	app := setupAuthTestApp(t)

	// Add user first
	testutils.AddTestUser(t, db, "dupeuser", "dupe@test.com", "pass", "listener")

	reqBody := models.RegisterRequest{
		Username:        "dupeuser",
		Email:           "another@test.com",
		Password:        "password123",
		ConfirmPassword: "password123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// FIX: Added 3000ms timeout to prevent default 1000ms timeout error
	resp, err := app.Test(req, 3000)
	assert.NoError(t, err) // MUST HAVE
	assert.NotNil(t, resp) // MUST HAVE
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

// TestLoginSuccess verifies successful login for a local account.
func TestLoginSuccess(t *testing.T) {
	db := testutils.SetupTestDB(t)
	defer testutils.TearDownTestDB(t, db)

	app := setupAuthTestApp(t)
	// Create user to login with
	testutils.AddTestUser(t, db, "logintest", "login@test.com", "validpass", "listener")

	reqBody := models.LoginRequest{
		Username: "logintest",
		Password: "validpass",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// FIX: Added 3000ms timeout
	resp, err := app.Test(req, 3000)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode, "Expected 200 OK for valid login")

	var res models.AuthResponse
	json.NewDecoder(resp.Body).Decode(&res)
	assert.NotEmpty(t, res.Token)
	assert.Equal(t, "logintest", res.User.Username)
}

// TestLoginFailureWrongPassword verifies login fails with incorrect password.
func TestLoginFailureWrongPassword(t *testing.T) {
	db := testutils.SetupTestDB(t)
	defer testutils.TearDownTestDB(t, db)

	app := setupAuthTestApp(t)
	testutils.AddTestUser(t, db, "failuser", "fail@test.com", "correctpass", "listener")

	reqBody := models.LoginRequest{
		Username: "failuser",
		Password: "wrongpass", // Wrong password
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// FIX: Added 3000ms timeout
	resp, _ := app.Test(req, 3000)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode, "Expected 401 for invalid credentials")
}

// TestUpdateUserTypeHandlerSuccess verifies the user role can be updated after registration.
func TestUpdateUserTypeHandlerSuccess(t *testing.T) {
	db := testutils.SetupTestDB(t)
	defer testutils.TearDownTestDB(t, db)

	app := setupAuthTestApp(t)
	// Create user with default 'listener' type
	userID := testutils.AddTestUser(t, db, "tempuser", "temp@test.com", "temppass", "listener")

	reqBody := struct {
		UserID   int    `json:"user_id"`
		UserType string `json:"user_type"`
	}{
		UserID:   userID,
		UserType: "artist", // Change to artist
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/update-user-type", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	// FIX: Added 3000ms timeout
	resp, err := app.Test(req, 3000)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode, "Expected 200 OK for successful update")

	// Verify update in DB
	var userType string
	database.DB.QueryRow("SELECT user_type FROM users WHERE id = $1", userID).Scan(&userType)
	assert.Equal(t, "artist", userType, "User type was not updated to 'artist'")
}
