package models

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type GetSimilarSongsResponse struct {
	SimilarSongs []SimilarSong `json:"similar_songs"`
	Count        int           `json:"count"`
}

type ListAllSongsResponse struct {
	Songs []SongResult `json:"songs"`
	Count int          `json:"count"`
}

type GetSongByIDResponse struct {
	Song SongResult `json:"song"`
}
