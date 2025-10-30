from pydantic import BaseModel
from typing import Optional


class SimilarTrackResponse(BaseModel):
    id: int
    title: str
    artist_name: str
    url: str
    source_platform: str
    distance: float


class SongResponse(BaseModel):
    id: int
    title: str
    artist_name: str
    url: str
    source_platform: str
    added_by: Optional[int]
    release_date: Optional[str]
