import yt_dlp
import librosa
import tempfile
import os
import numpy as np
from typing import List, Dict

from repositories.vector_repositories import VectorRepository


class MusicAnalysisService:
    """
    Main service that uses the repository.

    KEY POINT: This service doesn't care if the repository is mock or real!
    It just calls the interface methods.
    """

    def __init__(self, repository: VectorRepository):
        # This is dependency injection!
        # We pass in ANY repository that implements the interface
        self.repository = repository

    def process_youtube_url(
        self, url: str, track_id: str, metadata: dict | None = None
    ) -> np.ndarray:
        """Download, extract features, and store in repository."""
        audio_path = None
        try:
            # Download audio
            audio_path = self._download_audio(url)

            # Extract features
            features = self._extract_features(audio_path)

            # Store using the repository (mock or real - we don't care!)
            metadata = metadata or {}
            metadata["youtube_url"] = url
            self.repository.store_features(track_id, features, metadata)

            return features
        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def find_similar_tracks(self, youtube_url: str, limit: int = 10) -> List[Dict]:
        """Find similar tracks to a given YouTube URL."""
        audio_path = None
        try:
            audio_path = self._download_audio(youtube_url)
            features = self._extract_features(audio_path)
            return self.repository.find_similar(features, limit)
        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def _download_audio(self, url: str) -> str:
        """Download YouTube audio."""
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
        return features
