import numpy as np
import psycopg2
from typing import List, Dict, Optional
from .vector_repository import VectorRepository


class PGVectorRepository(VectorRepository):
    def __init__(self, dsn: str, dim: int):
        """
        dsn: PostgreSQL connection string (e.g. "postgresql://user:pass@db:5432/mydb")
        dim: dimension of the feature vector
        """
        self.dsn = dsn
        self.dim = dim
        self._ensure_extension()

    def _connect(self):
        return psycopg2.connect(self.dsn)

    def _ensure_extension(self):
        """Ensure that pgvector extension is available."""
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()

    def store_features(
        self,
        title: str,
        artist_name: str,
        url: str,
        song_feature: np.ndarray,
        source_platform: str,
        added_by: Optional[int] = None,
        release_date: Optional[str] = None,
    ) -> None:
        """
        Insert or update a song record in the songs table.

        - title, artist_name, url: basic song info
        - song_feature: np.ndarray representing feature vector
        - source_platform: 'spotify', 'apple_music', etc.
        - added_by: user_id who added the song (optional)
        - release_date: string like '2024-05-10' (optional)
        """
        if song_feature.shape[0] != self.dim:
            raise ValueError(f"Feature vector must have dimension {self.dim}")

        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO songs (title, artist_name, release_date, url, song_feature, source_platform, added_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (url)
                DO UPDATE SET
                    title = EXCLUDED.title,
                    artist_name = EXCLUDED.artist_name,
                    release_date = EXCLUDED.release_date,
                    song_feature = EXCLUDED.song_feature,
                    source_platform = EXCLUDED.source_platform,
                    added_by = EXCLUDED.added_by;
                """,
                (
                    title,
                    artist_name,
                    release_date,
                    url,
                    song_feature.tolist(),
                    source_platform,
                    added_by,
                ),
            )
            conn.commit()

        print(f"✅ Stored or updated song: {title} by {artist_name}")

    def find_similars(
        self,
        features: np.ndarray,
        limit: int = 10,
        metric: str = "cosine",
        exclude_id=Optional[int],
    ) -> Optional[List[Dict]]:
        """Find similar songs by vector distance."""
        if features.shape[0] != self.dim:
            raise ValueError(f"Query vector must have dimension {self.dim}")

        operators = {"cosine": "<=>", "l2": "<->", "inner_product": "<#>"}
        operator = operators.get(metric, "<=>")

        where_clause = "WHERE id != %s" if exclude_id else ""

        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT id, title, artist_name, url, source_platform,
                       (song_feature {operator} %s::vector) AS distance
                FROM songs
				{where_clause}
                ORDER BY distance ASC
                LIMIT %s;
                """,
                (features.tolist(), exclude_id, limit),
            )
            rows = cur.fetchall()

        if not rows:
            return None

        return [
            {
                "id": row[0],
                "title": row[1],
                "artist_name": row[2],
                "url": row[3],
                "source_platform": row[4],
                "distance": float(row[5]),
            }
            for row in rows
        ]

    def get_features(self, song_id: int) -> Optional[np.ndarray]:
        """Retrieve the feature vector for a given song ID."""
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT song_feature FROM songs WHERE id = %s;", (song_id,))
            row = cur.fetchone()
            if row and row[0]:
                features_string = row[0]
                cleaned_string = features_string.strip("[]")
                result = np.fromstring(cleaned_string, sep=",")
                return result
        return None

    def list_all_songs(self) -> List[Dict]:
        """List all songs with their metadata (excluding vector)."""
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, artist_name, url, source_platform, added_by, added_at
                FROM songs
                ORDER BY id;
                """
            )
            rows = cur.fetchall()

        return [
            {
                "id": row[0],
                "title": row[1],
                "artist_name": row[2],
                "url": row[3],
                "source_platform": row[4],
                "added_by": row[5],
                "added_at": row[6],
            }
            for row in rows
        ]
