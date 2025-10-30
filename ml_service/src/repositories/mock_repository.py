import numpy as np
from .vector_repository import VectorRepository
from typing import Dict, List, Optional


class MockVectorRepository(VectorRepository):
    """
    In-memory mock database for development/testing.
    Simulates storing and searching songs with feature vectors.
    """

    def __init__(self):
        # Simple dict acting as an in-memory songs table
        # Key: song_id (auto incremented)
        # Value: song record (dict)
        self.storage: Dict[int, Dict] = {}
        self._next_id = 1
        print("🔧 Using MOCK vector repository (in-memory)")

    def store_features(
        self,
        title: str,
        artist_name: str,
        url: str,
        song_feature: np.ndarray,
        source_platform: str,
        added_by: Optional[int] = None,
        release_date: Optional[str] = None,
    ) -> None:
        """Store or update song record in memory."""
        # Check if song already exists (by URL)
        for song_id, song in self.storage.items():
            if song["url"] == url:
                song.update(
                    {
                        "title": title,
                        "artist_name": artist_name,
                        "release_date": release_date,
                        "song_feature": song_feature,
                        "source_platform": source_platform,
                        "added_by": added_by,
                    }
                )
                print(f"🌀 Updated mock song: {title} by {artist_name}")
                return

        # Otherwise, insert new record
        song_id = self._next_id
        self._next_id += 1

        self.storage[song_id] = {
            "id": song_id,
            "title": title,
            "artist_name": artist_name,
            "release_date": release_date,
            "url": url,
            "song_feature": song_feature,
            "source_platform": source_platform,
            "added_by": added_by,
        }
        print(f"✅ Stored mock song: {title} by {artist_name}")

    def find_similars(self, features: np.ndarray, limit: int = 10) -> List[Dict]:
        """Mock similarity search using cosine similarity."""
        if not self.storage:
            return []

        similarities = []
        for song in self.storage.values():
            stored_features = song["song_feature"]

            similarity = self._cosine_similarity(features, stored_features)
            similarities.append(
                {
                    "id": song["id"],
                    "title": song["title"],
                    "artist_name": song["artist_name"],
                    "url": song["url"],
                    "source_platform": song["source_platform"],
                    "similarity": float(similarity),
                }
            )

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:limit]

    def get_features(self, song_id: int) -> Optional[np.ndarray]:
        """Retrieve feature vector for a given song ID."""
        song = self.storage.get(song_id)
        if song:
            return song["song_feature"]
        return None

    def list_all_songs(self) -> List[Dict]:
        """List all stored songs (excluding feature vector)."""
        return [
            {
                "id": song["id"],
                "title": song["title"],
                "artist_name": song["artist_name"],
                "url": song["url"],
                "source_platform": song["source_platform"],
                "added_by": song["added_by"],
                "release_date": song["release_date"],
            }
            for song in self.storage.values()
        ]

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        if denom == 0:
            return 0.0
        return np.dot(a, b) / denom
