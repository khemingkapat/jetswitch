import numpy as np
import psycopg2
from psycopg2.extras import Json
from typing import List, Dict, Optional
from .vector_repository import VectorRepository  # adjust import path


class PGVectorRepository(VectorRepository):
    def __init__(self, dsn: str, dim: int):
        """
        dsn: PostgreSQL connection string (e.g. "postgresql://user:pass@db:5432/mydb")
        dim: dimension of the feature vector
        """
        self.dsn = dsn
        self.dim = dim
        self._ensure_table()

    def _connect(self):
        return psycopg2.connect(self.dsn)

    def _ensure_table(self):
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS music_features (
                    track_id TEXT PRIMARY KEY,
                    features VECTOR({self.dim}),
                    metadata JSONB
                );
                """
            )
            conn.commit()

    def store_features(
        self, track_id: str, features: np.ndarray, metadata: dict
    ) -> None:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO music_features (track_id, features, metadata)
                VALUES (%s, %s, %s)
                ON CONFLICT (track_id)
                DO UPDATE SET features = EXCLUDED.features, metadata = EXCLUDED.metadata;
                """,
                (track_id, features.tolist(), Json(metadata)),
            )
            conn.commit()
        print(f"✅ Stored features for {track_id} in PostgreSQL")

    def find_similar(self, features: np.ndarray, limit: int = 10) -> List[Dict]:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT track_id, metadata, (features <-> %s::vector) AS distance
                FROM music_features
                ORDER BY distance ASC
                LIMIT %s;
                """,
                (features.tolist(), limit),
            )
            rows = cur.fetchall()

        return [
            {
                "track_id": row[0],
                "metadata": row[1],
                "distance": float(row[2]),
            }
            for row in rows
        ]

    def get_features(self, track_id: str) -> Optional[np.ndarray]:
        with self._connect() as conn, conn.cursor() as cur:
            cur.execute(
                "SELECT features FROM music_features WHERE track_id = %s;", (track_id,)
            )
            row = cur.fetchone()
            if row:
                return np.array(row[0])
        return None
