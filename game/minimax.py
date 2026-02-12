from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple, List, Dict, Optional
import math
import time
from copy import deepcopy

from .types import GameState, GameConfig, Player
from .heuristics import evaluate
from .scan import scan
from .board import available_moves
from .rules import check_winner, is_draw as _is_draw

Move = Tuple[int, int]  # (row, col)


@dataclass
class SearchResult:
    move: Optional[Move]
    score: int
    depth: int
    nodes: int
    cutoffs: int


MATE = 10_000_000


# ========================================
# ✅ PROPER FIX: Use MATE instead of infinity
# ========================================
def safe_int(value: float) -> int:
    """
    Safely convert float to int, handling infinity.
    
    This should rarely be needed if alpha/beta are initialized correctly,
    but it's kept as a safety net.
    """
    if value == math.inf:
        return MATE
    elif value == -math.inf:
        return -MATE
    else:
        return int(value)


# ----------------------------
# Engine-native helpers
# ----------------------------
def current_player(state: GameState) -> Player:
    return state.current_player


def opponent(p: Player) -> Player:
    return "O" if p == "X" else "X"


def legal_moves(state: GameState) -> List[Move]:
    return list(available_moves(state))


def is_win(state: GameState, config: GameConfig, player: Player) -> bool:
    winner, _ = check_winner(state.board, config.win_len)
    return winner == player


def is_draw(state: GameState, config: GameConfig) -> bool:
    winner, _ = check_winner(state.board, config.win_len)
    return _is_draw(state.board, winner)


def position_key(state: GameState) -> str:
    """
    Transposition key: current player + board snapshot
    """
    p = current_player(state)
    flat = "/".join("".join(cell if cell is not None else "." for cell in row) for row in state.board)
    return f"{p}|{flat}"


def _apply_move_copy(state: GameState, move: Move, player: Player) -> GameState:
    """
    Return a NEW state after applying (move) for (player).
    We do deepcopy to keep it simple and reliable for small boards.
    """
    r, c = move
    if state.board[r][c] is not None:
        # invalid, return same (minimax won't pick invalid if legal_moves is correct)
        return state

    s2 = deepcopy(state)
    s2.board[r][c] = player
    s2.move_count += 1

    winner, line = check_winner(s2.board, config_win_len=s2_config_win_len(state=None, fallback=None))  # placeholder
    # We'll not rely on this (we use is_win/is_draw which use config)
    # Keep state flags consistent anyway:
    s2.winner = winner
    s2.win_line = line
    s2.is_draw = False  # recomputed via is_draw(state, config)

    # switch player if game continues
    if s2.winner is None:
        s2.current_player = opponent(player)

    return s2


def s2_config_win_len(state=None, fallback=None) -> int:
    # dead-simple helper to avoid mypy complaining in the placeholder call above
    return 3


# ----------------------------
# Minimax (alpha-beta + TT)
# ----------------------------
def search_best_move(
    state: GameState,
    config: GameConfig,
    depth: int = 3,
    time_limit_ms: int | None = None,
    use_scan_ordering: bool = True,
) -> SearchResult:
    """
    Returns best move for current player ("X" or "O").
    Uses alpha-beta pruning + transposition table + move ordering from scan().
    
    ✅ KEY FIX: Initialize alpha/beta with MATE, not math.inf
    """
    start = time.time()
    deadline = (start + (time_limit_ms / 1000.0)) if time_limit_ms else None

    p = current_player(state)

    tt: Dict[str, Tuple[int, int]] = {}  # key -> (depth, score)
    nodes = 0
    cutoffs = 0

    moves = legal_moves(state)
    if not moves:
        return SearchResult(move=None, score=0, depth=0, nodes=0, cutoffs=0)

    if use_scan_ordering:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    best_move = moves[0]
    best_score = -MATE  # ✅ FIX: Use MATE instead of -math.inf

    alpha = -MATE  # ✅ FIX: Use MATE instead of -math.inf
    beta = MATE    # ✅ FIX: Use MATE instead of math.inf

    for m in moves:
        if deadline and time.time() > deadline:
            break

        s2 = _apply_move_state(state, config, m, p)
        nodes += 1

        score, n2, c2 = _min_value(s2, config, depth - 1, alpha, beta, p, tt, deadline)
        nodes += n2
        cutoffs += c2

        if score > best_score:
            best_score = score
            best_move = m

        alpha = max(alpha, best_score)

    return SearchResult(
        move=best_move, 
        score=best_score,  # ✅ Already an int, no conversion needed
        depth=depth, 
        nodes=nodes, 
        cutoffs=cutoffs
    )


