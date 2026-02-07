# game/types.py
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple, Literal

Player = Literal["X", "O"]
Cell = Optional[Player]
Coord = Tuple[int, int]  # (row, col)


@dataclass(frozen=True)
class GameConfig:
    size: int
    win_len: int
    starting_player: Player = "X"


@dataclass
class GameState:
    board: List[List[Cell]]
    current_player: Player
    winner: Optional[Player] = None
    is_draw: bool = False
    win_line: Optional[List[Coord]] = None
    move_count: int = 0


@dataclass(frozen=True)
class Move:
    row: int
    col: int
    player: Player


@dataclass
class MoveResult:
    valid: bool
    message: str
    state: GameState
