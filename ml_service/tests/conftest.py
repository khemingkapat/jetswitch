import pytest
import psycopg2
import os
import numpy as np
from fastapi.testclient import TestClient

# Import the main app instance for API testing
from main import app as fast_app
from src.repositories.pgvector_repository import PGVectorRepository

# Configuration should ideally come from environment/config module, but hardcode the test values for safety
FEATURE_DIMENSION = 27
TEST_DB_DSN = "postgresql://admin:admin@localhost:5431/jetswitch_test"


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Ensure environment variables are set to point to the test database."""
    # This must be set for the main.py/PGVectorRepository initialization outside of fixtures
    os.environ["DATABASE_DSN"] = TEST_DB_DSN


@pytest.fixture(scope="session")
def pg_conn():
    """Fixture for a clean, committed PostgreSQL connection to the test DB."""
    try:
        conn = psycopg2.connect(TEST_DB_DSN)
        conn.autocommit = True
        yield conn
        conn.close()
    except psycopg2.OperationalError as e:
        # If the test database container is not running, skip all integration tests
        pytest.skip(
            f"Skipping DB tests: Could not connect to PostgreSQL test DB on port 5431. Error: {e}"
        )


@pytest.fixture(scope="function")
def repository(pg_conn):
    """
    Fixture to provide a fresh PGVectorRepository instance for each test.
    Clears all application tables before yielding the repository instance.
    """
    try:
        cursor = pg_conn.cursor()

        # Clear tables (order matters for foreign key constraints)
        tables = [
            "song_feedback",
            "search_history",
            "playlist_songs",
            "playlists",
            "song_tags",
            "tags",
            "contact",
            "contact_info",
            "users",
            "songs",
        ]
        for table in tables:
            # Use 'TRUNCATE ... RESTART IDENTITY CASCADE;' to reset and clean everything
            cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")

        # Ensure the vector extension is loaded, just in case
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        pg_conn.commit()

    except Exception as e:
        # If setup fails, skip the test
        pytest.skip(f"Failed to clear/setup test database tables: {e}")

    repo = PGVectorRepository(dsn=TEST_DB_DSN, dim=FEATURE_DIMENSION)
    yield repo


@pytest.fixture(scope="function")
def mock_features() -> np.ndarray:
    """Fixture providing a deterministic, normalized 27-dimension feature vector (Unit Test use)."""
    vector = np.ones(FEATURE_DIMENSION)
    return vector / (np.linalg.norm(vector) + 1e-8)


@pytest.fixture(scope="function")
def test_app_client() -> TestClient:
    """Fixture for the FastAPI TestClient (API Test use)."""
    return TestClient(fast_app)
