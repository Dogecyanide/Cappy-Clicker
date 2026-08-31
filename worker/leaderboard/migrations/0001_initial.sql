PRAGMA foreign_keys = ON;

CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_ip_hash TEXT NOT NULL,
  submissions_count INTEGER NOT NULL DEFAULT 0 CHECK (submissions_count >= 0),
  abuse_count INTEGER NOT NULL DEFAULT 0 CHECK (abuse_count >= 0)
);

CREATE TABLE scores (
  player_id INTEGER NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('lifetime', 'cps')),
  score_log10 REAL NOT NULL,
  display_value TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  is_flagged INTEGER NOT NULL DEFAULT 0 CHECK (is_flagged IN (0, 1)),
  abuse_flags TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (player_id, metric),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('lifetime', 'cps')),
  score_log10 REAL NOT NULL,
  display_value TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  abuse_flags TEXT NOT NULL DEFAULT '[]',
  ip_hash TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  accepted INTEGER NOT NULL CHECK (accepted IN (0, 1)),
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX scores_public_rank_idx
  ON scores (metric, is_flagged, score_log10 DESC, submitted_at ASC);

CREATE INDEX submissions_player_time_idx
  ON submissions (player_id, submitted_at DESC);

CREATE INDEX submissions_ip_time_idx
  ON submissions (ip_hash, submitted_at DESC);
