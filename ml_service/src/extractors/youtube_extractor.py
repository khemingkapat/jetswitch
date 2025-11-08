import os
import yt_dlp
import librosa
import tempfile
import numpy as np
from typing import Optional, Tuple
from src.repositories.vector_repository import VectorRepository
from src.models import SongData, SongResult, SimilarSongResult


class MusicAnalysisService:
    """
    Service layer — all business logic resides here.
    The repository is used internally; FastAPI should never access it directly.
    """

    def __init__(self, repository: VectorRepository):
        self.repository = repository  # Private – used only within this service

    def analyze_and_store(self, song_data: SongData) -> Tuple[SongResult, bool]:
        """
        Analyze a song from a URL and store it.

        Returns:
            Tuple[SongResult, bool]: (song_result, is_new)
                - song_result: The stored song as a SongResult object
                - is_new: True if newly inserted, False if URL already existed
        """

        # --- START: OPTIMIZATION ---
        # Step 1: Check if song already exists by URL *before* downloading
        existing_song = self.repository.get_song_by_url(song_data.url)
        if existing_song:
            print(
                f"🔄 Song already exists (URL check): {existing_song['title']} (ID: {existing_song['id']})"
            )
            return SongResult(**existing_song), False
        # --- END: OPTIMIZATION ---

        audio_path = None
        try:
            # Step 2: Download and extract features (only if it's a new song)
            print(f"⬇️ Downloading audio for: {song_data.title}")
            audio_path = self._download_audio(song_data.url)
            print("🔬 Extracting features...")
            features = self._extract_features(audio_path)
            print("✅ Analyzed song features")

            # Step 3: Store in repository
            song_dict, is_new = self.repository.store_features(
                title=song_data.title,
                artist_name=song_data.artist_name,
                url=song_data.url,
                song_feature=features,
                source_platform=song_data.source_platform,
                added_by=song_data.added_by,
                release_date=song_data.release_date,
            )

            if is_new:
                print("💾 Stored new song in repository")
            else:
                # This should rarely happen now, but good as a safety check
                print("🔄 Song already exists in repository (race condition)")

            return SongResult(**song_dict), is_new

        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def find_similar_by_id(
        self,
        song_id: int,
        limit: int = 10,
        exclude_self: bool = True,
    ) -> list[SimilarSongResult]:
        """
        Find similar songs by song ID.
        Returns: A list of similar songs with distance scores.
        """
        # Step 1: Retrieve features
        features = self.repository.get_features(song_id)
        if features is None:
            raise ValueError(f"Song with ID {song_id} not found")

        # Step 2: Find similar songs
        similar = self.repository.find_similars(
            features=features,
            limit=limit + 1 if exclude_self else limit,
            metric="cosine",
            exclude_id=song_id if exclude_self else None,
        )

        # Step 3: Optionally filter out the song itself
        if similar and exclude_self:
            similar = [s for s in similar if s["id"] != song_id]

        return [SimilarSongResult(**song) for song in similar] if similar else []

    def list_all_songs(self) -> list[SongResult]:
        """
        Retrieve all songs from the repository.
        Returns: List of SongResult objects.
        """
        songs = self.repository.list_all_songs()
        return [SongResult(**song) for song in songs]

    def get_song_by_id(self, song_id: int) -> Optional[SongResult]:
        """
        Retrieve a specific song by ID.
        Returns: SongResult or None if not found.
        """
        songs = self.repository.list_all_songs()
        song = next((s for s in songs if s["id"] == song_id), None)
        return SongResult(**song) if song else None

    # ============================================
    # Private helper methods
    # ============================================

    def _download_audio(self, url: str) -> str:
        """Download audio from a given URL using yt_dlp."""
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
        """Extract normalized audio features using librosa."""
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
