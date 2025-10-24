from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Optional


class VectorRepository(ABC):
    """
    Interface for vector storage operations.
    Any implementation must provide these methods.
    """

    @abstractmethod
    def store_features(
        self, track_id: str, features: np.ndarray, metadata: dict
    ) -> None:
        """Store audio features with metadata."""
        pass

    @abstractmethod
    def find_similar(self, features: np.ndarray, limit: int = 10) -> List[Dict]:
        """Find similar tracks using vector similarity."""
        pass

    @abstractmethod
    def get_features(self, track_id: str) -> Optional[np.ndarray]:
        """Get features for a specific track."""
        pass


class MockVectorRepository(VectorRepository):
    """
    In-memory mock database for development.
    No database needed - perfect for testing your feature extraction first!
    """

    def __init__(self):
        # Simple dictionary acting as our "database"
        self.storage: Dict[str, Dict] = {}
        print("🔧 Using MOCK database (in-memory)")

    def store_features(
        self, track_id: str, features: np.ndarray, metadata: dict
    ) -> None:
        """Store in memory."""
        self.storage[track_id] = {"features": features, "metadata": metadata}
        print(f"✅ Stored track {track_id} in mock DB")

    def find_similar(self, features: np.ndarray, limit: int = 10) -> List[Dict]:
        """
        Mock similarity search using cosine similarity.
        Returns stored tracks sorted by similarity.
        """
        if not self.storage:
            return []

        similarities = []
        for track_id, data in self.storage.items():
            stored_features = data["features"]

            # Calculate cosine similarity
            similarity = self._cosine_similarity(features, stored_features)

            similarities.append(
                {
                    "track_id": track_id,
                    "similarity": float(similarity),
                    "title": data["metadata"].get("title", "Unknown"),
                    "artist": data["metadata"].get("artist", "Unknown"),
                    "youtube_url": data["metadata"].get("youtube_url", ""),
                }
            )

        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        return similarities[:limit]

    def get_features(self, track_id: str) -> Optional[np.ndarray]:
        """Get features from memory."""
        if track_id in self.storage:
            return self.storage[track_id]["features"]
        return None

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors."""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
