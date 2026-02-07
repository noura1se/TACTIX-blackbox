import pytest

from game import (
    GameConfig, HistoryStack, new_state,
    apply_move, undo, reset,
    is_valid_move, available_moves
)


# -----------------------
# Helpers
# -----------------------
def make(cfg: GameConfig):
    hist = HistoryStack()
    st = new_state(cfg)
    return st, hist


def play_seq(st, hist, cfg, moves):
    """
    moves: list of (r,c)
    """
    results = []
    for (r, c) in moves:
        results.append(apply_move(st, cfg, hist, r, c))
    return results


# -----------------------
# Tests
# -----------------------
def test_init_state_3x3_empty():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    assert len(st.board) == 3
    assert all(len(row) == 3 for row in st.board)
    assert all(cell is None for row in st.board for cell in row)
    assert st.current_player == "X"
    assert st.winner is None
    assert st.is_draw is False
    assert st.win_line is None
    assert st.move_count == 0
    assert len(hist) == 0


def test_available_moves_count_initial():
    cfg = GameConfig(size=4, win_len=4, starting_player="X")
    st, _ = make(cfg)

    moves = available_moves(st)
    assert len(moves) == 16
    assert (0, 0) in moves
    assert (3, 3) in moves


def test_is_valid_move_false_out_of_bounds():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, _ = make(cfg)

    assert is_valid_move(st, -1, 0) is False
    assert is_valid_move(st, 0, -1) is False
    assert is_valid_move(st, 3, 0) is False
    assert is_valid_move(st, 0, 3) is False


def test_apply_move_places_and_switches_player():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    res = apply_move(st, cfg, hist, 0, 0)
    assert res.valid is True
    assert st.board[0][0] == "X"
    assert st.current_player == "O"
    assert st.move_count == 1
    assert len(hist) == 1


def test_invalid_move_on_taken_cell():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    assert apply_move(st, cfg, hist, 0, 0).valid is True
    res2 = apply_move(st, cfg, hist, 0, 0)
    assert res2.valid is False
    assert "taken" in res2.message.lower()
    # still O's turn since second move rejected
    assert st.current_player == "O"


def test_horizontal_win_3x3_returns_win_line():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    # X: (0,0), O: (1,0), X: (0,1), O: (1,1), X: (0,2) -> X wins
    play_seq(st, hist, cfg, [(0,0),(1,0),(0,1),(1,1),(0,2)])

    assert st.winner == "X"
    assert st.is_draw is False
    assert st.win_line == [(0,0),(0,1),(0,2)]


def test_vertical_win_4x4():
    cfg = GameConfig(size=4, win_len=4, starting_player="X")
    st, hist = make(cfg)

    # Make X win on col 2: (0,2),(1,2),(2,2),(3,2)
    # Interleave O moves elsewhere
    play_seq(st, hist, cfg, [
        (0,2), (0,0),
        (1,2), (1,0),
        (2,2), (2,0),
        (3,2)
    ])

    assert st.winner == "X"
    assert st.win_line == [(0,2),(1,2),(2,2),(3,2)]


def test_diag_down_right_win_5x5():
    cfg = GameConfig(size=5, win_len=5, starting_player="X")
    st, hist = make(cfg)

    # X diagonal ↘: (0,0)(1,1)(2,2)(3,3)(4,4)
    # O plays off-diagonal
    play_seq(st, hist, cfg, [
        (0,0), (0,1),
        (1,1), (0,2),
        (2,2), (0,3),
        (3,3), (0,4),
        (4,4)
    ])

    assert st.winner == "X"
    assert st.win_line == [(0,0),(1,1),(2,2),(3,3),(4,4)]


def test_diag_up_right_win_3x3():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    # X diagonal ↗: (2,0)(1,1)(0,2)
    play_seq(st, hist, cfg, [
        (2,0), (0,0),
        (1,1), (0,1),
        (0,2)
    ])

    assert st.winner == "X"
    assert st.win_line == [(2,0),(1,1),(0,2)]


def test_draw_3x3_no_winner():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    # A known draw pattern:
    # X O X
    # X X O
    # O X O
    moves = [
        (0,0), (0,1), (0,2),
        (1,2), (1,0), (2,0),
        (1,1), (2,2), (2,1),
    ]
    play_seq(st, hist, cfg, moves)

    assert st.winner is None
    assert st.is_draw is True
    assert st.win_line is None
    assert len(available_moves(st)) == 0


def test_undo_restores_cell_player_and_move_count():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    apply_move(st, cfg, hist, 0, 0)  # X
    apply_move(st, cfg, hist, 1, 1)  # O
    assert st.board[1][1] == "O"
    assert st.current_player == "X"
    assert st.move_count == 2

    u = undo(st, hist)
    assert u.valid is True
    assert st.board[1][1] is None
    assert st.current_player == "O"
    assert st.move_count == 1


def test_undo_after_win_removes_winner_and_win_line():
    cfg = GameConfig(size=3, win_len=3, starting_player="X")
    st, hist = make(cfg)

    play_seq(st, hist, cfg, [(0,0),(1,0),(0,1),(1,1),(0,2)])  # X wins
    assert st.winner == "X"
    assert st.win_line is not None

    u = undo(st, hist)  # undo last winning move
    assert u.valid is True
    assert st.winner is None
    assert st.win_line is None
    assert st.is_draw is False
    # It should now be X's turn again (since we undid X's last move)
    assert st.current_player == "X"


def test_reset_clears_board_and_history():
    cfg = GameConfig(size=4, win_len=4, starting_player="X")
    st, hist = make(cfg)

    apply_move(st, cfg, hist, 0, 0)
    apply_move(st, cfg, hist, 1, 1)
    assert len(hist) == 2

    r = reset(st, cfg, hist)
    assert r.valid is True
    assert len(hist) == 0
    assert all(cell is None for row in st.board for cell in row)
    assert st.current_player == "X"
    assert st.winner is None
    assert st.is_draw is False
    assert st.win_line is None
    assert st.move_count == 0
