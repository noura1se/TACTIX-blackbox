# game/ai.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, Optional, Dict, Any
import random

from .scan import scan
from .minimax import search_best_move
from .types import GameState, GameConfig, Player
from .board import available_moves

MoveRC = Tuple[int, int]

@dataclass
class AIMove:
    move: Optional[MoveRC]
    difficulty: str
    scan_bestMoves: list[MoveRC]
    scan_dangerMoves: list[MoveRC]
    score: int
    depth: int


def _board_size(state: GameState) -> int:
    return len(state.board)


def choose_move(state: GameState, config: GameConfig, difficulty: str = "MEDIUM", seed: int | None = None) -> AIMove:
    if seed is not None:
        random.seed(seed)

    diff = (difficulty or "MEDIUM").upper().strip()
    s = scan(state, config)

    # immediate win
    if s.bestMoves:
        return AIMove(
            move=s.bestMoves[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            score=999999,
            depth=0,
        )

    # block opponent
    if s.dangerMoves:
        block = s.dangerMoves[0] if diff != "EASY" else random.choice(s.dangerMoves)
        return AIMove(block, diff, s.bestMoves, s.dangerMoves, 500000, 0)

    n = _board_size(state)

    if diff == "EASY":
        candidates = s.forks or s.centerMoves[:6]
        if candidates and random.random() < 0.75:
            pick = random.choice(candidates[: min(len(candidates), 4)])
            return AIMove(pick, diff, s.bestMoves, s.dangerMoves, 0, 0)
        depth = 2 if n >= 5 else 3
        res = search_best_move(state, config, depth=depth, time_limit_ms=120, use_scan_ordering=True)
        return AIMove(res.move, diff, s.bestMoves, s.dangerMoves, res.score, res.depth)

    if diff == "MEDIUM":
        depth = 3 if n >= 5 else 4
        tl = 250 if n >= 5 else 350
        res = search_best_move(state, config, depth=depth, time_limit_ms=tl, use_scan_ordering=True)
        return AIMove(res.move, diff, s.bestMoves, s.dangerMoves, res.score, res.depth)

    # RELENTLESS
    depth = 4 if n >= 5 else 6
    tl = 450 if n >= 5 else 800
    res = search_best_move(state, config, depth=depth, time_limit_ms=tl, use_scan_ordering=True)
    return AIMove(res.move, diff, s.bestMoves, s.dangerMoves, res.score, res.depth)


# -------------------------------------------------------
# ✅ Flask-compatible AI entrypoint (what web/api.py expects)
# -------------------------------------------------------
def choose_ai_move(state: GameState, config: GameConfig):
    """
    Returns (pos:int, meta:dict)
    """
    ai = choose_move(state, config, difficulty="MEDIUM")  # default, Flask can pass config later if you add it
    if ai.move is None:
        return None, {"reason": "no_moves"}

    n = len(state.board)
    pos = ai.move[0] * n + ai.move[1]
    meta: Dict[str, Any] = {
        "difficulty": ai.difficulty,
        "score": ai.score,
        "depth": ai.depth,
        "scan_bestMovesRC": ai.scan_bestMoves,
        "scan_dangerMovesRC": ai.scan_dangerMoves,
    }
    return pos, meta
