CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE genres (
  id   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE games (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title             VARCHAR(80) NOT NULL UNIQUE,
  description       TEXT,
  min_players       INTEGER NOT NULL CHECK (min_players >= 1),
  max_players       INTEGER NOT NULL CHECK (max_players >= 1),
  play_time_minutes INTEGER NOT NULL CHECK (play_time_minutes >= 1),
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (max_players >= min_players)
);

CREATE TABLE reviews (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text_review TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

CREATE TABLE game_genres (
  game_id  INTEGER REFERENCES games(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (game_id, genre_id)
);

CREATE TABLE tables_in_cafe (
  id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  number    INTEGER NOT NULL UNIQUE CHECK (number >= 1),
  capacity  INTEGER NOT NULL CHECK (capacity >= 1),
  zone      VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE bookings (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_id   INTEGER NOT NULL REFERENCES tables_in_cafe(id),
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  guests     INTEGER NOT NULL CHECK (guests >= 1),
  status     VARCHAR(20) NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);

CREATE INDEX game_genres_genre_id_idx        ON game_genres (genre_id);
CREATE INDEX reviews_game_id_idx             ON reviews (game_id);
CREATE INDEX bookings_user_id_idx            ON bookings (user_id);
CREATE INDEX bookings_table_id_starts_at_idx ON bookings (table_id, starts_at);