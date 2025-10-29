CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255), -- Nullable for OAuth users
    user_type varchar(20) NOT NULL CHECK (user_type IN ('listener', 'artist')),
    google_id varchar(255) UNIQUE, -- For Google OAuth
    avatar_url text, -- Store profile picture URL
    auth_provider varchar(20) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users (username);

CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_users_google_id ON users (google_id);

-- SONGS Table
CREATE TABLE SONGS (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  release_date DATE NULL,
  url TEXT NOT NULL,
  song_feature VECTOR NOT NULL, -- Requires a vector extension like pgvector
  source_platform VARCHAR(50) CHECK (source_platform IN ('spotify', 'apple_music', 'youtube', 'other')),
  added_by INTEGER REFERENCES USERS(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLAYLISTS Table
CREATE TABLE PLAYLISTS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  owner_id INTEGER NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
  privacy VARCHAR(50) DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TAGS Table
CREATE TABLE TAGS (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONTACT_INFO Table
CREATE TABLE CONTACT_INFO (
  contact_id SERIAL PRIMARY KEY,
  contact_type VARCHAR(100), -- e.g., 'Phone', 'Email', 'Social'
  contact_info VARCHAR(255) NOT NULL
);

-- SEARCH_HISTORY Table
CREATE TABLE SEARCH_HISTORY (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
  search_type VARCHAR(50) CHECK (search_type IN ('track_link', 'lyrics', 'hummed_audio', 'tags', 'other')),
  query_content TEXT NULL,
  query_song_id INTEGER NULL REFERENCES SONGS(id) ON DELETE SET NULL,
  result_song_ids JSONB, -- Stores an array of song IDs (as INTEGER)
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONTACT Table (Join table for USERS and CONTACT_INFO)
CREATE TABLE CONTACT (
  user_id INTEGER NOT NULL REFERENCES USERS(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES CONTACT_INFO(contact_id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, contact_id)
);

-- SONG_TAGS (Many-to-Many Join Table)
CREATE TABLE SONG_TAGS (
  song_id INTEGER NOT NULL REFERENCES SONGS(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES TAGS(id) ON DELETE CASCADE,
  tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (song_id, tag_id)
);

-- PLAYLIST_SONGS (Many-to-Many Join Table with Ordering)
CREATE TABLE PLAYLIST_SONGS (
  playlist_id INTEGER NOT NULL REFERENCES PLAYLISTS(id) ON DELETE CASCADE,
  song_id INTEGER NOT NULL REFERENCES SONGS(id) ON DELETE CASCADE,
  "position" INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (playlist_id, song_id)
  -- UNIQUE (playlist_id, "position") -- Consider adding this constraint
);
