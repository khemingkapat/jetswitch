package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/khemingkapat/jetswitch/backend/models"
)

var mlServiceBaseURL = os.Getenv("ML_SERVICE_URL")

// AnalyzeAndStoreSong sends a song to the ML service for analysis and storage
func AnalyzeAndStoreSong(req models.AnalyzeMusicRequest) (*models.SongResult, error) {
	url := fmt.Sprintf("%s/analyze", mlServiceBaseURL)

	requestBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ML service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error (status %d): %s", resp.StatusCode, string(body))
	}

	var songResult models.SongResult
	if err := json.NewDecoder(resp.Body).Decode(&songResult); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &songResult, nil
}

// FindSimilarSongs retrieves similar songs from the ML service by song ID
func FindSimilarSongs(songID int, limit int, excludeSelf bool) ([]models.SimilarSong, error) {
	url := fmt.Sprintf("%s/similar?id=%d&limit=%d&exclude_self=%t",
		mlServiceBaseURL, songID, limit, excludeSelf)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ML service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error (status %d): %s", resp.StatusCode, string(body))
	}

	var similarSongs []models.SimilarSong
	if err := json.NewDecoder(resp.Body).Decode(&similarSongs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return similarSongs, nil
}

// GetAllSongs retrieves all stored songs from the ML service
func GetAllSongs() ([]models.SongResult, error) {
	url := fmt.Sprintf("%s/songs", mlServiceBaseURL)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ML service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error (status %d): %s", resp.StatusCode, string(body))
	}

	var songs []models.SongResult
	if err := json.NewDecoder(resp.Body).Decode(&songs); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return songs, nil
}

// GetSongByID retrieves a specific song by ID from the ML service
func GetSongByID(songID int) (*models.SongResult, error) {
	url := fmt.Sprintf("%s/songs/%d", mlServiceBaseURL, songID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ML service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("song not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("ML service error (status %d): %s", resp.StatusCode, string(body))
	}

	var song models.SongResult
	if err := json.NewDecoder(resp.Body).Decode(&song); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &song, nil
}
