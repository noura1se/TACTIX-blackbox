from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Tuple


def _pct(num: int, den: int) -> float:
    if den == 0:
        return 0.0
    return round((num / den) * 100.0, 2)


def build_dashboard(raw: Dict[str, Any]) -> Dict[str, Any]:
    games: List[Dict[str, Any]] = raw.get("games", [])

    totals = {
        "gamesPlayed": len(games),
        "wins": 0,
        "draws": 0,
        "winsByWinner": defaultdict(int),
    }

    by_size = defaultdict(lambda: {"games": 0, "wins": 0, "draws": 0})
    by_diff = defaultdict(lambda: {"games": 0, "wins": 0, "draws": 0})
    by_mode = defaultdict(lambda: {"games": 0, "wins": 0, "draws": 0})
    by_size_diff = defaultdict(lambda: {"games": 0, "wins": 0, "draws": 0})

    for g in games:
        size = str(g.get("boardSize", "3"))
        diff = str(g.get("difficulty", "MEDIUM"))
        mode = str(g.get("mode", "HUMAN_VS_AI"))
        result = str(g.get("result", "")).upper()
        winner = g.get("winner", None)

        totals["gamesPlayed"] += 0  
        by_size[size]["games"] += 1
        by_diff[diff]["games"] += 1
        by_mode[mode]["games"] += 1
        by_size_diff[(size, diff)]["games"] += 1

        if result == "DRAW":
            totals["draws"] += 1
            by_size[size]["draws"] += 1
            by_diff[diff]["draws"] += 1
            by_mode[mode]["draws"] += 1
            by_size_diff[(size, diff)]["draws"] += 1
        elif result == "WIN":
            totals["wins"] += 1
            by_size[size]["wins"] += 1
            by_diff[diff]["wins"] += 1
            by_mode[mode]["wins"] += 1
            by_size_diff[(size, diff)]["wins"] += 1
            if winner is not None:
                totals["winsByWinner"][str(winner)] += 1

    totals["winsByWinner"] = dict(totals["winsByWinner"])

    def enrich(group: Dict[str, Dict[str, int]]) -> Dict[str, Any]:
        out = {}
        for k, v in group.items():
            out[k] = {
                **v,
                "winRate": _pct(v["wins"], v["games"]),
                "drawRate": _pct(v["draws"], v["games"]),
            }
        return out

    size_diff_table = []
    for (size, diff), v in by_size_diff.items():
        size_diff_table.append({
            "boardSize": size,
            "difficulty": diff,
            "games": v["games"],
            "winRate": _pct(v["wins"], v["games"]),
            "drawRate": _pct(v["draws"], v["games"]),
        })
    size_diff_table.sort(key=lambda x: (int(x["boardSize"]), x["difficulty"]))

    return {
        "meta": raw.get("meta", {}),
        "totals": {
            **totals,
            "overallWinRate": _pct(totals["wins"], totals["gamesPlayed"]),
            "overallDrawRate": _pct(totals["draws"], totals["gamesPlayed"]),
        },
        "byBoardSize": enrich(by_size),
        "byDifficulty": enrich(by_diff),
        "byMode": enrich(by_mode),
        "byBoardSizeAndDifficulty": size_diff_table,
        "recentGames": games[-10:],  # last 10
    }
