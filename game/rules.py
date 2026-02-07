# game/rules.py
from __future__ import annotations

from typing import List, Optional, Tuple
from .types import Cell, Player, Coord


def check_winner(board: List[List[Cell]], win_len: int) -> Tuple[Optional[Player], Optional[List[Coord]]]:
    """
    Returns:
      (winner, win_line_coords) if someone won
      (None, None) otherwise
    """
    n = len(board)
    if n == 0:
        return None, None

    directions = [
        (0, 1),   # right
        (1, 0),   # down
        (1, 1),   # diag down-right
        (-1, 1),  # diag up-right
    ]

    for r in range(n):
        for c in range(n):
            start = board[r][c]
            if start is None:
                continue

            for dr, dc in directions:
                coords: List[Coord] = [(r, c)]
                rr, cc = r, c

                for _ in range(1, win_len):
                    rr += dr
                    cc += dc
                    if rr < 0 or rr >= n or cc < 0 or cc >= n:
                        break
                    if board[rr][cc] != start:
                        break
                    coords.append((rr, cc))

                if len(coords) == win_len:
                    return start, coords

    return None, None


def is_draw(board: List[List[Cell]], winner: Optional[Player]) -> bool:
    if winner is not None:
        return False
    return all(cell is not None for row in board for cell in row)
