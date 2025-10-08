package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/handlers"
	"github.com/khemingkapat/jetswitch/backend/middlewares"
	"github.com/khemingkapat/jetswitch/backend/services"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	database.Connect()

	// Initialize OAuth
	services.InitOAuth()

	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Hello from Go Fiber backend!"})
	})

	// Auth routes
	app.Post("/api/auth/register", handlers.Register)
	app.Post("/api/auth/login", handlers.Login)
	app.Get("/api/auth/google", handlers.GoogleLogin)
	app.Get("/api/auth/google/callback", handlers.GoogleCallback)
	app.Post("/api/auth/update-user-type", handlers.UpdateUserTypeHandler)
	app.Get("/api/auth/me", middleware.AuthRequired, handlers.GetMe)

	// ML endpoint
	app.Get("/ml", func(c *fiber.Ctx) error {
		resp, err := http.Get("http://ml_service:8000")
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch from ML service",
			})
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read ML service response",
			})
		}

		var mlResponse map[string]interface{}
		if err := json.Unmarshal(body, &mlResponse); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to parse ML service response",
			})
		}

		return c.JSON(mlResponse)
	})

	// Start server
	log.Println("Server is running on http://localhost:8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
