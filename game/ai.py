# game/ai.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, Optional
import random

from .scan import scan
from .minimax import search_best_move

Move = Tuple[int, int]

@dataclass
class AIMove:
    move: Optional[Move]
    difficulty: str
    scan_bestMoves: list[Move]
    scan_dangerMoves: list[Move]
    score: int
    depth: int

def choose_move(state, config=None, difficulty: str = "MEDIUM", seed: int | None = None) -> AIMove:
    """
    Difficulty:
      EASY: mostly scan + some randomness + shallow minimax
      MEDIUM: scan first, then minimax moderate depth
      RELENTLESS: deeper minimax + tighter ordering + less randomness
    Returns move + scan outputs (bestMoves/dangerMoves).
    """
    if seed is not None:
        random.seed(seed)

    diff = (difficulty or "MEDIUM").upper().strip()
    s = scan(state, config)

    # If we can win now, always do it (all difficulties)
    if s.bestMoves:
        return AIMove(
            move=s.bestMoves[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            score=999999,
            depth=0,
        )

    # If opponent can win next, block (all difficulties except maybe VERY EASY, but you asked Easy/Medium/Relentless)
    if s.dangerMoves:
        # EASY might sometimes pick a non-best block if multiple
        block = s.dangerMoves[0] if diff != "EASY" else random.choice(s.dangerMoves)
        return AIMove(
            move=block,
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            score=500000,
            depth=0,
        )

    # board-size tuning
    n = _board_size(state)

    if diff == "EASY":
        # 1) prefer forks, then center, with randomness
        candidates = s.forks or s.centerMoves[:6]  # top center-ish
        if candidates and random.random() < 0.75:
            return AIMove(
                move=random.choice(candidates[: min(len(candidates), 4)]),
                difficulty=diff,
                scan_bestMoves=s.bestMoves,
                scan_dangerMoves=s.dangerMoves,
                score=0,
                depth=0,
            )
        # 2) shallow minimax fallback
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

def _board_size(state) -> int:
    b = getattr(state, "board", state)
    g = getattr(b, "grid", b)
    return len(g)
