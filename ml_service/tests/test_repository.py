import pytest
import numpy as np
import math
from src.repositories.pgvector_repository import PGVectorRepository
from src.repositories.vector_repository import VectorRepository

# Assuming the dimension is 27
FEATURE_DIMENSION = 27


def test_store_and_retrieve_song(
    repository: PGVectorRepository, mock_features: np.ndarray, test_user_id: int
):
    """Test inserting a new song and retrieving it by URL."""
    song_data, is_new = repository.store_features(
        title="Repo Test Song",
        artist_name="Database Artist",
        url="http://test.com/store_features",
        song_feature=mock_features,
        source_platform="youtube",
        added_by=test_user_id,  # Use the newly created test user ID
    )

    assert is_new is True
    assert song_data["title"] == "Repo Test Song"

    retrieved_song = repository.get_song_by_url("http://test.com/store_features")
    assert retrieved_song["title"] == "Repo Test Song"
    assert retrieved_song["id"] == song_data["id"]


def test_store_duplicate_url_returns_existing(
    repository: PGVectorRepository, mock_features: np.ndarray, test_user_id: int
):
    """Test that attempting to store a song with an existing URL returns the original data and is_new=False."""
    # Store first time
    original_data, _ = repository.store_features(
        title="Original Title",
        artist_name="Original Artist",
        url="http://test.com/dupe_url",
        song_feature=mock_features,
        source_platform="youtube",
        added_by=test_user_id,  # Use the newly created test user ID
    )

    # Attempt to store again with different title
    new_data, is_new = repository.store_features(
        title="New Attempt Title",
        artist_name="New Attempt Artist",
        url="http://test.com/dupe_url",  # Same URL
        song_feature=mock_features,
        source_platform="youtube",
        added_by=test_user_id,  # Use the newly created test user ID
    )

    assert is_new is False
    assert (
        new_data["title"] == original_data["title"]
    )  # Should return the original metadata


def test_find_similars_ranking(repository: PGVectorRepository, test_user_id: int):
    """Test if the vector search correctly ranks results by cosine distance."""

    # Setup songs with known relationships (using 4D vectors for clarity, but works for 27D)

    # Note: PGVector's cosine distance is 1 - similarity.
    # Smallest distance = highest similarity.

    # Normalize vectors to ensure correct pgvector cosine calculation
    def normalize_vector(v):
        v = np.array(v)
        return v / (np.linalg.norm(v) + 1e-8)

    # Use the mock_features to generate mock vectors for the 27D expected feature dimension
    v_query = normalize_vector(np.random.rand(FEATURE_DIMENSION) * 0.5 + 0.5)

    # 1. Very Similar (distance near 0)
    v_similar = v_query * 0.99

    # 2. Somewhat Similar (distance moderate)
    v_medium = normalize_vector(np.random.rand(FEATURE_DIMENSION) * 0.5 + 0.5)

    # 3. Orthogonal/Dissimilar (distance near 1)
    v_dissimilar = normalize_vector(np.random.rand(FEATURE_DIMENSION) * 0.2)

    # Store songs using the test user ID
    song_q, _ = repository.store_features(
        "Query", "Q", "url_q", v_query, "youtube", added_by=test_user_id
    )
    song_similar, _ = repository.store_features(
        "Most Similar", "B", "url_sim", v_similar, "youtube", added_by=test_user_id
    )
    song_medium, _ = repository.store_features(
        "Medium Match", "C", "url_med", v_medium, "youtube", added_by=test_user_id
    )
    song_dissimilar, _ = repository.store_features(
        "Least Similar", "D", "url_diss", v_dissimilar, "youtube", added_by=test_user_id
    )

    # Find similar, excluding the query song (Q)
    similars = repository.find_similars(v_query, limit=3, exclude_id=song_q["id"])

    # Assert 1: Correct number of results returned
    assert len(similars) == 3

    # Assert 2: Should be ranked by increasing distance (Most Similar -> Least Similar)
    assert similars[0]["id"] == song_similar["id"]
    assert similars[1]["id"] == song_medium["id"]
    assert similars[2]["id"] == song_dissimilar["id"]

    # Assert 3: Distances are correctly ordered
    assert similars[0]["distance"] < similars[1]["distance"]
    assert similars[1]["distance"] < similars[2]["distance"]


def test_feedback_upsert_and_aggregation(
    repository: PGVectorRepository, test_user_id: int
):
    """Test storing feedback, updating it (upsert), and aggregating scores."""

    # We use the single guaranteed test user (ID 1)
    user_id = test_user_id
    features = np.ones(FEATURE_DIMENSION) / np.sqrt(FEATURE_DIMENSION)

    # Create two dummy songs and use the test user ID
    song_q_id = repository.store_features(
        "Query", "Q", "url_q", features, "youtube", added_by=user_id
    )[0]["id"]
    song_s_id = repository.store_features(
        "Suggested", "S", "url_s", features, "youtube", added_by=user_id
    )[0]["id"]

    # 1. Initial vote (User): +1 (Upvote)
    repository.store_feedback(user_id, song_q_id, song_s_id, 1)
    scores1 = repository.get_feedback_scores(song_q_id, [song_s_id])
    assert scores1[song_s_id] == 1, "Score should be +1 after first upvote"

    # 2. User changes vote (Upsert): -1 (Downvote)
    repository.store_feedback(user_id, song_q_id, song_s_id, -1)
    scores2 = repository.get_feedback_scores(song_q_id, [song_s_id])
    # Expected score: -1
    assert scores2[song_s_id] == -1, "Score should be -1 after User changes to downvote"
