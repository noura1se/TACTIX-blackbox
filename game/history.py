# game/history.py
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional
from copy import deepcopy

from .types import GameState, Move


@dataclass
class HistoryItem:
    state_snapshot: GameState
    move: Move


class HistoryStack:
    """
    Simple undo stack using full state snapshots.
    """
    def __init__(self) -> None:
        self._stack: List[HistoryItem] = []

    def clear(self) -> None:
        self._stack.clear()

    def push(self, state_before: GameState, move: Move) -> None:
        # Deepcopy to avoid later mutations
        snap = deepcopy(state_before)
        self._stack.append(HistoryItem(state_snapshot=snap, move=move))

    def pop(self) -> Optional[HistoryItem]:
        if not self._stack:
            return None
        return self._stack.pop()

    def __len__(self) -> int:
        return len(self._stack)
