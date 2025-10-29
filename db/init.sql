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
    id serial PRIMARY KEY,
    title varchar(255) NOT NULL,
    artist_name varchar(255) NOT NULL,
    release_date date NULL,
    url text NOT NULL,
    song_feature VECTOR NOT NULL, -- Requires a vector extension like pgvector
    source_platform varchar(50) CHECK (source_platform IN ('spotify', 'apple_music', 'youtube', 'other')),
    added_by integer REFERENCES USERS (id) ON DELETE SET NULL,
    added_at timestamp with time zone DEFAULT NOW()
);

-- PLAYLISTS Table
CREATE TABLE PLAYLISTS (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    description text NULL,
    owner_id integer NOT NULL REFERENCES USERS (id) ON DELETE CASCADE,
    privacy varchar(50) DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- TAGS Table
CREATE TABLE TAGS (
    id serial PRIMARY KEY,
    name varchar(100) UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT NOW()
);

-- CONTACT_INFO Table
CREATE TABLE CONTACT_INFO (
    contact_id serial PRIMARY KEY,
    contact_type varchar(100), -- e.g., 'Phone', 'Email', 'Social'
    contact_info varchar(255) NOT NULL
);

-- SEARCH_HISTORY Table
CREATE TABLE SEARCH_HISTORY (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES USERS (id) ON DELETE CASCADE,
    search_type varchar(50) CHECK (search_type IN ('track_link', 'lyrics', 'hummed_audio', 'tags', 'other')),
    query_content text NULL,
    query_song_id integer NULL REFERENCES SONGS (id) ON DELETE SET NULL,
    result_song_ids jsonb, -- Stores an array of song IDs (as INTEGER)
    searched_at timestamp with time zone DEFAULT NOW()
);

-- CONTACT Table (Join table for USERS and CONTACT_INFO)
CREATE TABLE CONTACT (
    user_id integer NOT NULL REFERENCES USERS (id) ON DELETE CASCADE,
    contact_id integer NOT NULL REFERENCES CONTACT_INFO (contact_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, contact_id)
);

-- SONG_TAGS (Many-to-Many Join Table)
CREATE TABLE SONG_TAGS (
    song_id integer NOT NULL REFERENCES SONGS (id) ON DELETE CASCADE,
    tag_id integer NOT NULL REFERENCES TAGS (id) ON DELETE CASCADE,
    tagged_at timestamp with time zone DEFAULT NOW(),
    PRIMARY KEY (song_id, tag_id)
);

-- PLAYLIST_SONGS (Many-to-Many Join Table with Ordering)
CREATE TABLE PLAYLIST_SONGS (
    playlist_id integer NOT NULL REFERENCES PLAYLISTS (id) ON DELETE CASCADE,
    song_id integer NOT NULL REFERENCES SONGS (id) ON DELETE CASCADE,
    "position" integer NOT NULL,
    added_at timestamp with time zone DEFAULT NOW(),
    PRIMARY KEY (playlist_id, song_id)
    -- UNIQUE (playlist_id, "position") -- Consider adding this constraint
);
