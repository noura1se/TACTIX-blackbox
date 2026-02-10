from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import random
import time
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Changez ceci en production

# Définition des routes

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/configure')
def configure():
    return render_template('configure.html')

@app.route('/game')
def game():
    # Si la session n'a pas de partie en cours, rediriger vers /configure
    if 'board' not in session:
        return redirect(url_for('configure'))
    return render_template('game.html')

@app.route('/stats')
def stats():
    return render_template('stats.html')

# API pour la configuration d'une nouvelle partie
@app.route('/api/new', methods=['POST'])
def new_game():
    data = request.json
    grid_size = int(data.get('grid_size', 3))
    mode = data.get('mode', 'OPERATOR vs SYSTEM')
    difficulty = data.get('difficulty', 'EASY')

    # Initialisation du plateau
    board = [['' for _ in range(grid_size)] for _ in range(grid_size)]
    session['board'] = board
    session['grid_size'] = grid_size
    session['mode'] = mode
    session['difficulty'] = difficulty
    session['turn'] = 'X'  # OPERATOR commence
    session['moves'] = []
    session['game_over'] = False
    session['winner'] = None

    return jsonify({'status': 'ok', 'board': board})

# API pour jouer un coup
@app.route('/api/move', methods=['POST'])
def make_move():
    if 'board' not in session:
        return jsonify({'error': 'No game in session'}), 400

    data = request.json
    row = data.get('row')
    col = data.get('col')

    board = session['board']
    if session['game_over']:
        return jsonify({'error': 'Game is over'}), 400

    if board[row][col] != '':
        return jsonify({'error': 'Cell already taken'}), 400

    # Jouer le coup de l'OPERATOR (X)
    board[row][col] = 'X'
    session['board'] = board
    session['moves'].append(('X', row, col))

    # Vérifier si l'OPERATOR a gagné
    if check_win(board, 'X'):
        session['game_over'] = True
        session['winner'] = 'X'
        return jsonify({'status': 'win', 'board': board, 'winner': 'X'})

    # Vérifier s'il y a match nul
    if is_board_full(board):
        session['game_over'] = True
        session['winner'] = 'Draw'
        return jsonify({'status': 'draw', 'board': board})

    # Si le mode est OPERATOR vs SYSTEM, le SYSTEM joue
    if session['mode'] == 'OPERATOR vs SYSTEM':
        # Simuler un coup du SYSTEM en fonction de la difficulté
        system_move = get_system_move(board, session['difficulty'])
        if system_move:
            row_s, col_s = system_move
            board[row_s][col_s] = 'O'
            session['board'] = board
            session['moves'].append(('O', row_s, col_s))

            if check_win(board, 'O'):
                session['game_over'] = True
                session['winner'] = 'O'
                return jsonify({'status': 'loss', 'board': board, 'winner': 'O'})

            if is_board_full(board):
                session['game_over'] = True
                session['winner'] = 'Draw'
                return jsonify({'status': 'draw', 'board': board})

    return jsonify({'status': 'ok', 'board': board})

def get_system_move(board, difficulty):
    grid_size = len(board)
    available_moves = [(i, j) for i in range(grid_size) for j in range(grid_size) if board[i][j] == '']

    if not available_moves:
        return None

    # En fonction de la difficulté, on choisit une stratégie
    if difficulty == 'EASY':
        # Coup aléatoire
        return random.choice(available_moves)
    elif difficulty == 'MEDIUM':
        # Parfois aléatoire, parfois bloquer ou gagner
        if random.random() < 0.5:
            return random.choice(available_moves)
        else:
            # Essayer de gagner ou de bloquer
            pass
    elif difficulty == 'RELENTLESS':
        # Utiliser un algorithme plus avancé (minimax pour Tic-Tac-Toe)
        pass

    # Pour l'instant, on retourne un coup aléatoire
    return random.choice(available_moves)

def check_win(board, player):
    grid_size = len(board)
    # Vérifier les lignes et les colonnes
    for i in range(grid_size):
        if all(board[i][j] == player for j in range(grid_size)):
            return True
        if all(board[j][i] == player for j in range(grid_size)):
            return True
    # Vérifier les diagonales
    if all(board[i][i] == player for i in range(grid_size)):
        return True
    if all(board[i][grid_size-1-i] == player for i in range(grid_size)):
        return True
    return False

def is_board_full(board):
    for row in board:
        for cell in row:
            if cell == '':
                return False
    return True

# API pour annuler le dernier coup
@app.route('/api/undo', methods=['POST'])
def undo():
    if 'board' not in session or 'moves' not in session:
        return jsonify({'error': 'No game in session'}), 400

    moves = session['moves']
    if len(moves) == 0:
        return jsonify({'error': 'No moves to undo'}), 400

    # Annuler le dernier coup
    last_move = moves.pop()
    player, row, col = last_move
    board = session['board']
    board[row][col] = ''

    # Si on annule un coup du SYSTEM, il faut aussi annuler le coup de l'OPERATOR avant si c'était un tour du SYSTEM
    if player == 'O' and len(moves) > 0:
        last_move_op = moves.pop()
        player_op, row_op, col_op = last_move_op
        board[row_op][col_op] = ''

    session['board'] = board
    session['moves'] = moves
    session['game_over'] = False
    session['winner'] = None

    return jsonify({'status': 'ok', 'board': board})

# API pour réinitialiser la partie actuelle
@app.route('/api/reset', methods=['POST'])
def reset_game():
    if 'board' not in session:
        return jsonify({'error': 'No game in session'}), 400

    grid_size = session['grid_size']
    board = [['' for _ in range(grid_size)] for _ in range(grid_size)]
    session['board'] = board
    session['turn'] = 'X'
    session['moves'] = []
    session['game_over'] = False
    session['winner'] = None

    return jsonify({'status': 'ok', 'board': board})

# API pour scanner (simuler une analyse)
@app.route('/api/scan', methods=['POST'])
def scan():
    # Simuler un scan qui retourne des informations sur le plateau
    if 'board' not in session:
        return jsonify({'error': 'No game in session'}), 400

    board = session['board']
    # Pour l'instant, on retourne simplement le plateau
    # On pourrait ajouter une logique de détection de patterns
    return jsonify({'status': 'scan', 'board': board})

# API pour obtenir les statistiques
@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Ici, on pourrait lire les statistiques depuis une base de données
    # Pour l'instant, on retourne des données statiques
    stats = {
        'global_progress': {
            'operator_dominance': 58,
            'system_resistance': 42,
            'total_games': 102
        },
        'grid_stats': {
            '3x3': {'wins': 31, 'losses': 5, 'draws': 2, 'percentage': 81},
            '4x4': {'wins': 23, 'losses': 15, 'draws': 4, 'percentage': 55},
            '5x5': {'wins': 6, 'losses': 14, 'draws': 2, 'percentage': 25}
        },
        'undetected_wins': 46,
        'successful_exploits': 19,
        'firewall_locks': 16
    }
    return jsonify(stats)

# API pour réinitialiser les statistiques
@app.route('/api/stats/reset', methods=['POST'])
def reset_stats():
    # Ici, on réinitialiserait les statistiques dans la base de données
    # Pour l'instant, on retourne simplement un succès
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)