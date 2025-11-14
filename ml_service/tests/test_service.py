import pytest
import numpy as np
from unittest.mock import MagicMock, patch
import math

from src.extractors.youtube_extractor import MusicAnalysisService
from src.models import SongData, SongResult

# Assuming the dimension is 27
FEATURE_DIMENSION = 27
# Standard mock features for generic tests
mock_features = np.ones(FEATURE_DIMENSION) / np.sqrt(FEATURE_DIMENSION)


@pytest.fixture
def mock_repo():
    """Mock repository instance for the service layer."""
    return MagicMock()


@pytest.fixture
def mock_service(mock_repo):
    """MusicAnalysisService initialized with a mock repository."""
    return MusicAnalysisService(mock_repo)


@pytest.fixture
def test_song_data():
    """Standard SongData object for a test song."""
    return SongData(
        url="http://test.com/new_track",
        title="Mock Track",
        artist_name="Mock Artist",
        source_platform="youtube",
        added_by=100,
    )


def test_analyze_new_song_success(
    mock_service: MusicAnalysisService, mock_repo: MagicMock, test_song_data: SongData
):
    """Test storing a new song correctly invokes download/extract/store sequence."""

    # Setup mocks for success case
    mock_repo.get_song_by_url.return_value = None  # Indicates not existing
    mock_repo.store_features.return_value = (
        SongResult(
            id=1,
            title=test_song_data.title,
            artist_name=test_song_data.artist_name,
            url=test_song_data.url,
            source_platform=test_song_data.source_platform,
            added_by=test_song_data.added_by,
            added_at=None,
        ).model_dump(),
        True,
    )

    with (
        patch.object(
            mock_service, "_download_audio", return_value="/tmp/audio.wav"
        ) as mock_download,
        patch.object(
            mock_service, "_extract_features", return_value=mock_features
        ) as mock_extract,
        patch("os.path.exists", return_value=False),  # Mock file cleanup
    ):
        result, is_new = mock_service.analyze_and_store(test_song_data)

        # Assertions
        mock_download.assert_called_once()
        mock_extract.assert_called_once()
        mock_repo.store_features.assert_called_once()
        assert is_new is True
        assert result.title == "Mock Track"


def test_analyze_existing_song_skips_download(
    mock_service: MusicAnalysisService, mock_repo: MagicMock, test_song_data: SongData
):
    """Test that if the song exists, download and feature extraction are skipped."""

    # Setup mock to return existing song metadata
    existing_song_data = SongResult(
        id=99,
        title="Existing Track",
        artist_name="Old Artist",
        url=test_song_data.url,
        source_platform="youtube",
        added_by=100,
        added_at=None,
    ).model_dump()
    mock_repo.get_song_by_url.return_value = existing_song_data

    with (
        patch.object(mock_service, "_download_audio") as mock_download,
        patch.object(mock_service, "_extract_features") as mock_extract,
    ):
        result, is_new = mock_service.analyze_and_store(test_song_data)

        # Assertions: Download/extract MUST NOT be called
        mock_download.assert_not_called()
        mock_extract.assert_not_called()
        mock_repo.get_song_by_url.assert_called_once()
        mock_repo.store_features.assert_not_called()
        assert is_new is False
        assert result.title == "Existing Track"


def test_find_similar_by_id_score_re_ranking(
    mock_service: MusicAnalysisService, mock_repo: MagicMock
):
    """
    Test the 70% Audio / 30% Feedback scoring and re-ranking logic.
    Scores: Score = (7.0 * Sim) + (3.0 * tanh(Votes * 0.2))
    """
    query_song_id = 1

    # 1. Setup mock data
    mock_repo.get_features.return_value = mock_features

    # Candidate A: Perfect Audio (dist=0.0, sim=1.0). Bad Feedback (votes=-10)
    # Candidate B: Poor Audio (dist=0.5, sim=0.5). Perfect Feedback (votes=+100)
    candidate_a_id, candidate_b_id = 10, 20

    mock_raw_similars = [
        # Note: distance is stored in repo, similarity = 1 - distance
        {
            "id": candidate_a_id,
            "title": "A - Perfect Audio",
            "artist_name": "Art",
            "url": "urlA",
            "source_platform": "y",
            "distance": 0.0,
        },  # Sim 1.0
        {
            "id": candidate_b_id,
            "title": "B - Poor Audio",
            "artist_name": "Art",
            "url": "urlB",
            "source_platform": "y",
            "distance": 0.5,
        },  # Sim 0.5
    ]

    mock_feedback_scores = {
        candidate_a_id: -10,  # Total Votes -10
        candidate_b_id: 100,  # Total Votes +100
    }

    mock_repo.find_similars.return_value = mock_raw_similars
    mock_repo.get_feedback_scores.return_value = mock_feedback_scores

    results = mock_service.find_similar_by_id(
        query_song_id, limit=2, exclude_self=False
    )

    # Calculation based on internal service logic:
    # Score A: (7.0 * 1.0) + (3.0 * tanh(-10 * 0.2)) ≈ 7.0 + (3.0 * -0.379) = 5.86
    # Score B: (7.0 * 0.5) + (3.0 * tanh(100 * 0.2)) ≈ 3.5 + (3.0 * 1.0) = 6.5

    # Expected ranking by final score: B (6.5) > A (5.86)

    assert results[0].id == candidate_b_id
    assert results[1].id == candidate_a_id

    # Use approx for float comparisons
    assert results[0].score == pytest.approx(6.5, abs=0.1)
    assert results[1].score == pytest.approx(5.86, abs=0.1)


def test_store_user_feedback(mock_service: MusicAnalysisService, mock_repo: MagicMock):
    """Test that the service correctly delegates feedback to the repository."""

    mock_service.store_user_feedback(101, 1, 5, 1)

    mock_repo.store_feedback.assert_called_once_with(101, 1, 5, 1)