def _apply_move_state(state: GameState, config: GameConfig, move: Move, player: Player) -> GameState:
    """
    Return new state after move. Also updates terminal flags using config.
    """
    r, c = move
    s2 = deepcopy(state)
    s2.board[r][c] = player
    s2.move_count += 1

    winner, line = check_winner(s2.board, config.win_len)
    s2.winner = winner
    s2.win_line = line
    s2.is_draw = _is_draw(s2.board, winner)

    if s2.winner is None and not s2.is_draw:
        s2.current_player = opponent(player)

    return s2


# ========================================
# ✅ COMPLETE FIX: Terminal detection + MATE initialization
# ========================================
def _max_value(
    state: GameState,
    config: GameConfig,
    depth: int,
    alpha: int,  # ✅ Changed type hint: int instead of float
    beta: int,   # ✅ Changed type hint: int instead of float
    perspective_player: Player,
    tt: Dict[str, Tuple[int, int]],
    deadline: Optional[float],
) -> Tuple[int, int, int]:
    """
    Returns (score, nodes, cutoffs)
    
    ✅ FIXES:
    1. Use state.winner directly (no recalculation)
    2. Initialize v with -MATE (not -math.inf)
    3. All alpha/beta operations use int (MATE)
    """
    if deadline and time.time() > deadline:
        return evaluate(state, config, perspective_player), 0, 0

    # ✅ FIX 1: Check state.winner directly
    if state.winner is not None:
        if state.winner == perspective_player:
            return MATE + depth, 0, 0  # Good for us
        else:
            return -MATE - depth, 0, 0  # Bad for us

    if state.is_draw or depth == 0:
        return evaluate(state, config, perspective_player), 0, 0

    p = current_player(state)

    key = position_key(state)
    if key in tt:
        d0, v0 = tt[key]
        if d0 >= depth:
            return v0, 0, 0

    moves = legal_moves(state)
    
    # ✅ Edge case: No legal moves (shouldn't happen if terminal check is correct)
    if not moves:
        return evaluate(state, config, perspective_player), 0, 0
    
    if depth <= 2:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    v = -MATE  # ✅ FIX 2: Use -MATE instead of -math.inf
    nodes = 0
    cutoffs = 0

    for m in moves:
        s2 = _apply_move_state(state, config, m, p)
        nodes += 1

        score, n2, c2 = _min_value(s2, config, depth - 1, alpha, beta, perspective_player, tt, deadline)
        nodes += n2
        cutoffs += c2

        v = max(v, score)
        if v >= beta:
            tt[key] = (depth, v)
            return v, nodes, cutoffs + 1

        alpha = max(alpha, v)

    tt[key] = (depth, v)
    return v, nodes, cutoffs


def _min_value(
    state: GameState,
    config: GameConfig,
    depth: int,
    alpha: int,  # ✅ Changed type hint: int instead of float
    beta: int,   # ✅ Changed type hint: int instead of float
    perspective_player: Player,
    tt: Dict[str, Tuple[int, int]],
    deadline: Optional[float],
) -> Tuple[int, int, int]:
    """
    Returns (score, nodes, cutoffs)
    
    ✅ FIXES:
    1. Use state.winner directly (no recalculation)
    2. Initialize v with MATE (not math.inf)
    3. All alpha/beta operations use int (MATE)
    """
    if deadline and time.time() > deadline:
        return evaluate(state, config, perspective_player), 0, 0

    # ✅ FIX 1: Check state.winner directly
    if state.winner is not None:
        if state.winner == perspective_player:
            return MATE + depth, 0, 0  # Good for perspective player
        else:
            return -MATE - depth, 0, 0  # Bad for perspective player

    if state.is_draw or depth == 0:
        return evaluate(state, config, perspective_player), 0, 0

    p = current_player(state)

    key = position_key(state)
    if key in tt:
        d0, v0 = tt[key]
        if d0 >= depth:
            return v0, 0, 0

    moves = legal_moves(state)
    
    # ✅ Edge case: No legal moves (shouldn't happen if terminal check is correct)
    if not moves:
        return evaluate(state, config, perspective_player), 0, 0
    
    if depth <= 2:
        s = scan(state, config)
        moves = _order_moves(moves, s)

    v = MATE  # ✅ FIX 2: Use MATE instead of math.inf
    nodes = 0
    cutoffs = 0

    for m in moves:
        s2 = _apply_move_state(state, config, m, p)
        nodes += 1

        score, n2, c2 = _max_value(s2, config, depth - 1, alpha, beta, perspective_player, tt, deadline)
        nodes += n2
        cutoffs += c2

        v = min(v, score)
        if v <= alpha:
            tt[key] = (depth, v)
            return v, nodes, cutoffs + 1

        beta = min(beta, v)

    tt[key] = (depth, v)
    return v, nodes, cutoffs


def _order_moves(moves: List[Move], s) -> List[Move]:
    """
    Priority using scan():
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
        if m in centers:
            return (3, centers.index(m))
        return (4, 0)

    return sorted(moves, key=rank)