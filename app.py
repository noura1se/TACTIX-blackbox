from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import random
from datetime import datetime

# Initialisation de l'application Flask
app = Flask(__name__)
app.secret_key = 'blackbox_secret_key_2024'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Recharge automatiquement les templates

# État du jeu
games = {}
stats = {
    'total_games': 102,
    'operator_wins': 58,
    'system_wins': 44,
    'undetected_wins': 46,
    'exploits': 19,
    'firewall_locks': 16,
    'grid_stats': {
        '3x3': {'wins': 31, 'losses': 5, 'draws': 2, 'rate': 81},
        '4x4': {'wins': 23, 'losses': 15, 'draws': 4, 'rate': 55},
        '5x5': {'wins': 6, 'losses': 14, 'draws': 2, 'rate': 25}
    }
}

class BlackboxGame:
    def __init__(self, grid_size=3, mode="OPERATOR vs SYSTEM", difficulty="MEDIUM"):
        self.grid_size = grid_size
        self.mode = mode
        self.difficulty = difficulty
        self.board = [['' for _ in range(grid_size)] for _ in range(grid_size)]
        self.current_player = 'OPERATOR'
        self.game_over = False
        self.winner = None
        self.moves = []
        self.exploit_used = False
        self.firewall_active = False
        self.start_time = datetime.now()
        self.game_id = f"game_{len(games)}_{datetime.now().timestamp()}"

def create_game_id():
    return f"game_{len(games)}_{datetime.now().timestamp()}"

# Helper functions
def check_win(board, row, col):
    size = len(board)
    player = board[row][col]
    
    # Check row
    if all(board[row][c] == player for c in range(size)):
        return True
    
    # Check column
    if all(board[r][col] == player for r in range(size)):
        return True
    
    # Check main diagonal
    if row == col and all(board[i][i] == player for i in range(size)):
        return True
    
    # Check anti-diagonal
    if row + col == size - 1 and all(board[i][size-1-i] == player for i in range(size)):
        return True
    
    return False

def check_draw(board):
    return all(cell != '' for row in board for cell in row)

def find_best_move(board, player):
    size = len(board)
    empty_cells = [(r, c) for r in range(size) for c in range(size) if board[r][c] == '']
    return random.choice(empty_cells) if empty_cells else None

def analyze_board(board):
    size = len(board)
    analysis = {
        'operator_cells': sum(1 for r in range(size) for c in range(size) if board[r][c] == 'O'),
        'system_cells': sum(1 for r in range(size) for c in range(size) if board[r][c] == 'S'),
        'empty_cells': sum(1 for r in range(size) for c in range(size) if board[r][c] == ''),
        'threat_level': random.choice(['LOW', 'MEDIUM', 'HIGH'])
    }
    return analysis

def update_stats(winner, grid_size):
    global stats
    stats['total_games'] += 1
    
    if winner == 'OPERATOR':
        stats['operator_wins'] += 1
        if random.random() > 0.5:
            stats['undetected_wins'] += 1
    else:
        stats['system_wins'] += 1
    
    # Update grid stats
    grid_key = f"{grid_size}x{grid_size}"
    if grid_key in stats['grid_stats']:
        if winner == 'OPERATOR':
            stats['grid_stats'][grid_key]['wins'] += 1
        else:
            stats['grid_stats'][grid_key]['losses'] += 1
        
        total = (stats['grid_stats'][grid_key]['wins'] + 
                stats['grid_stats'][grid_key]['losses'] + 
                stats['grid_stats'][grid_key]['draws'])
        if total > 0:
            stats['grid_stats'][grid_key]['rate'] = int(
                (stats['grid_stats'][grid_key]['wins'] / total) * 100
            )

# Routes principales
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/configure')
def configure():
    return render_template('configure.html')

@app.route('/game')
def game():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return redirect('/configure')
    return render_template('game.html')

@app.route('/stats')
def stats():
    return render_template('stats.html')

