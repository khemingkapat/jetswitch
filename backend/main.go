package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/khemingkapat/jetswitch/backend/config"
	"github.com/khemingkapat/jetswitch/backend/database"
	"github.com/khemingkapat/jetswitch/backend/handlers"
	"github.com/khemingkapat/jetswitch/backend/middlewares"
	"github.com/khemingkapat/jetswitch/backend/services"

	"github.com/gofiber/swagger"
	_ "github.com/khemingkapat/jetswitch/backend/docs"
)

// @title Go Backend API
// @description This is the backend API for jetswitch project, handling with most of backend logic and communicate with ML Microservice
// @host localhost:8080
// @BasePath /
func main() {
	// Load configuration
	config.LoadConfig()

	// Connect to database
	database.Connect()

	// Initialize OAuth
	services.InitOAuth()

	app := fiber.New()

	app.Get("/swagger/*", swagger.HandlerDefault)
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

	app.Post("/api/music/analyze", handlers.AnalyzeMusic)
	app.Get("/api/music/similar", handlers.GetSimilarSongs)
	app.Get("/api/music/songs", handlers.ListAllSongs)
	app.Get("/api/music/songs/:id", handlers.GetSongByID)
	app.Post("/api/music/feedback", middleware.AuthRequired, handlers.HandleMusicFeedback)

	log.Println("Server is running on http://localhost:8080")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal(err)
	}
}
