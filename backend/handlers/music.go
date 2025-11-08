package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/khemingkapat/jetswitch/backend/models"
	"github.com/khemingkapat/jetswitch/backend/services"
)

// AnalyzeMusic handles music analysis and similarity search
func AnalyzeMusic(c *fiber.Ctx) error {
	var req models.AnalyzeMusicRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if req.URL == "" || req.Title == "" || req.ArtistName == "" || req.SourcePlatform == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "URL, title, artist_name, and source_platform are required",
		})
	}

	// Step 1: Analyze and store the song
	songResult, err := services.AnalyzeAndStoreSong(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to analyze song",
			"details": err.Error(),
		})
	}

	// Step 2: Find similar songs
	similarSongs, err := services.FindSimilarSongs(songResult.ID, 10, true)
	if err != nil {
		fmt.Println(err)
		// If similarity search fails, still return the analyzed song
		return c.JSON(models.AnalyzeMusicResponse{
			Song:         *songResult,
			SimilarSongs: []models.SimilarSong{},
			Message:      "Song analyzed and stored successfully, but similarity search failed",
		})
	}

	// Return complete response
	return c.JSON(models.AnalyzeMusicResponse{
		Song:         *songResult,
		SimilarSongs: similarSongs,
		Message: fmt.Sprintf("Successfully analyzed '%s' by %s and found %d similar songs",
			songResult.Title, songResult.ArtistName, len(similarSongs)),
	})
}

// GetSimilarSongs handles direct similarity search by song ID
func GetSimilarSongs(c *fiber.Ctx) error {
	songID := c.QueryInt("id", 0)
	limit := c.QueryInt("limit", 10)
	excludeSelf := c.QueryBool("exclude_self", true)

	if songID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Song ID is required",
		})
	}

	similarSongs, err := services.FindSimilarSongs(songID, limit, excludeSelf)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to find similar songs",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"similar_songs": similarSongs,
		"count":         len(similarSongs),
	})
}

// ListAllSongs retrieves all songs from the ML service
func ListAllSongs(c *fiber.Ctx) error {
	songs, err := services.GetAllSongs()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve songs",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"songs": songs,
		"count": len(songs),
	})
}

// GetSongByID retrieves a specific song by ID
func GetSongByID(c *fiber.Ctx) error {
	songID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid song ID",
		})
	}

	song, err := services.GetSongByID(songID)
	if err != nil {
		if err.Error() == "song not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Song not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to retrieve song",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"song": song,
	})
}
