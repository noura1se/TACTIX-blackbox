from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional, List


class StatsStore:
    def __init__(self, db_path: str = "data/tactix.db", schema_path: str = "stats/schema.sql"):
        self.db_path = db_path
        self.schema_path = schema_path
        self._ensure_db()

    def _connect(self) -> sqlite3.Connection:
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_db(self) -> None:
        with self._connect() as conn:
            with open(self.schema_path, "r", encoding="utf-8") as f:
                conn.executescript(f.read())
            conn.commit()

    def record_game(
        self,
        board_size: int,
        difficulty: str,
        mode: str,
        result: str,
        winner: Optional[str] = None,
    ) -> None:
        ts = datetime.utcnow().isoformat()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO games (ts, board_size, difficulty, mode, result, winner)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    ts,
                    int(board_size),
                    str(difficulty).upper(),
                    str(mode).upper(),
                    str(result).upper(),
                    winner,
                ),
            )
            conn.commit()

    def load(self) -> Dict[str, Any]:
        """Return a JSON-like structure so stats/metrics.py keeps working."""
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT ts, board_size, difficulty, mode, result, winner FROM games ORDER BY id ASC"
            ).fetchall()

        games: List[Dict[str, Any]] = []
        for r in rows:
            games.append(
                {
                    "ts": r["ts"],
                    "boardSize": r["board_size"],
                    "difficulty": r["difficulty"],
                    "mode": r["mode"],
                    "result": r["result"],
                    "winner": r["winner"],
                }
            )

        return {
            "meta": {"storage": "sqlite", "version": 1},
            "games": games,
        }

    def reset(self) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM games")
            conn.commit()
