from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Any, Optional, Tuple

from flask import Blueprint, jsonify, request

from stats.store import StatsStore
from stats.metrics import build_dashboard

from config.settings import (
    WIN_LENGTHS,
    MODE_VS_SYSTEM,
    MODE_VS_OPERATOR,
    DIFFICULTY_EASY,
    DIFFICULTY_MEDIUM,
    DIFFICULTY_RELENTLESS,
)

api_bp = Blueprint("api", __name__)

try:
    from game.types import GameConfig, GameState
    from game.board import new_state, apply_move, legal_moves, check_status, undo, reset
    from game.history import HistoryStack
    from game.ai import choose_ai_move
    from game.scan import exploit_scan
except Exception as e:
    GameConfig = None  
    GameState = None  
    new_state = None  
    apply_move = None  
    legal_moves = None  
    check_status = None  
    undo = None  
    reset = None  
    HistoryStack = None  
    choose_ai_move = None  
    exploit_scan = None  
    _IMPORT_ERROR = str(e)
else:
    _IMPORT_ERROR = ""


def _engine_ready() -> Tuple[bool, str]:
    if _IMPORT_ERROR:
        return False, (
            f"Import error: {_IMPORT_ERROR}" 
        )
    required = ["new_state", "apply_move", "legal_moves", "check_status", "HistoryStack", "choose_ai_move", "exploit_scan", "undo", "reset"]
    missing = [name for name in required if globals().get(name) is None]
    if missing:
        return False, f"Game engine is missing: {', '.join(missing)}"
    return True, ""


def _to_dict(obj: Any) -> Any:
    if is_dataclass(obj):
        return asdict(obj)
    return obj


STORE = StatsStore(db_path="data/tactix.db")

STATE: Optional[GameState] = None
CONFIG: Optional[GameConfig] = None
HISTORY: Optional[HistoryStack] = None

MODE_MAP = {
    "HUMAN_VS_AI": MODE_VS_SYSTEM,
    "OPERATOR_VS_SYSTEM": MODE_VS_SYSTEM,
    "HUMAN_VS_HUMAN": MODE_VS_OPERATOR,
    "OPERATOR_VS_OPERATOR": MODE_VS_OPERATOR,
}

DIFF_MAP = {
    "EASY": DIFFICULTY_EASY,
    "MEDIUM": DIFFICULTY_MEDIUM,
    "RELENTLESS": DIFFICULTY_RELENTLESS,
}


def _ensure_match():
    if STATE is None or CONFIG is None or HISTORY is None:
        return False, "No active match. Call POST /api/new first."
    return True, ""


def _json_ok(data: Any = None, message: str = "OK", code: int = 200):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), code


