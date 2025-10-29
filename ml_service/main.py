"""
Main entry point for the music analysis service.
FastAPI version with dependency injection for repository (mock or PostgreSQL).
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional
import os

# ---------------------------------------------------------------------------
# ENV & CONFIG
# ---------------------------------------------------------------------------
load_dotenv()

from service.extractors.youtube_extractor import MusicAnalysisService
from repositories.vector_repository import VectorRepository
from repositories.pgvector_repository import PGVectorRepository

# from repositories.mock_vector_repository import MockVectorRepository  # optional

FEATURE_DIMENSION = 27  # Adjust to match your model
DB_DSN = os.environ.get(
    "DATABASE_DSN",
    "postgresql://admin:admin@localhost:5430/jetswitch",
)

print(DB_DSN)

# Choose your repository
repository: VectorRepository = PGVectorRepository(dsn=DB_DSN, dim=FEATURE_DIMENSION)
# repository: VectorRepository = MockVectorRepository()  # Use for local testing

music_service = MusicAnalysisService(repository)

# ---------------------------------------------------------------------------
# FASTAPI APP SETUP
# ---------------------------------------------------------------------------
app = FastAPI(title="JetSwitch Music Analysis API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# REQUEST / RESPONSE MODELS
# ---------------------------------------------------------------------------


class AnalyzeRequest(BaseModel):
    url: str
    title: str
    artist_name: str
    source_platform: str
    added_by: Optional[int] = None
    release_date: Optional[str] = None


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


# ---------------------------------------------------------------------------
# ROUTES
# ---------------------------------------------------------------------------


@app.get("/")
def read_root():
    return {"message": "🎵 JetSwitch Music Analysis Service is running!"}


@app.post("/analyze", response_model=SongResponse)
def analyze_song(request: AnalyzeRequest):
    """
    Analyze a song (via YouTube or other URL) and store it in the repository.
    """
    try:
        print(f"🎶 Analyzing new song: {request.title} - {request.artist_name}")
        features = music_service.process_youtube_url(
            url=request.url,
            track_id=request.url,  # temporary ID to process features
            metadata={
                "title": request.title,
                "artist": request.artist_name,
                "youtube_url": request.url,
            },
        )

        repository.store_features(
            title=request.title,
            artist_name=request.artist_name,
            url=request.url,
            song_feature=features,
            source_platform=request.source_platform,
            added_by=request.added_by,
            release_date=request.release_date,
        )

        # Retrieve last stored song
        songs = repository.list_all_songs()
        last_song = songs[-1] if songs else None
        if not last_song:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve stored song."
            )

        return last_song

    except Exception as e:
        print(f"❌ Error in analyze_song: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar", response_model=List[SimilarTrackResponse])
def get_similar(
    id: int = Query(..., description="Song ID to compare against"), limit: int = 10
):
    """
    Find similar songs to a given song ID.
    """
    try:
        features = repository.get_features(id)
        if features is None:
            raise HTTPException(status_code=404, detail=f"Song ID {id} not found.")

        similar = repository.find_similar(features, limit)
        return similar
    except Exception as e:
        print(f"❌ Error in get_similar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/songs", response_model=List[SongResponse])
def list_songs():
    """
    List all stored songs (metadata only).
    """
    try:
        return repository.list_all_songs()
    except Exception as e:
        print(f"❌ Error in list_songs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
