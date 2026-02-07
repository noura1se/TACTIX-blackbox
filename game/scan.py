# game/scan.py
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional, Tuple, Iterable, Any

Move = Tuple[int, int]  # (row, col)

@dataclass
class ScanResult:
    bestMoves: List[Move]      # immediate win moves for current player
    dangerMoves: List[Move]    # moves that block opponent's immediate win
    forks: List[Move]          # create 2+ threats next turn (optional extra)
    centerMoves: List[Move]    # helpful positional (optional extra)

# ----------------------------
# ADAPTER LAYER (edit me)
# ----------------------------
def legal_moves(state) -> List[Move]:
    """Return list of legal moves."""
    # expected: state.board.legal_moves() OR board.get_legal_moves(state)
    b = getattr(state, "board", state)
    if hasattr(b, "legal_moves"):
        return list(b.legal_moves())
    if hasattr(b, "get_legal_moves"):
        return list(b.get_legal_moves(state))
    # fallback: board is matrix with 0/None empty
    moves = []
    grid = getattr(b, "grid", b)
    n = len(grid)
    for r in range(n):
        for c in range(n):
            if grid[r][c] in (0, None, "."):
                moves.append((r, c))
    return moves

def current_player(state) -> int:
    """Return current player id (e.g., 1 or -1)."""
    return getattr(state, "player", getattr(state, "player_to_move", 1))

def opponent(p: int) -> int:
    return -p if p in (-1, 1) else (2 if p == 1 else 1)

def apply_move(state, move: Move, player: int):
    """Apply move (mutate) and return something usable for undo."""
    b = getattr(state, "board", state)
    if hasattr(b, "apply_move"):
        return b.apply_move(move, player)
    # fallback matrix:
    grid = getattr(b, "grid", b)
    r, c = move
    prev = grid[r][c]
    grid[r][c] = player
    return (r, c, prev)

def undo_move(state, token):
    """Undo move using token from apply_move."""
    b = getattr(state, "board", state)
    if hasattr(b, "undo_move"):
        b.undo_move(token)
        return
    grid = getattr(b, "grid", b)
    r, c, prev = token
    grid[r][c] = prev

def is_win(state, player: int) -> bool:
    """True if player has won."""
    b = getattr(state, "board", state)
    if hasattr(b, "is_win"):
        return bool(b.is_win(player))
    if hasattr(b, "check_win"):
        return bool(b.check_win(player))
    # If your board.py exposes a win checker, wire it here.
    raise NotImplementedError("Wire is_win() adapter to your board win-check function.")

# ----------------------------
# SCAN LOGIC
# ----------------------------
def scan(state, config=None) -> ScanResult:
    """
    Quick tactical scan:
      - bestMoves: immediate wins for current player
      - dangerMoves: blocks opponent immediate wins
      - forks: moves that create >=2 immediate winning moves next turn (optional)
    """
    p = current_player(state)
    opp = opponent(p)
    moves = legal_moves(state)

    best: List[Move] = []
    danger: List[Move] = []
    forks: List[Move] = []
    centers: List[Move] = []

    # center heuristic (cheap): prefer central cells if available
    centers = _centerish_moves(state, moves)

    # 1) immediate wins for current player
    for m in moves:
        tok = apply_move(state, m, p)
        try:
            if is_win(state, p):
                best.append(m)
        finally:
            undo_move(state, tok)

    # 2) immediate wins for opponent (so we block them)
    for m in moves:
        tok = apply_move(state, m, opp)
        try:
            if is_win(state, opp):
                danger.append(m)
        finally:
            undo_move(state, tok)

    # 3) forks (create 2+ winning moves next turn)
    # Only do fork scan if no immediate win exists (saves time)
    if not best:
        for m in moves:
            tok = apply_move(state, m, p)
            try:
                win_count = 0
                for nm in legal_moves(state):
                    tok2 = apply_move(state, nm, p)
                    try:
                        if is_win(state, p):
                            win_count += 1
                            if win_count >= 2:
                                forks.append(m)
                                break
                    finally:
                        undo_move(state, tok2)
            finally:
                undo_move(state, tok)

    # Deduplicate while preserving order
    best = _uniq(best)
    danger = _uniq(danger)
    forks = _uniq(forks)
    centers = _uniq(centers)

    return ScanResult(bestMoves=best, dangerMoves=danger, forks=forks, centerMoves=centers)

def _uniq(xs: List[Move]) -> List[Move]:
    seen = set()
    out = []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out

def _centerish_moves(state, moves: List[Move]) -> List[Move]:
    b = getattr(state, "board", state)
    grid = getattr(b, "grid", b)
    n = len(grid)
    mid = (n - 1) / 2.0
    # sort by distance to center
    return sorted(moves, key=lambda rc: (abs(rc[0] - mid) + abs(rc[1] - mid)))
