# game/minimax.py
from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, List, Dict, Optional
import math
import time

from .heuristics import evaluate
from .scan import scan

Move = Tuple[int, int]

@dataclass
class SearchResult:
    move: Optional[Move]
    score: int
    depth: int
    nodes: int
    cutoffs: int

# ----------------------------
# ADAPTER LAYER (edit me)
# ----------------------------
def legal_moves(state) -> List[Move]:
    b = getattr(state, "board", state)
    if hasattr(b, "legal_moves"):
        return list(b.legal_moves())
    if hasattr(b, "get_legal_moves"):
        return list(b.get_legal_moves(state))
    grid = getattr(b, "grid", b)
    n = len(grid)
    out = []
    for r in range(n):
        for c in range(n):
            if grid[r][c] in (0, None, "."):
                out.append((r, c))
    return out

def current_player(state) -> int:
    return getattr(state, "player", getattr(state, "player_to_move", 1))

def opponent(p: int) -> int:
    return -p if p in (-1, 1) else (2 if p == 1 else 1)

def apply_move(state, move: Move, player: int):
    b = getattr(state, "board", state)
    if hasattr(b, "apply_move"):
        return b.apply_move(move, player)
    grid = getattr(b, "grid", b)
    r, c = move
    prev = grid[r][c]
    grid[r][c] = player
    return (r, c, prev)

def undo_move(state, token):
    b = getattr(state, "board", state)
    if hasattr(b, "undo_move"):
        b.undo_move(token)
        return
    grid = getattr(b, "grid", b)
    r, c, prev = token
    grid[r][c] = prev

def is_win(state, player: int) -> bool:
    b = getattr(state, "board", state)
    if hasattr(b, "is_win"):
        return bool(b.is_win(player))
    if hasattr(b, "check_win"):
        return bool(b.check_win(player))
    raise NotImplementedError("Wire is_win() adapter to your board win-check function.")

def is_draw(state) -> bool:
    b = getattr(state, "board", state)
    if hasattr(b, "is_draw"):
        return bool(b.is_draw())
    moves = legal_moves(state)
    return len(moves) == 0

def position_key(state) -> str:
    """
    Simple key for transposition table.
    Replace with zobrist if you already have it in board.py.
    """
    b = getattr(state, "board", state)
    g = getattr(b, "grid", b)
    p = current_player(state)
    return f"{p}|" + "/".join("".join(str(x) for x in row) for row in g)

# ----------------------------
# MINIMAX (alpha-beta + caching)
# ----------------------------
MATE = 10_000_000

def search_best_move(
    state,
    config=None,
    depth: int = 3,
    time_limit_ms: int | None = None,
    use_scan_ordering: bool = True,
) -> SearchResult:
    """
    Returns best move for current player.
    Includes alpha-beta pruning + transposition table + move ordering.
    """
    start = time.time()
    deadline = (start + (time_limit_ms / 1000.0)) if time_limit_ms else None

    p = current_player(state)
    tt: Dict[str, Tuple[int, int]] = {}  # key -> (depth, score)
    nodes = 0
    cutoffs = 0

    # Root move ordering
    moves = legal_moves(state)
    if not moves:
        return SearchResult(move=None, score=0, depth=0, nodes=0, cutoffs=0)

    if use_scan_ordering:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    best_move = moves[0]
    best_score = -math.inf

    alpha = -math.inf
    beta = math.inf

    for m in moves:
        if deadline and time.time() > deadline:
            break
        tok = apply_move(state, m, p)
        try:
            score = _min_value(state, config, depth - 1, alpha, beta, p, tt, deadline)
        finally:
            undo_move(state, tok)
        if score > best_score:
            best_score = score
            best_move = m
        alpha = max(alpha, best_score)

    return SearchResult(move=best_move, score=int(best_score), depth=depth, nodes=nodes + len(moves), cutoffs=cutoffs)

def _max_value(state, config, depth, alpha, beta, perspective_player, tt, deadline):
    if deadline and time.time() > deadline:
        return evaluate(state, config, perspective_player)

    p = current_player(state)
    opp = opponent(p)

    # terminal
    if is_win(state, opp):  # previous move won for opp, so bad for max
        return -MATE - depth
    if is_draw(state) or depth == 0:
        return evaluate(state, config, perspective_player)

    key = position_key(state)
    if key in tt:
        d0, v0 = tt[key]
        if d0 >= depth:
            return v0

    moves = legal_moves(state)

    # light ordering: scan threats only at shallow depths to save time
    if depth <= 2:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    v = -math.inf
    for m in moves:
        tok = apply_move(state, m, p)
        try:
            v = max(v, _min_value(state, config, depth - 1, alpha, beta, perspective_player, tt, deadline))
        finally:
            undo_move(state, tok)
        if v >= beta:
            tt[key] = (depth, int(v))
            return v
        alpha = max(alpha, v)

    tt[key] = (depth, int(v))
    return v

def _min_value(state, config, depth, alpha, beta, perspective_player, tt, deadline):
    if deadline and time.time() > deadline:
        return evaluate(state, config, perspective_player)

    p = current_player(state)
    opp = opponent(p)

    # terminal
    if is_win(state, opp):  # previous move won for opp, so good for min? Actually min's turn means max played before.
        return MATE + depth
    if is_draw(state) or depth == 0:
        return evaluate(state, config, perspective_player)

    key = position_key(state)
    if key in tt:
        d0, v0 = tt[key]
        if d0 >= depth:
            return v0

    moves = legal_moves(state)
    if depth <= 2:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    v = math.inf
    for m in moves:
        tok = apply_move(state, m, p)
        try:
            v = min(v, _max_value(state, config, depth - 1, alpha, beta, perspective_player, tt, deadline))
        finally:
            undo_move(state, tok)
        if v <= alpha:
            tt[key] = (depth, int(v))
            return v
        beta = min(beta, v)

    tt[key] = (depth, int(v))
    return v

def _order_moves(moves: List[Move], s) -> List[Move]:
    """
    Priority:
      1) immediate wins
      2) blocks
      3) forks
      4) center-ish
      5) rest
    """
    best = set(getattr(s, "bestMoves", []))
    danger = set(getattr(s, "dangerMoves", []))
    forks = set(getattr(s, "forks", []))
    centers = list(getattr(s, "centerMoves", []))

    def rank(m: Move) -> Tuple[int, int]:
        if m in best:
            return (0, 0)
        if m in danger:
            return (1, 0)
        if m in forks:
            return (2, 0)
        # center ordering by index if present
        if m in centers:
            return (3, centers.index(m))
        return (4, 0)

    return sorted(moves, key=rank)
