from abc import ABC, abstractmethod
import numpy as np
from typing import List, Dict, Optional, Tuple


class VectorRepository(ABC):
    """
    Interface for vector storage operations.
    Any implementation must provide these methods.
    """

    @abstractmethod
    def get_song_by_url(self, url: str) -> Optional[Dict]:
        """Get a song's metadata by its unique URL."""
        pass

    @abstractmethod
    def store_features(
        self,
        title: str,
        artist_name: str,
        url: str,
        song_feature: np.ndarray,
        source_platform: str,
        added_by: Optional[int] = None,
        release_date: Optional[str] = None,
    ) -> Tuple[Dict, bool]:
        """
        Store audio features with metadata.

        Returns:
            Tuple[Dict, bool]: (song_data, is_new)
                - song_data: Dictionary containing the song information
                - is_new: True if newly inserted, False if URL already existed
        """
        pass

    @abstractmethod
    def find_similars(
        self,
        features: np.ndarray,
        limit: int = 10,
        metric: str = "cosine",
        exclude_id: Optional[int] = None,
    ) -> Optional[List[Dict]]:
        """Find similar tracks using vector similarity."""
        pass

    @abstractmethod
    def get_features(self, song_id: int) -> Optional[np.ndarray]:
        """Get features for a specific track."""
        pass

    @abstractmethod
    def list_all_songs(self) -> List[Dict]:
        """Lists all stored track_id and metadata."""
        pass
