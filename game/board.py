# game/board.py
from __future__ import annotations

from typing import List, Tuple, Optional, Dict, Any
from copy import deepcopy

from .types import GameConfig, GameState, MoveResult, Player, Cell, Move, Coord
from .rules import check_winner, is_draw
from .history import HistoryStack


def _empty_board(size: int) -> List[List[Cell]]:
    return [[None for _ in range(size)] for _ in range(size)]


def new_state(config: GameConfig) -> GameState:
    board = _empty_board(config.size)
    return GameState(
        board=board,
        current_player=config.starting_player,
        winner=None,
        is_draw=False,
        win_line=None,
        move_count=0,
    )


def in_bounds(state: GameState, r: int, c: int) -> bool:
    n = len(state.board)
    return 0 <= r < n and 0 <= c < n


def is_valid_move(state: GameState, r: int, c: int) -> bool:
    if state.winner is not None or state.is_draw:
        return False
    if not in_bounds(state, r, c):
        return False
    return state.board[r][c] is None


def available_moves(state: GameState) -> List[Tuple[int, int]]:
    moves: List[Tuple[int, int]] = []
    if state.winner is not None or state.is_draw:
        return moves

    n = len(state.board)
    for r in range(n):
        for c in range(n):
            if state.board[r][c] is None:
                moves.append((r, c))
    return moves


def _switch_player(p: Player) -> Player:
    return "O" if p == "X" else "X"


def apply_move_rc(
    state: GameState,
    config: GameConfig,
    history: HistoryStack,
    r: int,
    c: int
) -> MoveResult: 
    """
    explication importante : 

    Applies a move for current_player at (r,c).
    Pushes a snapshot to history before mutating.

    Returns MoveResult with updated state (mutated in-place).
    """
    if state.winner is not None:
        return MoveResult(False, "Game already finished: winner exists.", state)
    if state.is_draw:
        return MoveResult(False, "Game already finished: draw.", state)
    if not in_bounds(state, r, c):
        return MoveResult(False, "Invalid move: out of bounds.", state)
    if state.board[r][c] is not None:
        return MoveResult(False, "Invalid move: cell already taken.", state)

    # snapshot before change
    before = deepcopy(state)
    move = Move(row=r, col=c, player=state.current_player)
    history.push(before, move)

    # apply
    state.board[r][c] = state.current_player
    state.move_count += 1

    winner, line = check_winner(state.board, config.win_len)
    state.winner = winner
    state.win_line = line

    state.is_draw = is_draw(state.board, state.winner)

    if state.winner is None and not state.is_draw:
        state.current_player = _switch_player(state.current_player)

    return MoveResult(True, "OK", state)


def undo_rc(state: GameState, history: HistoryStack) -> MoveResult:
    """
    Restores the previous state snapshot from history.
    """
    item = history.pop()
    if item is None:
        return MoveResult(False, "Nothing to undo.", state)

    snap = item.state_snapshot
    state.board = snap.board
    state.current_player = snap.current_player
    state.winner = snap.winner
    state.is_draw = snap.is_draw
    state.win_line = snap.win_line
    state.move_count = snap.move_count

    return MoveResult(True, "UNDONE", state)


def reset_rc(state: GameState, config: GameConfig, history: HistoryStack) -> MoveResult:
    """
    Resets the game to initial state.
    """
    history.clear()
    fresh = new_state(config)

    state.board = fresh.board
    state.current_player = fresh.current_player
    state.winner = None
    state.is_draw = False
    state.win_line = None
    state.move_count = 0

    return MoveResult(True, "RESET", state)


# ==========================================================
#  COMPATIBILITY LAYER 
# ==========================================================

def legal_moves(state: GameState) -> List[int]:
    """Return legal moves as positions 0..n*n-1 """
    n = len(state.board)
    return [r * n + c for (r, c) in available_moves(state)]


def _pos_to_rc(state: GameState, pos: int) -> Tuple[int, int]:
    n = len(state.board)
    pos = int(pos)
    return pos // n, pos % n


def check_status(state: GameState) -> Dict[str, Any]:
    
    if state.winner is not None:
        return {"state": "WIN", "winner": state.winner, "winLine": state.win_line}
    if state.is_draw:
        return {"state": "DRAW", "winner": None, "winLine": None}
    return {"state": "ONGOING", "winner": None, "winLine": None}


def apply_move(state: GameState, config: GameConfig, history: HistoryStack, pos: int) -> GameState:
    
    r, c = _pos_to_rc(state, pos)
    res = apply_move_rc(state, config, history, r, c)
    if not res.valid:
        raise ValueError(res.message)
    return res.state


def undo(state: GameState, history: HistoryStack) -> GameState:
    res = undo_rc(state, history)
    if not res.valid:
        raise ValueError(res.message)
    return res.state


def reset(state: GameState, config: GameConfig, history: HistoryStack) -> GameState:
    res = reset_rc(state, config, history)
    if not res.valid:
        raise ValueError(res.message)
    return res.state
