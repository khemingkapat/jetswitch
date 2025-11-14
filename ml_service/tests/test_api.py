import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Import the main FastAPI app and the underlying service to patch external dependencies
from main import app as fast_app, music_service, FEATURE_DIMENSION
from src.extractors.youtube_extractor import MusicAnalysisService
from src.models import SimilarSongResult, SongResult

# Define mock features for the mocked extraction process
MOCK_FEATURES = np.ones(FEATURE_DIMENSION) / np.sqrt(FEATURE_DIMENSION)


@pytest.fixture
def client():
    """FastAPI TestClient instance (provided by conftest)."""
    return TestClient(fast_app)


@pytest.fixture
def mock_external_deps():
    """Mock external I/O (downloading, extracting) to isolate API and DB logic."""
    # We mock the parts of the service that handle external dependencies
    with (
        patch.object(
            MusicAnalysisService, "_download_audio", return_value="/tmp/test.wav"
        ),
        patch.object(
            MusicAnalysisService, "_extract_features", return_value=MOCK_FEATURES
        ),
        patch("os.path.exists", return_value=False),
    ):
        yield


# --- Test Cases ---


def test_read_root(client: TestClient):
    """Test GET / endpoint is running."""
    response = client.get("/")
    assert response.status_code == 200
    assert "JetSwitch" in response.json()["message"]


def test_analyze_song_new_success(client: TestClient, repository, mock_external_deps):
    """Test POST /analyze for a new song creation."""
    request_data = {
        "url": "http://youtube.com/api_test_new",
        "title": "API New Track",
        "artist_name": "API New Artist",
        "source_platform": "youtube",
        "added_by": 1,
    }

    response = client.post("/analyze", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["is_new"] is True
    assert data["song"]["title"] == "API New Track"
    assert data["song"]["id"] == 1


def test_analyze_song_existing_returns_no_new(
    client: TestClient, repository, mock_external_deps
):
    """Test POST /analyze for an existing song returns the old data and is_new=false."""

    # 1. Store the song directly via the repository
    repository.store_features(
        title="Existing Track",
        artist_name="Old Artist",
        url="http://youtube.com/api_test_existing",
        song_feature=MOCK_FEATURES,
        source_platform="youtube",
    )

    # 2. Call the API again with the same URL
    request_data = {
        "url": "http://youtube.com/api_test_existing",
        "title": "Should Not Store This",
        "artist_name": "Should Not Store This",
        "source_platform": "youtube",
    }
    response = client.post("/analyze", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["is_new"] is False
    assert data["song"]["title"] == "Existing Track"  # Should return original title


def test_analyze_song_validation_failure(client: TestClient):
    """Test POST /analyze fails with a 422 for missing required fields (FastAPI validation)."""
    # Missing 'url' field
    request_data = {
        "title": "Bad Request",
        "artist_name": "Bad Artist",
        "source_platform": "youtube",
    }

    response = client.post("/analyze", json=request_data)

    assert response.status_code == 422


def test_get_similar_by_id_success(client: TestClient, repository):
    """Test GET /similar successfully retrieves results after songs are stored."""

    # Setup data with known relation
    v1 = np.ones(FEATURE_DIMENSION) / np.sqrt(FEATURE_DIMENSION)
    v2 = v1 * 0.99
    v3 = v1 * 0.5

    song1, _ = repository.store_features("Query Song", "A", "url1", v1, "youtube")
    song2, _ = repository.store_features("Similar", "B", "url2", v2, "youtube")
    song3, _ = repository.store_features("Less Similar", "C", "url3", v3, "youtube")

    response = client.get(f"/similar?id={song1['id']}&limit=2")

    assert response.status_code == 200
    results = [SimilarSongResult(**d) for d in response.json()]

    assert len(results) == 2  # Should exclude self
    assert results[0].id == song2["id"]  # Should be most similar
    assert results[0].score > results[1].score


def test_get_similar_by_id_not_found(client: TestClient):
    """Test GET /similar returns a 404 when the query song does not exist."""
    response = client.get("/similar?id=99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]


def test_store_feedback_success(client: TestClient, repository):
    """Test POST /feedback endpoint successfully stores a vote."""

    # Create necessary foreign key constraints in DB
    user_id = 55
    song_q_id = repository.store_features("Q", "Q", "url_q", MOCK_FEATURES, "youtube")[
        0
    ]["id"]
    song_s_id = repository.store_features("S", "S", "url_s", MOCK_FEATURES, "youtube")[
        0
    ]["id"]

    request_data = {
        "user_id": user_id,
        "query_song_id": song_q_id,
        "suggested_song_id": song_s_id,
        "vote": 1,  # Upvote
    }

    response = client.post("/feedback", json=request_data)

    assert response.status_code == 200
    assert response.json()["message"] == "Feedback received successfully"

    # Verify the feedback is in the database
    scores = repository.get_feedback_scores(song_q_id, [song_s_id])
    assert scores[song_s_id] == 1
