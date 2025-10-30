from pydantic import BaseModel
from typing import Optional


class AnalyzeRequest(BaseModel):
    url: str
    title: str
    artist_name: str
    source_platform: str
    added_by: Optional[int] = None
    release_date: Optional[str] = None
