package models

// AnalyzeMusicRequest represents the request body for music analysis
type AnalyzeMusicRequest struct {
	URL            string  `json:"url"`
	Title          string  `json:"title"`
	ArtistName     string  `json:"artist_name"`
	SourcePlatform string  `json:"source_platform"`
	AddedBy        *int    `json:"added_by,omitempty"`
	ReleaseDate    *string `json:"release_date,omitempty"`
}

// SongResult represents a stored song with metadata
type SongResult struct {
	ID             int     `json:"id"`
	Title          string  `json:"title"`
	ArtistName     string  `json:"artist_name"`
	URL            string  `json:"url"`
	SourcePlatform string  `json:"source_platform"`
	AddedBy        *int    `json:"added_by"`
	AddedAt        *string `json:"added_at"`
}

// SimilarSong represents a similar song result with distance score
type SimilarSong struct {
	ID             int     `json:"id"`
	Title          string  `json:"title"`
	ArtistName     string  `json:"artist_name"`
	URL            string  `json:"url"`
	SourcePlatform string  `json:"source_platform"`
	Distance       float64 `json:"distance"`
}

// AnalyzeMusicResponse represents the complete response
type AnalyzeMusicResponse struct {
	Song         SongResult    `json:"song"`
	SimilarSongs []SimilarSong `json:"similar_songs"`
	Message      string        `json:"message"`
}
