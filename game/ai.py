# game/ai.py - DIFFICULTY-FIRST ARCHITECTURE
from __future__ import annotations
from dataclasses import dataclass
from typing import Tuple, Optional, Dict, Any
import random

from .scan import scan
from .minimax import search_best_move
from .types import GameState, GameConfig, Player
from .board import available_moves

MoveRC = Tuple[int, int]

@dataclass
class AIMove:
    move: Optional[MoveRC]
    difficulty: str
    scan_bestMoves: list[MoveRC]
    scan_dangerMoves: list[MoveRC]
    # ajout pour les forks:
    scan_dangerForks: list[MoveRC]
    scan_forks: list[MoveRC]
    score: int
    depth: int


def _board_size(state: GameState) -> int:
    return len(state.board)


def choose_move(state: GameState, config: GameConfig, difficulty: str = "MEDIUM", seed: int | None = None) -> AIMove:
    """
    ┌─────────────────────────────────────────┐
    │   NEW ARCHITECTURE: DIFFICULTY-FIRST     │
    │                                          │
    │   1. DIFFICULTY FILTER (First!)          │
    │      ↓ Decides strategy per level        │
    │   2. EXECUTE STRATEGY                    │
    │      • EASY: 75% random, 25% shallow     │
    │      • MEDIUM: Pure minimax (no scan)    │
    │      • RELENTLESS: Scan + deep minimax   │ 
    │   3. RETURN MOVE                         │
    └─────────────────────────────────────────┘
    
    This creates DRAMATICALLY different playstyles:
    - EASY: Mostly random (beatable)
    - MEDIUM: Tactical but no perfect blocking (fair challenge)
    - RELENTLESS: Perfect play with scan + deep search
    """
    if seed is not None:
        random.seed(seed)

    diff = (difficulty or "MEDIUM").upper().strip()
    n = _board_size(state)
    
    # Get all available moves (needed for random selection)
    all_moves = list(available_moves(state))
    
    if not all_moves:
        return AIMove(move=None, difficulty=diff, scan_bestMoves=[], 
                     scan_dangerMoves=[], scan_dangerForks=[], scan_forks=[], score=0, depth=0)

    # ═══════════════════════════════════════════════════════════
    # EASY MODE: 75% Random, 25% Shallow Minimax (NO SCAN!)
    # ═══════════════════════════════════════════════════════════
    if diff == "EASY":
        # 75% of the time: completely random move
        if random.random() < 0.75:
            pick = random.choice(all_moves)
            return AIMove(
                move=pick,
                difficulty=diff,
                scan_bestMoves=[],
                scan_dangerMoves=[],
                scan_dangerForks=[],
                scan_forks=[],
                score=0,
                depth=0
            )
        
        # 25% of the time: very shallow minimax (no scan ordering)
        depth_map = {
            3: 1,  # 3×3: depth 1 (2 ply lookahead)
            4: 1,  # 4×4: depth 1 (2 ply lookahead)
            5: 1   # 5×5: depth 1 (2 ply lookahead)
        }
        
        depth = depth_map.get(n, 1)
        time_limit = 500  # Short time limit
        
        res = search_best_move(
            state, config, 
            depth=depth, 
            time_limit_ms=time_limit, 
            use_scan_ordering=False  # No scan ordering for EASY
        )
        
        
        return AIMove(
            move=res.move,
            difficulty=diff,
            scan_bestMoves=[],
            scan_dangerMoves=[],
            scan_dangerForks=[],
            scan_forks=[],
            score=res.score,
            depth=res.depth
        )

    # ═══════════════════════════════════════════════════════════
    # MEDIUM MODE: Pure Minimax with Medium Depth (NO SCAN!)
    # ═══════════════════════════════════════════════════════════
    if diff == "MEDIUM":
        # Medium difficulty uses ONLY minimax
        # Depth is calibrated to be challenging but beatable
        
        depth_map = {
            3: 4,  # 3×3: depth 4 (8 ply) - tactical but not perfect
            4: 3,  # 4×4: depth 3 (6 ply) - sees some tactics
            5: 3   # 5×5: depth 3 (6 ply) - tactical patterns
        }
        
        time_map = {
            3: 2000,   # 2 seconds for 3×3
            4: 3000,   # 3 seconds for 4×4
            5: 2500    # 2.5 seconds for 5×5
        }
        
        depth = depth_map.get(n, 3)
        time_limit = time_map.get(n, 2000)
        
        res = search_best_move(
            state, config,
            depth=depth,
            time_limit_ms=time_limit,
            use_scan_ordering=False  # No scan for MEDIUM - pure search
        )
        
        return AIMove(
            move=res.move,
            difficulty=diff,
            scan_bestMoves=[],
            scan_dangerMoves=[],
            scan_dangerForks=[],
            scan_forks=[],
            score=res.score,
            depth=res.depth
        )

    # ═══════════════════════════════════════════════════════════
    # RELENTLESS MODE: Scan + Deep Minimax (PERFECT PLAY)
    # ═══════════════════════════════════════════════════════════
    
    # Run scan for immediate tactical opportunities
    s = scan(state, config)
    
    # RELENTLESS always takes winning moves
    if s.bestMoves:
        return AIMove(
            move=s.bestMoves[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            scan_dangerForks=getattr(s, "dangerForks", []),
            scan_forks=getattr(s, "forks", []),
            score=999999,
            depth=0
        )
    
    # RELENTLESS always blocks opponent wins
    if s.dangerMoves:
        return AIMove(
            move=s.dangerMoves[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            scan_dangerForks=getattr(s, "dangerForks", []),
            scan_forks=getattr(s, "forks", []),
            score=500000,
            depth=0
        )

    
    # RELENTLESS blocks opponent forks (2-move threats)
    if getattr(s, "dangerForks", []):
        return AIMove(
            move=s.dangerForks[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            scan_dangerForks=getattr(s, "dangerForks", []),
            scan_forks=getattr(s, "forks", []),
            score=400000,
            depth=0
        )

    # RELENTLESS plays its own forks (create 2-move trap)
    if getattr(s, "forks", []):
        return AIMove(
            move=s.forks[0],
            difficulty=diff,
            scan_bestMoves=s.bestMoves,
            scan_dangerMoves=s.dangerMoves,
            scan_dangerForks=getattr(s, "dangerForks", []),
            scan_forks=getattr(s, "forks", []),
            score=300000,
            depth=0
        )


    # For non-critical positions: use deep minimax with scan ordering
    depth_map = {
        3: 9,   # 3×3: depth 9 - PERFECT (full game tree)
        4: 6,   # 4×4: depth 6 - near-perfect
        5: 5    # 5×5: depth 5 - very strong
    }
    
    time_map = {
        3: 5000,   # 5 seconds for 3×3 (overkill but ensures completion)
        4: 10000,  # 10 seconds for 4×4 (needs time for depth 6)
        5: 8000    # 8 seconds for 5×5
    }
    
    depth = depth_map.get(n, 5)
    time_limit = time_map.get(n, 5000)
    
    res = search_best_move(
        state, config,
        depth=depth,
        time_limit_ms=time_limit,
        use_scan_ordering=True  # Use scan for move ordering
    )
    
    return AIMove(
        move=res.move,
        difficulty=diff,
        scan_bestMoves=s.bestMoves,
        scan_dangerMoves=s.dangerMoves,
        scan_dangerForks=getattr(s, "dangerForks", []),
        scan_forks=getattr(s, "forks", []),
        score=res.score,
        depth=res.depth
    )


def choose_ai_move(state: GameState, config: GameConfig, difficulty: str = "MEDIUM"):
    """
    Flask-compatible AI entrypoint.
    Returns (pos:int, meta:dict) where pos is flattened board index.
    """
    ai = choose_move(state, config, difficulty=difficulty)
    if ai.move is None:
        return None, {"reason": "no_moves"}
        
    n = len(state.board) 
    pos = ai.move[0] * n + ai.move[1]
    
    # Check difficulty to determine what scan data to include
    diff = (difficulty or "MEDIUM").upper().strip()
    
    if diff in ["EASY", "MEDIUM"]:
        # EASY and MEDIUM don't use scan, return empty scan/fork data
        meta: Dict[str, Any] = {
            "difficulty": ai.difficulty,
            "score": ai.score,
            "depth": ai.depth,
            "scan_bestMovesRC": [],
            "scan_dangerMovesRC": [],
            "scan_dangerForksRC": [],
            "scan_forksRC": [],
        }
    else:  # RELENTLESS
        # RELENTLESS uses scan, return full scan data
        meta: Dict[str, Any] = {
            "difficulty": ai.difficulty,
            "score": ai.score,
            "depth": ai.depth,
            "scan_bestMovesRC": ai.scan_bestMoves,
            "scan_dangerMovesRC": ai.scan_dangerMoves,
            "scan_dangerForksRC": getattr(ai, "scan_dangerForks", []),
            "scan_forksRC": getattr(ai, "scan_forks", []),
        }
    
    return pos, meta