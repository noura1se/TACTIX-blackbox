# game/scan.py
from __future__ import annotations
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any

from .board import available_moves, apply_move_rc
from .rules import check_winner
from .history import HistoryStack
from .types import GameState, GameConfig, Player

MoveRC = Tuple[int, int]

@dataclass
class ScanResult:
    bestMoves: List[MoveRC]      
    dangerMoves: List[MoveRC]    
    forks: List[MoveRC]
    dangerForks: List[MoveRC]  
    centerMoves: List[MoveRC]


def _opponent(p: Player) -> Player:
    return "O" if p == "X" else "X"


def scan(state: GameState, config: GameConfig) -> ScanResult:
    p = state.current_player
    opp = _opponent(p)
    moves = available_moves(state)

    best: List[MoveRC] = []
    danger: List[MoveRC] = []
    forks: List[MoveRC] = []
    centers: List[MoveRC] = _centerish_moves(state, moves)

    temp_history = HistoryStack()

    # 1) immediate win for current player
    for (r, c) in moves:
        snapshot = _copy_state(state)
        h = HistoryStack()
        apply_move_rc(snapshot, config, h, r, c)
        w, _ = check_winner(snapshot.board, config.win_len)
        if w == p:
            best.append((r, c))

    # 2) opponent immediate win (si oponent peut gagner on le block)
    for (r, c) in moves:
        snapshot = _copy_state(state)
        snapshot.current_player = opp
        h = HistoryStack()
        apply_move_rc(snapshot, config, h, r, c)
        w, _ = check_winner(snapshot.board, config.win_len)
        if w == opp:
            danger.append((r, c))

    # 3) forks 
    if not best:
        for (r, c) in moves:
            snap1 = _copy_state(state)
            h1 = HistoryStack()
            apply_move_rc(snap1, config, h1, r, c)
            win_count = 0
            for (rr, cc) in available_moves(snap1):
                snap2 = _copy_state(snap1)
                # ensure same player's next move (fork evaluation)
                snap2.current_player = p
                h2 = HistoryStack()
                apply_move_rc(snap2, config, h2, rr, cc)
                w, _ = check_winner(snap2.board, config.win_len)
                if w == p:
                    win_count += 1
                    if win_count >= 2:
                        forks.append((r, c))
                        break

    dangerForks: List[MoveRC] = []

    # 4) opponent forks (block moves that allow opponent to create 2+ winning moves)
    if not best and not danger:
        for (r, c) in moves:
            # simulate opponent playing here
            snap1 = _copy_state(state)
            snap1.current_player = opp
            h1 = HistoryStack()
            apply_move_rc(snap1, config, h1, r, c)

            win_count = 0
            for (rr, cc) in available_moves(snap1):
                snap2 = _copy_state(snap1)
                snap2.current_player = opp
                h2 = HistoryStack()
                apply_move_rc(snap2, config, h2, rr, cc)
                w, _ = check_winner(snap2.board, config.win_len)
                if w == opp:
                    win_count += 1
                    if win_count >= 2:
                        dangerForks.append((r, c))
                        break


    return ScanResult(
        bestMoves=_uniq(best),
        dangerMoves=_uniq(danger),
        forks=_uniq(forks),
        dangerForks=_uniq(dangerForks),
        centerMoves=_uniq(centers),
    )


def exploit_scan(state: GameState, config: GameConfig) -> Dict[str, Any]:

    s = scan(state, config)
    n = len(state.board)

    def rc_to_pos(rc: MoveRC) -> int:
        return rc[0] * n + rc[1]

    return {
        "bestMovesRC": s.bestMoves,
        "dangerMovesRC": s.dangerMoves,
        "forksRC": s.forks,
        "centerMovesRC": s.centerMoves,
        "bestMoves": [rc_to_pos(m) for m in s.bestMoves],
        "dangerMoves": [rc_to_pos(m) for m in s.dangerMoves],
        "forks": [rc_to_pos(m) for m in s.forks],
        "centerMoves": [rc_to_pos(m) for m in s.centerMoves],
    }


def _centerish_moves(state: GameState, moves: List[MoveRC]) -> List[MoveRC]:
    n = len(state.board)
    mid = (n - 1) / 2.0
    return sorted(moves, key=lambda rc: abs(rc[0] - mid) + abs(rc[1] - mid))


def _uniq(xs: List[MoveRC]) -> List[MoveRC]:
    seen = set()
    out = []
    for x in xs:
        if x not in seen:
            seen.add(x)
            out.append(x)
    return out


def _copy_state(state: GameState) -> GameState:
    board = [row[:] for row in state.board]
    return GameState(
        board=board,
        current_player=state.current_player,
        winner=state.winner,
        is_draw=state.is_draw,
        win_line=state.win_line[:] if state.win_line else None,
        move_count=state.move_count,
    )
