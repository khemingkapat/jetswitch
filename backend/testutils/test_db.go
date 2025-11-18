package testutils

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/database"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// TestDSN for the test database on port 5431, matching the docker-compose setup.
const (
	TestDSN = "host=localhost port=5431 user=admin password=admin dbname=jetswitch_test sslmode=disable"
	// Use a placeholder ML URL for tests that require config loading but don't hit ML.
	TestMLServiceURL = "http://localhost:12345"
)

// SetupTestDB initializes connection to the test database and sets global database.DB.
// It returns a *sql.DB handle to the connection used.
func SetupTestDB(t *testing.T) *sql.DB {
	// 1. Set environment variables to point to the *test* services
	if err := os.Setenv("DATABASE_URL", TestDSN); err != nil {
		t.Fatalf("Failed to set test DB URL: %v", err)
	}
	if err := os.Setenv("ML_SERVICE_URL", TestMLServiceURL); err != nil {
		t.Fatalf("Failed to set mock ML URL: %v", err)
	}

	// 2. Reload config to pick up test environment variables
	config.LoadConfig()

	// 3. Open the connection explicitly for the test DB
	db, err := sql.Open("postgres", TestDSN)
	if err != nil {
		t.Fatalf("Failed to open test database connection: %v", err)
	}

	// 4. Wait for database to be ready and assign to global variable
	for i := 0; i < 5; i++ {
		if err := db.Ping(); err == nil {
			log.Println("✅ Test database connection successful")
			// CRITICAL FIX: Assign the *test* connection to the global variable
			// that application code (services/handlers) relies on.
			database.DB = db
			return db
		}
		log.Printf("Waiting for test database... attempt %d/5", i+1)
		time.Sleep(1 * time.Second)
	}

	t.Fatalf("Timed out waiting for test database to connect on %s", TestDSN)
	return nil
}

// TearDownTestDB cleans up the database tables and closes the connection.
func TearDownTestDB(t *testing.T, db *sql.DB) {
	if db == nil {
		return
	}
	if err := clearTestTables(db); err != nil {
		t.Fatalf("Failed to clear test tables: %v", err)
	}

	database.DB = nil // Reset global DB variable

	if err := db.Close(); err != nil {
		log.Printf("Error closing test database connection: %v", err)
	}

	// Reset env vars to avoid bleeding into other tests
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("ML_SERVICE_URL")
	config.LoadConfig()
}

// clearTestTables truncates tables in the correct order.
func clearTestTables(db *sql.DB) error {
	// List of tables to clear
	tables := []string{
		"song_feedback",
		"search_history",
		"playlist_songs",
		"playlists",
		"song_tags",
		"tags",
		"contact",
		"contact_info",
		"songs",
		"users",
	}
	query := "TRUNCATE TABLE %s RESTART IDENTITY CASCADE;"

	for _, table := range tables {
		if _, err := db.Exec(fmt.Sprintf(query, table)); err != nil {
			return fmt.Errorf("failed to truncate table %s: %w", table, err)
		}
	}
	return nil
}

// AddTestUser inserts a local user for integration tests and returns the ID.
func AddTestUser(t *testing.T, db *sql.DB, username, email, password, userType string) int {
	var userID int
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	query := `
        INSERT INTO users (username, email, password_hash, user_type, auth_provider)
        VALUES ($1, $2, $3, $4, 'local')
        RETURNING id
    `
	if err := db.QueryRow(query, username, email, string(hashedPassword), userType).Scan(&userID); err != nil {
		t.Fatalf("Failed to add test user: %v", err)
	}
	return userID
}
