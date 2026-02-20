# game/heuristics.py
from __future__ import annotations
from typing import Tuple, List, Dict

Move = Tuple[int, int]

# ----------------------------
# ADAPTER LAYER 
# ----------------------------
def grid_and_size(state):
    b = getattr(state, "board", state)
    g = getattr(b, "grid", b)
    return g, len(g)

def current_player(state) -> int:
    return getattr(state, "player", getattr(state, "player_to_move", 1))

def opponent(p: int) -> int:
    return -p if p in (-1, 1) else (2 if p == 1 else 1)

def win_length(config, state) -> int:
    
    if config is not None:
        for k in ("win_length", "k", "K"):
            if hasattr(config, k):
                return int(getattr(config, k))
    if hasattr(state, "config") and hasattr(state.config, "win_length"):
        return int(state.config.win_length)
    # fallback (classic): 3 for 3x3, 4 for 4x4, 5 for 5x5
    _, n = grid_and_size(state)
    return min(5, max(3, n))

# ----------------------------
# HEURISTIC EVAL
# ----------------------------
def evaluate(state, config=None, perspective_player: int | None = None) -> int:
    
    g, n = grid_and_size(state)
    k = win_length(config, state) 

    p = perspective_player if perspective_player is not None else current_player(state)
    o = opponent(p)

    score_p = _lines_score(g, n, k, p)
    score_o = _lines_score(g, n, k, o)

    center_bonus = _center_bonus(g, n, p) - _center_bonus(g, n, o)

    return (score_p - score_o) + center_bonus

def _center_bonus(g, n: int, player: int) -> int:
    mid = (n - 1) / 2.0
    s = 0
    for r in range(n):
        for c in range(n):
            if g[r][c] == player:
                d = abs(r - mid) + abs(c - mid)
                s += int((n - d) * 2)
    return s

def _lines_score(g, n: int, k: int, player: int) -> int:
    """
    Sum over all length-k windows in rows/cols/diagonals.
    Window scoring:
      - blocked (contains opponent) => 0
      - otherwise grows fast with count^2 and extra if 'open' on ends
    """
    opp = -player if player in (-1, 1) else (2 if player == 1 else 1)
    total = 0

    # helper scoring for a window
    def window_value(cells: List[int]) -> int:
        if any(x == opp for x in cells):
            return 0
        cnt = sum(1 for x in cells if x == player)
        if cnt == 0:
            return 1  
        # aggressive growth as we approach k
        base = cnt * cnt * 8 + cnt * 2
        # near-win 
        if cnt == k - 1:
            base += 250
        return base

    # rows
    for r in range(n):
        for c in range(n - k + 1):
            cells = [g[r][c + i] for i in range(k)]
            total += window_value(cells)

    # cols
    for c in range(n):
        for r in range(n - k + 1):
            cells = [g[r + i][c] for i in range(k)]
            total += window_value(cells)

    # diag down-right
    for r in range(n - k + 1):
        for c in range(n - k + 1):
            cells = [g[r + i][c + i] for i in range(k)]
            total += window_value(cells)

    # diag up-right
    for r in range(k - 1, n):
        for c in range(n - k + 1):
            cells = [g[r - i][c + i] for i in range(k)]
            total += window_value(cells)

    return total
