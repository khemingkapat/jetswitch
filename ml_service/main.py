"""
FastAPI layer - ONLY handles HTTP concerns.
All business logic delegated to MusicAnalysisService.
Repository is NEVER accessed directly from here!
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional
import os

load_dotenv()

from src.extractors.youtube_extractor import (
    MusicAnalysisService,
)
from src.repositories.pgvector_repository import PGVectorRepository
from src.models import (
    SongData,
    SongResult,
    SimilarSongResult,
)

# ============================================
# Setup
# ============================================

FEATURE_DIMENSION = 27
DB_DSN = os.environ.get(
    "DATABASE_DSN",
    "postgresql://admin:admin@localhost:5430/jetswitch",
)

# Initialize repository and service
repository = PGVectorRepository(dsn=DB_DSN, dim=FEATURE_DIMENSION)
music_service = MusicAnalysisService(repository)

app = FastAPI(title="JetSwitch Music Analysis API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# API Request Models (FastAPI specific)
# ============================================


class AnalyzeRequest(BaseModel):
    """HTTP request model for /analyze endpoint"""

    url: str
    title: str
    artist_name: str
    source_platform: str
    added_by: Optional[int] = None
    release_date: Optional[str] = None


# ============================================
# Routes - Thin layer, delegates to service
# ============================================


@app.get("/")
def read_root():
    return {"message": "🎵 JetSwitch Music Analysis Service is running!"}


@app.post("/analyze", response_model=SongResult)
def analyze_song(request: AnalyzeRequest):
    """
    Analyze and store a song.
    Delegates to service.analyze_and_store()
    """
    try:
        print(f"🎶 Analyzing: {request.title} by {request.artist_name}")

        # Convert FastAPI model to service model
        song_data = SongData(
            url=request.url,
            title=request.title,
            artist_name=request.artist_name,
            source_platform=request.source_platform,
            added_by=request.added_by,
            release_date=request.release_date,
        )

        # Delegate to service - service handles everything
        result = music_service.analyze_and_store(song_data)

        print(f"✅ Stored song with ID: {result.id}")
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar", response_model=List[SimilarSongResult])
def get_similar_by_id(
    id: int = Query(..., description="Song ID to find similar songs for"),
    limit: int = Query(10, ge=1, le=100, description="Number of results"),
    exclude_self: bool = Query(True, description="Exclude the query song"),
):
    """
    Find similar songs by ID.
    Delegates to service.find_similar_by_id()
    """
    try:
        print(f"🔍 Finding similar songs for ID: {id}")

        # Delegate to service - service handles everything
        similar = music_service.find_similar_by_id(
            song_id=id,
            limit=limit,
            exclude_self=exclude_self,
        )

        print(f"✅ Found {len(similar)} similar songs")
        return similar

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/songs", response_model=List[SongResult])
def list_songs():
    """
    List all songs.
    Delegates to service.list_all_songs()
    """
    try:
        return music_service.list_all_songs()
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/songs/{song_id}", response_model=SongResult)
def get_song(song_id: int):
    """
    Get a specific song by ID.
    Delegates to service.get_song_by_id()
    """
    try:
        song = music_service.get_song_by_id(song_id)
        if not song:
            raise HTTPException(status_code=404, detail=f"Song {song_id} not found")
        return song
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
