# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
#
# app = FastAPI()
#
# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Allow all origins (or specify ["http://localhost:8080"])
#     allow_credentials=True,
#     allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
#     allow_headers=["*"],  # Allow all headers
# )
#
#
# @app.get("/")
# def read_root():
#     return {"message": "ML Service is running!"}

"""
Main entry point for the music analysis service.
Uses dependency injection to easily swap between mock and real database.
"""

import numpy as np
from service.extractors.youtube_extractor import MusicAnalysisService
from repositories.vector_repository import MockVectorRepository, VectorRepository

# 1. IMPORT THE PGVECTOR REPOSITORY
from repositories.pgvector_repository import (
    PGVectorRepository,
)  # assuming PGVectorRepository is in a file named vector_repositories.py

# (Note: I've updated the import path to match the class definition you provided.)

# ============================================================================
# CONFIGURATION: Choose your repository implementation here
# ============================================================================

# The dimension of your feature vector is required by PGVectorRepository
# You should update this number (e.g., 512, 1024, etc.) to match your actual model output.
FEATURE_DIMENSION = 27  # <<< ADJUST THIS NUMBER!

# For NOW: Use mock repository (no database needed!)
# repository: VectorRepository = MockVectorRepository()

# For LATER: When database is ready, uncomment and use this instead:
repository: VectorRepository = PGVectorRepository(
    dsn="postgresql://admin:admin@localhost:5430/jetswitch",
    dim=FEATURE_DIMENSION,
)


# Create the service with dependency injection
music_service = MusicAnalysisService(repository)


# ============================================================================
# Main Application Logic
# ============================================================================


def analyze_and_store_track(url: str, track_id: str, metadata: dict | None = None):
    """
    Extract features from YouTube URL and store in repository.

    Args:
        url: YouTube URL
        track_id: Unique identifier for the track
        metadata: Optional metadata (title, artist, etc.)

    Returns:
        Extracted feature vector
    """
    print(f"\n🎵 Analyzing track: {url}")

    # Use the service to process the URL
    features = music_service.process_youtube_url(url, track_id, metadata)

    print(f"✅ Extracted {len(features)} features")
    # The repository handles the 'Stored track' printout.
    # print(f"💾 Stored track: {track_id}") # REMOVED: PGVectorRepository prints this

    return features


def find_similar_tracks(url: str, limit: int = 10):
    """
    Find tracks similar to the given YouTube URL.

    Args:
        url: YouTube URL to find similar tracks for
        limit: Maximum number of similar tracks to return

    Returns:
        List of similar tracks with similarity scores
    """
    print(f"\n🔍 Finding similar tracks to: {url}")

    # Use the service to find similar tracks
    similar_tracks = music_service.find_similar_tracks(url, limit)

    return similar_tracks


def interactive_mode():
    """Interactive CLI for testing the system."""
    print("\n" + "=" * 60)
    print("🎸 JETSWITCH Music Analysis System")
    print("=" * 60)
    print(f"📊 Using: {type(repository).__name__}")
    print("=" * 60)

    while True:
        print("\nOptions:")
        print("1. Analyze and store a track")
        print("2. Find similar tracks")
        print("3. View stored tracks")
        print("4. Exit")

        choice = input("\nEnter choice (1-4): ").strip()

        if choice == "1":
            url = input("Enter YouTube URL: ").strip()
            track_id = input("Enter track ID (e.g., track_001): ").strip()
            title = input("Enter track title (optional): ").strip()
            artist = input("Enter artist name (optional): ").strip()

            metadata = {}
            if title:
                metadata["title"] = title
            if artist:
                metadata["artist"] = artist

            try:
                features = analyze_and_store_track(url, track_id, metadata)

                print(f"\n📈 Feature vector preview (first 10):")
                print(np.round(features[:10], 3))
            except Exception as e:
                print(f"\n❌ Error: {e}")

        elif choice == "2":
            url = input("Enter YouTube URL to search: ").strip()
            limit = input("Number of results (default 10): ").strip()
            limit = int(limit) if limit else 10

            try:
                similar = find_similar_tracks(url, limit)

                if not similar:
                    print("\n❌ No similar tracks found (database might be empty)")
                else:
                    print(f"\n📋 Found {len(similar)} similar tracks:")
                    print("-" * 60)
                    for i, track in enumerate(similar, 1):
                        # The PGVectorRepository returns 'distance' which is negative
                        # for cosine similarity. Let's show the similarity score
                        # (1.0 + distance) / 2.0 or just the distance.
                        # For simplicity, we'll show the negative distance.
                        print(f"{i}. {track['metadata'].get('title', 'N/A')}")
                        print(f"    Track ID: {track['track_id']}")
                        print(
                            f"    Artist: {track['metadata'].get('artist', 'Unknown')}"
                        )
                        # Display as a positive score for better user experience
                        similarity_score = track["distance"]
                        print(f"    Similarity (Cosine): {similarity_score:.3f}")
                        print(f"    URL: {track['metadata'].get('youtube_url', 'N/A')}")
                        print()
            except Exception as e:
                print(f"\n❌ Error: {e}")

        elif choice == "3":
            # Only works with MockVectorRepository
            if isinstance(repository, MockVectorRepository):
                if not repository.storage:
                    print("\n📭 No tracks stored yet")
                else:
                    print(f"\n📚 Stored tracks ({len(repository.storage)}):")
                    print("-" * 60)
                    for track_id, data in repository.storage.items():
                        metadata = data["metadata"]
                        print(f"ID: {track_id}")
                        print(f"Title: {metadata.get('title', 'Unknown')}")
                        print(f"Artist: {metadata.get('artist', 'Unknown')}")
                        print(f"URL: {metadata.get('youtube_url', 'N/A')}")
                        print()
            else:
                print("\n⚠️ View stored tracks only available with MockVectorRepository")

        elif choice == "4":
            print("\n👋 Goodbye!")
            break

        else:
            print("\n❌ Invalid choice. Please enter 1-4.")


def simple_demo():
    """Simple demo mode - extract features and show them."""
    url = input("Enter YouTube link: ").strip()

    try:
        # Create a temporary track ID
        import time

        temp_track_id = f"temp_{int(time.time())}"

        # Process the URL
        features = music_service.process_youtube_url(url, temp_track_id)

        print(f"\nExtracted feature vector (length {len(features)}):")
        print(np.round(features, 3))

        # This part is misleading since the track is stored in the DB now,
        # not just temporarily.
        # print(f"\n💡 Track stored with ID: {temp_track_id}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


# ============================================================================
# Entry Point
# ============================================================================


def main():
    """Main entry point - choose your mode."""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--simple":
        # Simple mode: Just extract features (original behavior)
        simple_demo()
    else:
        # Interactive mode: Full functionality with storage and search
        interactive_mode()


if __name__ == "__main__":
    main()
