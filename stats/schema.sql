CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  board_size INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL,
  result TEXT NOT NULL,     -- WIN or DRAW
  winner TEXT              -- OPERATOR/SYSTEM or NULL
);

CREATE INDEX IF NOT EXISTS idx_games_size ON games(board_size);
CREATE INDEX IF NOT EXISTS idx_games_diff ON games(difficulty);
CREATE INDEX IF NOT EXISTS idx_games_mode ON games(mode);
CREATE INDEX IF NOT EXISTS idx_games_ts   ON games(ts);
