package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/khemingkapat/jetswitch/backend/models"
	"github.com/khemingkapat/jetswitch/backend/services"
)

// AnalyzeMusic handles music analysis and similarity search
// @Summary Analyze a new track and find similar songs
// @Description Sends a song URL and metadata to the ML service to extract features, store the song, and retrieve a list of similar tracks.
// @Tags Music
// @Accept json
// @Produce json
// @Param request body models.AnalyzeMusicRequest true "Song URL and metadata"
// @Success 200 {object} models.AnalyzeMusicResponse "Returns the processed song and a list of similar songs."
// @Failure 400 {object} models.ErrorResponse "Required fields are missing or invalid request body."
// @Failure 500 {object} models.ErrorResponse "Failed to communicate with ML service or an internal error occurred during analysis."
// @Router /api/music/analyze [post]
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
// @Summary Find similar songs by ID
// @Description Finds songs in the database similar to a specified track ID.
// @Tags Music
// @Accept json
// @Produce json
// @Param id query int true "The ID of the song to search for similarities"
// @Param limit query int false "Maximum number of similar songs to return (default: 10)"
// @Param exclude_self query bool false "Exclude the query song from results (default: true)"
// @Success 200 {object} models.GetSimilarSongsResponse "A list of similar songs."
// @Failure 400 {object} models.ErrorResponse "Song ID parameter is missing."
// @Failure 500 {object} models.ErrorResponse "Failed to communicate with ML service or an internal error occurred."
// @Router /api/music/similar [get]
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
// @Summary List all stored songs
// @Description Retrieves all song metadata stored in the database.
// @Tags Music
// @Accept json
// @Produce json
// @Success 200 {object} models.ListAllSongsResponse "A list of all songs."
// @Failure 500 {object} models.ErrorResponse "Failed to communicate with ML service or an internal error occurred."
// @Router /api/music/songs [get]
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
// @Summary Get a song by ID
// @Description Retrieves metadata for a single song by its ID.
// @Tags Music
// @Accept json
// @Produce json
// @Param id path int true "Song ID"
// @Success 200 {object} models.GetSongByIDResponse "The requested song metadata."
// @Failure 400 {object} models.ErrorResponse "Invalid song ID format."
// @Failure 404 {object} models.ErrorResponse "Song not found."
// @Failure 500 {object} models.ErrorResponse "Failed to communicate with ML service or an internal error occurred."
// @Router /api/music/songs/{id} [get]
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

// HandleMusicFeedback stores user feedback
// @Summary Store song recommendation feedback
// @Description Stores a user's explicit vote (up/down) on a suggested song match.
// @Tags Music, Feedback
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.FeedbackRequest true "Feedback details (query_song_id, suggested_song_id, vote: 1 or -1)"
// @Success 200 {object} models.MessageResponse "Feedback received."
// @Failure 400 {object} models.ErrorResponse "Invalid request body or invalid vote value."
// @Failure 401 {object} models.ErrorResponse "Missing or invalid JWT token."
// @Failure 500 {object} models.ErrorResponse "Failed to communicate with ML service or an internal error occurred."
// @Router /api/music/feedback [post]
func HandleMusicFeedback(c *fiber.Ctx) error {
	var req models.FeedbackRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get user ID from the auth middleware
	userID, ok := c.Locals("user_id").(int)
	if !ok {
		// This should not happen if middleware is applied correctly
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid user session",
		})
	}

	// Create the request for the ML service
	mlReq := models.MLFeedbackRequest{
		UserID:          userID,
		QuerySongID:     req.QuerySongID,
		SuggestedSongID: req.SuggestedSongID,
		Vote:            req.Vote,
	}

	// Send to ML service
	if err := services.SendFeedbackToMLService(mlReq); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to process feedback",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Feedback received",
	})
}
