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