def _json_err(message: str, code: int = 400, data: Any = None):
    payload = {"success": False, "message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), code


@api_bp.get("/health")
def health():
    ok, err = _engine_ready()
    return _json_ok({"engineReady": ok, "error": err})


@api_bp.post("/new")
def api_new():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    body = request.get_json(silent=True) or {}

    board_size = int(body.get("boardSize", 3))
    ui_mode = str(body.get("mode", "HUMAN_VS_AI")).upper().strip()
    ui_diff = str(body.get("difficulty", "MEDIUM")).upper().strip()

    mode = MODE_MAP.get(ui_mode, MODE_VS_SYSTEM)
    difficulty = DIFF_MAP.get(ui_diff, DIFFICULTY_MEDIUM)

    win_len = WIN_LENGTHS.get(board_size, 3)

    global STATE, CONFIG, HISTORY
    try:
        CONFIG = GameConfig(size=board_size, win_len=win_len, starting_player="X")
        STATE = new_state(CONFIG)
        HISTORY = HistoryStack()
        api_new._mode = mode  
        api_new._difficulty = difficulty  
    except Exception as e:
        return _json_err("Failed to start new match.", 500, {"error": str(e)})

    return _json_ok({"config": _to_dict(CONFIG), "state": _to_dict(STATE)}, "Match created", 201)


@api_bp.get("/state")
def api_state():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    has, msg = _ensure_match()
    if not has:
        return _json_err(msg, 404)

    return _json_ok({
        "config": _to_dict(CONFIG),
        "state": _to_dict(STATE),
        "legalMoves": legal_moves(STATE),
        "status": check_status(STATE),
    })


@api_bp.post("/move")
def api_move():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    has, msg = _ensure_match()
    if not has:
        return _json_err(msg, 404) 

    body = request.get_json(silent=True) or {}
    pos = body.get("pos", None)
    if pos is None:
        return _json_err("Missing 'pos' in request body.", 400)

    global STATE, CONFIG, HISTORY

    mode = getattr(api_new, "_mode", MODE_VS_SYSTEM)  
    difficulty = getattr(api_new, "_difficulty", DIFFICULTY_MEDIUM)  

    try:
        
        STATE = apply_move(STATE, CONFIG, HISTORY, int(pos))
        status = check_status(STATE)

        ai_meta = None

        if mode == MODE_VS_SYSTEM and status["state"] == "ONGOING":
            ai_pos, ai_meta = choose_ai_move(STATE, CONFIG, difficulty=str(difficulty))
            if ai_pos is not None:
                STATE = apply_move(STATE, CONFIG, HISTORY, int(ai_pos))
                status = check_status(STATE)

    except Exception as e:
        return _json_err("Failed to apply move.", 400, {"error": str(e)})

    # record stats only when finished
    if status["state"] in ("WIN", "DRAW"):
        try:
            STORE.record_game(
                board_size=int(CONFIG.size),
                difficulty=str(difficulty).upper(),
                mode=str(mode).upper(),
                result=status["state"],
                winner=status.get("winner"),
            )
        except Exception:
            pass

    return _json_ok({
        "state": _to_dict(STATE),
        "status": status,
        "aiMeta": ai_meta,
        "legalMoves": legal_moves(STATE),
    })


@api_bp.post("/undo")
def api_undo():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    has, msg = _ensure_match()
    if not has:
        return _json_err(msg, 404)

    global STATE, HISTORY
    try:
        STATE = undo(STATE, HISTORY)
    except Exception as e:
        return _json_err("Undo failed.", 400, {"error": str(e)})

    return _json_ok({
        "state": _to_dict(STATE),
        "status": check_status(STATE),
        "legalMoves": legal_moves(STATE),
    }, "Undone")


@api_bp.post("/reset")
def api_reset():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    has, msg = _ensure_match()
    if not has:
        return _json_err(msg, 404)

    global STATE, CONFIG, HISTORY
    try:
        STATE = reset(STATE, CONFIG, HISTORY)
    except Exception as e:
        return _json_err("Reset failed.", 500, {"error": str(e)})

    return _json_ok({
        "state": _to_dict(STATE),
        "status": check_status(STATE),
        "legalMoves": legal_moves(STATE),
    }, "Match reset")


@api_bp.post("/scan")
def api_scan():
    ok, err = _engine_ready()
    if not ok:
        return _json_err(err, 500)

    has, msg = _ensure_match()
    if not has:
        return _json_err(msg, 404)

    try:
        analysis = exploit_scan(STATE, CONFIG)
    except Exception as e:
        return _json_err("Scan failed.", 500, {"error": str(e)})

    return _json_ok({"scan": analysis})


@api_bp.get("/stats")
def api_stats():
    try:
        raw = STORE.load()
        dashboard = build_dashboard(raw)
    except Exception as e:
        return _json_err("Failed to load stats.", 500, {"error": str(e)})

    return _json_ok(dashboard)


@api_bp.post("/stats/reset")
def api_stats_reset():
    try:
        STORE.reset()
    except Exception as e:
        return _json_err("Failed to reset stats.", 500, {"error": str(e)})
    return _json_ok(message="Stats cleared")
