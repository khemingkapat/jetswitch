import yt_dlp
import librosa
import tempfile
import os
import numpy as np
from typing import Optional
from repositories.vector_repository import VectorRepository
from src.models import SongData, SongResult, SimilarSongResult


# Pydantic models for service layer


class MusicAnalysisService:
    """
    Service layer - ALL business logic here.
    Repository is ONLY used internally by this service.
    FastAPI should NEVER access repository directly!
    """

    def __init__(self, repository: VectorRepository):
        self.repository = repository  # Private - only used internally

    def analyze_and_store(self, song_data: SongData) -> SongResult:
        """
        Analyze a song from URL and store it.
        Returns: Stored song with ID

        This method handles the entire workflow internally.
        """
        audio_path = None
        try:
            # Step 1: Download and extract features
            audio_path = self._download_audio(song_data.url)
            features = self._extract_features(audio_path)

            # Step 2: Store in repository
            self.repository.store_features(
                title=song_data.title,
                artist_name=song_data.artist_name,
                url=song_data.url,
                song_feature=features,
                source_platform=song_data.source_platform,
                added_by=song_data.added_by,
                release_date=song_data.release_date,
            )

            # Step 3: Get the stored song and return
            songs = self.repository.list_all_songs()
            last_song = songs[-1] if songs else None

            if not last_song:
                raise ValueError("Failed to retrieve stored song")

            return SongResult(**last_song)

        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def find_similar_by_id(
        self, song_id: int, limit: int = 10, exclude_self: bool = True
    ) -> list[SimilarSongResult]:
        """
        Find similar songs by song ID.
        Returns: List of similar songs with distance scores

        This encapsulates the entire similarity search workflow.
        """
        # Get features from repository
        features = self.repository.get_features(song_id)
        if features is None:
            raise ValueError(f"Song with ID {song_id} not found")

        # Find similar songs
        similar = self.repository.find_similar(
            features=features,
            limit=limit + 1 if exclude_self else limit,
            metric="cosine",
            exclude_id=song_id if exclude_self else None,
        )

        # Convert to Pydantic models
        return [SimilarSongResult(**song) for song in similar]

    def list_all_songs(self) -> list[SongResult]:
        """
        Get all songs from the repository.
        Returns: List of all stored songs
        """
        songs = self.repository.list_all_songs()
        return [SongResult(**song) for song in songs]

    def get_song_by_id(self, song_id: int) -> Optional[SongResult]:
        """
        Get a specific song by ID.
        Returns: Song or None if not found
        """
        songs = self.repository.list_all_songs()
        song = next((s for s in songs if s["id"] == song_id), None)
        return SongResult(**song) if song else None

    # ============================================
    # Private helper methods
    # ============================================

    def _download_audio(self, url: str) -> str:
        """Download audio from URL."""
        tempdir = tempfile.mkdtemp()
        output_path = os.path.join(tempdir, "%(id)s.%(ext)s")

        ydl_opts = {
            "format": "ba[ext=m4a]/bestaudio/best",
            "outtmpl": output_path,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
            "quiet": True,
            "noprogress": True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return os.path.join(tempdir, f"{info['id']}.wav")

    def _extract_features(self, audio_path: str) -> np.ndarray:
        """Extract audio features using librosa."""
        y, sr = librosa.load(audio_path, sr=None)

        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        spec_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)

        tempo = np.array([tempo]).flatten()
        spec_centroid_mean = np.mean(spec_centroid).reshape(
            1,
        )
        mfcc_mean = (
            np.mean(mfcc, axis=1).flatten()
            if mfcc.ndim > 1
            else np.array([np.mean(mfcc)])
        )
        chroma_mean = (
            np.mean(chroma, axis=1).flatten()
            if chroma.ndim > 1
            else np.array([np.mean(chroma)])
        )

        features = np.concatenate([tempo, spec_centroid_mean, mfcc_mean, chroma_mean])

        # Normalize for cosine similarity
        features = features / (np.linalg.norm(features) + 1e-8)

        return features
