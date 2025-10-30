from pydantic import BaseModel
from typing import Optional


class SongData(BaseModel):
    """Data transfer object for song information"""

    url: str
    title: str
    artist_name: str
    source_platform: str
    added_by: Optional[int] = None
    release_date: Optional[str] = None


class SongResult(BaseModel):
    """Result from storing a song"""

    id: int
    title: str
    artist_name: str
    url: str
    source_platform: str
    added_by: Optional[int]
    added_at: Optional[str]


class SimilarSongResult(BaseModel):
    """Result from similarity search"""

    id: int
    title: str
    artist_name: str
    url: str
    source_platform: str
    distance: float
