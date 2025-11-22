import os
import yt_dlp
import librosa
import tempfile
import numpy as np
from typing import Optional, Tuple, Dict
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
        Find similar songs by song ID, now with the distance-based score and
        negative-only feedback adjustment (max score of 10, min score of 0).
        Returns: A list of similar songs with adjusted scores (0-10 scale).
        """

        # --- START: NEW SCORE CONFIGURATION ---
        # The score is primarily driven by 10 * (1 - distance).
        # This value controls how "fast" the negative vote penalty climbs.
        # A smaller value (e.g., 0.1) requires more downvotes for a large penalty.
        VOTE_PENALTY_SENSITIVITY = 0.1
        # --- END: NEW SCORE CONFIGURATION ---

        # Step 1: Retrieve features
        features = self.repository.get_features(song_id)
        if features is None:
            raise ValueError(f"Song with ID {song_id} not found")

        # Step 2: Find similar songs (get a few extra to allow for re-ranking)
        search_limit = limit + 5  # Get a few extra candidates
        similar_raw = self.repository.find_similars(
            features=features,
            limit=search_limit,
            metric="cosine",
            exclude_id=None,
        )

        if not similar_raw:
            return []

        # Step 3: Get feedback scores for these candidates
        candidate_ids = [song["id"] for song in similar_raw]
        feedback_scores = self.repository.get_feedback_scores(
            query_song_id=song_id, suggested_song_ids=candidate_ids
        )

        # Step 4: Calculate new combined score
        results = []

        for song in similar_raw:
            # Exclude self if needed
            if exclude_self and song["id"] == song_id:
                continue

            distance = song["distance"]  # Cosine Distance (0.0 to 1.0)

            # 1. Calculate Base Score (0 to 10)
            # Distance=0 (Perfect Match) -> BaseScore=10.0
            # Distance=1 (Max Distance) -> BaseScore=0.0
            base_score = 10.0 * (1.0 - distance * 100)

            # Get vote score (Positive = upvotes, Negative = downvotes)
            total_votes = feedback_scores.get(song["id"], 0)

            # 2. Calculate Penalty Score (>= 0)
            # Only apply a penalty if total_votes is negative (net downvotes).
            if total_votes < 0:
                # np.tanh(abs(total_votes) * sensitivity) results in a value between 0 and 1.
                # This is scaled up to 10 to represent the maximum possible penalty.
                penalty = 10.0 * np.tanh(abs(total_votes) * VOTE_PENALTY_SENSITIVITY)
            else:
                # If votes are 0 or positive (net upvotes), the penalty is 0.
                penalty = 0.0

            # 3. Combine scores
            # Positive feedback (penalty=0) keeps the score at the base_score (max 10).
            # Negative feedback (penalty>0) reduces the score from the base_score.
            combined_score = base_score - penalty

            # 4. Enforce the minimum score of 0.
            combined_score = max(0.0, combined_score)

            results.append(
                {
                    "song": SimilarSongResult(
                        id=song["id"],
                        title=song["title"],
                        artist_name=song["artist_name"],
                        url=song["url"],
                        source_platform=song["source_platform"],
                        score=combined_score,  # Use the new 0-10 scale score
                    ),
                    "combined_score": combined_score,
                }
            )

        # Step 5: Re-sort based on the new combined score
        results.sort(key=lambda x: x["combined_score"], reverse=True)

        # Step 6: Return the top 'limit' songs
        # The 'score' field in the returned object is now on your 0-10 scale.
        return [res["song"] for res in results[:limit]]

    def store_user_feedback(
        self, user_id: int, query_song_id: int, suggested_song_id: int, vote: int
    ):
        """Passes feedback from the API to the repository."""
        if vote not in [1, -1]:
            raise ValueError("Vote must be 1 (up) or -1 (down)")

        print(
            f"🔔 Service storing feedback: User {user_id} on {query_song_id} -> {suggested_song_id} ({vote})"
        )
        self.repository.store_feedback(user_id, query_song_id, suggested_song_id, vote)

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

        # --- NEW SECURE COOKIE LOGIC ---
        cookies_file = os.environ.get("COOKIES_FILE")
        if cookies_file:
            print(f"🍪 Using cookies file: {cookies_file}")
            ydl_opts["cookiefile"] = cookies_file
        # -------------------------------

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