# API Endpoints
@app.route('/api/new_game', methods=['POST'])
def new_game():
    data = request.json
    game = BlackboxGame(
        grid_size=int(data.get('grid_size', 3)),
        mode=data.get('mode', 'OPERATOR vs SYSTEM'),
        difficulty=data.get('difficulty', 'MEDIUM')
    )
    game_id = create_game_id()
    games[game_id] = game
    session['current_game'] = game_id
    return jsonify({'status': 'created', 'game_id': game_id})

@app.route('/api/move', methods=['POST'])
def make_move():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    data = request.json
    row = data.get('row')
    col = data.get('col')
    
    if game.board[row][col] != '':
        return jsonify({'error': 'Cell already occupied'}), 400
    
    # Make move
    game.board[row][col] = game.current_player[0]
    game.moves.append((row, col, game.current_player))
    
    # Check win condition
    if check_win(game.board, row, col):
        game.winner = game.current_player
        game.game_over = True
        update_stats(game.current_player, game.grid_size)
    # Check draw condition
    elif check_draw(game.board):
        game.winner = 'DRAW'
        game.game_over = True
    
    # Switch player only if game is not over
    if not game.game_over:
        game.current_player = 'SYSTEM' if game.current_player == 'OPERATOR' else 'OPERATOR'
    
    return jsonify({
        'status': 'success',
        'board': game.board,
        'current_player': game.current_player,
        'game_over': game.game_over,
        'winner': game.winner
    })

@app.route('/api/system_move', methods=['POST'])
def system_move():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    
    # Simple AI: find empty cell
    empty_cells = []
    for i in range(game.grid_size):
        for j in range(game.grid_size):
            if game.board[i][j] == '':
                empty_cells.append((i, j))
    
    if empty_cells:
        row, col = random.choice(empty_cells)
        return jsonify({'row': row, 'col': col})
    
    return jsonify({'error': 'No empty cells'}), 400

@app.route('/api/game_state', methods=['GET'])
def get_game_state():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    return jsonify({
        'grid_size': game.grid_size,
        'board': game.board,
        'current_player': game.current_player,
        'game_over': game.game_over,
        'move_count': len(game.moves)
    })

@app.route('/api/scan', methods=['POST'])
def exploit_scan():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    game.exploit_used = True
    
    best_move = find_best_move(game.board, 'OPERATOR')
    return jsonify({
        'status': 'scan_complete',
        'recommendation': best_move,
        'board_analysis': analyze_board(game.board)
    })

@app.route('/api/firewall', methods=['POST'])
def firewall_lock():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    game.firewall_active = True
    
    return jsonify({
        'status': 'firewall_active',
        'duration': 3,
        'message': 'SYSTEM movements restricted'
    })

@app.route('/api/reset', methods=['POST'])
def reset_game():
    game_id = session.get('current_game')
    if game_id in games:
        game = games[game_id]
        game.board = [['' for _ in range(game.grid_size)] for _ in range(game.grid_size)]
        game.current_player = 'OPERATOR'
        game.game_over = False
        game.winner = None
        game.moves = []
    
    return jsonify({'status': 'reset'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify(stats)

@app.route('/api/stats/reset', methods=['POST'])
def reset_stats():
    global stats
    stats = {
        'total_games': 0,
        'operator_wins': 0,
        'system_wins': 0,
        'undetected_wins': 0,
        'exploits': 0,
        'firewall_locks': 0,
        'grid_stats': {
            '3x3': {'wins': 0, 'losses': 0, 'draws': 0, 'rate': 0},
            '4x4': {'wins': 0, 'losses': 0, 'draws': 0, 'rate': 0},
            '5x5': {'wins': 0, 'losses': 0, 'draws': 0, 'rate': 0}
        }
    }
    return jsonify({'status': 'stats_reset'})

@app.route('/api/undo', methods=['POST'])
def undo_move():
    game_id = session.get('current_game')
    if not game_id or game_id not in games:
        return jsonify({'error': 'No active game'}), 400
    
    game = games[game_id]
    if game.moves:
        row, col, player = game.moves.pop()
        game.board[row][col] = ''
        game.current_player = player
        game.game_over = False
        game.winner = None
    
    return jsonify({
        'status': 'undo',
        'board': game.board,
        'current_player': game.current_player
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')