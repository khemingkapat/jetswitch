package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	app := fiber.New()

	// Middleware
	app.Use(logger.New())
	
	// CORS Middleware - allow any localhost
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept",
	}))

	// Routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Hello from Go Fiber backend!"})
	})

	// ML endpoint - fetches from ML service
	app.Get("/ml", func(c *fiber.Ctx) error {
		// Fetch from ML service
		resp, err := http.Get("http://ml_service:8000")
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch from ML service",
				"details": err.Error(),
			})
		}
		defer resp.Body.Close()

		// Read response body
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read ML service response",
				"details": err.Error(),
			})
		}

		// Parse JSON response
		var mlResponse map[string]interface{}
		if err := json.Unmarshal(body, &mlResponse); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to parse ML service response",
				"details": err.Error(),
			})
		}

		// Return the ML service response
		return c.JSON(mlResponse)
	})

	// Start server
	log.Println("Server is running on http://localhost:8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
