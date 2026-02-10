/**
 * TACTIX // BLACKBOX - Game Engine (Frontend)
 * Main game logic and UI interactions
 */

// Game State
const GameState = {
    board: [],
    boardSize: 3,
    currentPlayer: 'X',
    gameMode: 'operator_vs_ai',
    aiDifficulty: 'easy',
    gameOver: false,
    winner: null,
    moveHistory: [],
    moveCount: 0,
    
    init(config) {
        this.boardSize = config.boardSize || 3;
        this.gameMode = config.gameMode || 'operator_vs_ai';
        this.aiDifficulty = config.aiDifficulty || 'easy';
        this.reset();
    },
    
    reset() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.moveCount = 0;
    },
    
    makeMove(row, col) {
        if (this.gameOver || this.board[row][col] !== null) {
            return { success: false, message: 'Invalid move' };
        }
        
        this.board[row][col] = this.currentPlayer;
        this.moveCount++;
        this.moveHistory.push({ row, col, player: this.currentPlayer });
        
        // Check win
        const winResult = this.checkWin();
        if (winResult.winner) {
            this.gameOver = true;
            this.winner = winResult.winner;
            return { success: true, gameOver: true, winner: winResult.winner, winLine: winResult.line };
        }
        
        // Check draw
        if (this.isBoardFull()) {
            this.gameOver = true;
            return { success: true, gameOver: true, draw: true };
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        return { success: true, gameOver: false };
    },
    
    checkWin() {
        const winLength = this.boardSize === 5 ? 4 : this.boardSize;
        const n = this.boardSize;
        
        // Check rows
        for (let row = 0; row < n; row++) {
            for (let col = 0; col <= n - winLength; col++) {
                let winner = this.board[row][col];
                if (!winner) continue;
                
                let match = true;
                for (let k = 1; k < winLength; k++) {
                    if (this.board[row][col + k] !== winner) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    return { 
                        winner, 
                        line: { type: 'horizontal', row, col, length: winLength }
                    };
                }
            }
        }
        
        // Check columns
        for (let col = 0; col < n; col++) {
            for (let row = 0; row <= n - winLength; row++) {
                let winner = this.board[row][col];
                if (!winner) continue;
                
                let match = true;
                for (let k = 1; k < winLength; k++) {
                    if (this.board[row + k][col] !== winner) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    return { 
                        winner, 
                        line: { type: 'vertical', row, col, length: winLength }
                    };
                }
            }
        }
        
        // Check diagonals (down-right)
        for (let row = 0; row <= n - winLength; row++) {
            for (let col = 0; col <= n - winLength; col++) {
                let winner = this.board[row][col];
                if (!winner) continue;
                
                let match = true;
                for (let k = 1; k < winLength; k++) {
                    if (this.board[row + k][col + k] !== winner) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    return { 
                        winner, 
                        line: { type: 'diagonal-down', row, col, length: winLength }
                    };
                }
            }
        }
        
        // Check diagonals (down-left)
        for (let row = 0; row <= n - winLength; row++) {
            for (let col = winLength - 1; col < n; col++) {
                let winner = this.board[row][col];
                if (!winner) continue;
                
                let match = true;
                for (let k = 1; k < winLength; k++) {
                    if (this.board[row + k][col - k] !== winner) {
                        match = false;
                        break;
                    }
                }
                
                if (match) {
                    return { 
                        winner, 
                        line: { type: 'diagonal-up', row, col, length: winLength }
                    };
                }
            }
        }
        
        return { winner: null };
    },
    
    isBoardFull() {
        return this.board.every(row => row.every(cell => cell !== null));
    },
    
    getEmptyCells() {
        const empty = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === null) {
                    empty.push({ row, col });
                }
            }
        }
        return empty;
    }
};

// ===== UI MANAGEMENT =====

const UI = {
    createBoard() {
        const board = document.getElementById('game-board');
        if (!board) return;
        
        board.innerHTML = '';
        board.className = `game-grid size-${GameState.boardSize}`;
        
        for (let row = 0; row < GameState.boardSize; row++) {
            for (let col = 0; col < GameState.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', () => handleCellClick(row, col));
                board.appendChild(cell);
            }
        }
        
        Terminal.log(`Game board created: ${GameState.boardSize}×${GameState.boardSize}`, 'success');
    },
    
    updateCell(row, col, player) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const symbol = document.createElement('span');
        symbol.className = `cell-symbol player-${player.toLowerCase()}`;
        symbol.textContent = player;
        cell.appendChild(symbol);
        
        // Add animation class
        symbol.style.animation = 'symbol-appear 0.3s ease-out';
    },
    
    updateStatus() {
        // Current player display
        const currentPlayerEl = document.getElementById('current-player-display');
        if (currentPlayerEl) {
            const playerLabel = GameState.currentPlayer === 'X' ? 'OPERATOR (X)' : 
                (GameState.gameMode === 'operator_vs_ai' ? 'AI (O)' : 'OPERATOR 2 (O)');
            currentPlayerEl.textContent = playerLabel;
        }
        
        // Moves count
        const movesCountEl = document.getElementById('moves-count');
        if (movesCountEl) {
            movesCountEl.textContent = GameState.moveCount;
        }
        
        // Turn counter
        const turnCounterEl = document.getElementById('turn-counter');
        if (turnCounterEl) {
            turnCounterEl.textContent = Math.ceil(GameState.moveCount / 2);
        }
        
        // Player status indicators
        const playerXStatus = document.getElementById('player-x-status');
        const playerOStatus = document.getElementById('player-o-status');
        
        if (playerXStatus && playerOStatus) {
            if (GameState.currentPlayer === 'X') {
                playerXStatus.classList.add('active');
                playerXStatus.classList.remove('waiting');
                playerOStatus.classList.add('waiting');
                playerOStatus.classList.remove('active');
            } else {
                playerOStatus.classList.add('active');
                playerOStatus.classList.remove('waiting');
                playerXStatus.classList.add('waiting');
                playerXStatus.classList.remove('active');
            }
        }
    },
    
    addToMoveHistory(row, col, player) {
        const historyEl = document.getElementById('move-history');
        if (!historyEl) return;
        
        // Remove "No moves yet" message if present
        if (GameState.moveCount === 1) {
            historyEl.innerHTML = '';
        }
        
        const moveEl = document.createElement('div');
        moveEl.className = `move-history-item player-${player.toLowerCase()}`;
        moveEl.innerHTML = `
            <span class="font-bold text-${player === 'X' ? 'neon-cyan' : 'breach-red'}">#${GameState.moveCount}</span>
            <span class="flex-1">${player} → [${row}, ${col}]</span>
            <span class="text-xs text-gray-600">${new Date().toLocaleTimeString()}</span>
        `;
        
        historyEl.insertBefore(moveEl, historyEl.firstChild);
        
        // Limit history display to 10 items
        while (historyEl.children.length > 10) {
            historyEl.removeChild(historyEl.lastChild);
        }
    },
    
    addTerminalMessage(message, type = 'info') {
        const terminalEl = document.getElementById('game-terminal');
        if (!terminalEl) return;
        
        const icons = {
            info: '>',
            success: '✓',
            warning: '⚠',
            error: '✖',
            breach: '>>'
        };
        
        const colors = {
            info: 'text-neon-cyan',
            success: 'text-neon-green',
            warning: 'text-yellow-400',
            error: 'text-breach-red',
            breach: 'text-breach-red'
        };
        
        const lineEl = document.createElement('div');
        lineEl.className = 'flex gap-3 font-mono text-sm';
        lineEl.innerHTML = `
            <span class="${colors[type]}">${icons[type]}</span>
            <span class="text-gray-300">${message}</span>
        `;
        
        terminalEl.appendChild(lineEl);
        
        // Auto-scroll to bottom
        terminalEl.scrollTop = terminalEl.scrollHeight;
        
        // Limit to 20 messages
        while (terminalEl.children.length > 20) {
            terminalEl.removeChild(terminalEl.firstChild);
        }
    }
};

// ===== GAME ACTIONS =====

async function handleCellClick(row, col) {
    // Prevent moves if game over or not player's turn
    if (GameState.gameOver) {
        Toast.warning('Game is over!');
        return;
    }
    
    if (GameState.gameMode === 'operator_vs_ai' && GameState.currentPlayer === 'O') {
        Toast.warning('Wait for AI move');
        return;
    }
    
    // Attempt move
    const result = GameState.makeMove(row, col);
    
    if (!result.success) {
        Toast.error(result.message || 'Invalid move');
        return;
    }
    
    // Update UI
    const player = GameState.currentPlayer === 'X' ? 'O' : 'X'; // Previous player
    UI.updateCell(row, col, player);
    UI.updateStatus();
    UI.addToMoveHistory(row, col, player);
    UI.addTerminalMessage(`${player} placed at [${row}, ${col}]`, 'info');
    
    // Check game over
    if (result.gameOver) {
        handleGameOver(result);
        return;
    }
    
    // AI move if applicable
    if (GameState.gameMode === 'operator_vs_ai' && GameState.currentPlayer === 'O') {
        setTimeout(() => makeAIMove(), 800);
    }
}

async function makeAIMove() {
    UI.addTerminalMessage('AI analyzing...', 'system');
    
    // Simple AI: random move for now
    const emptyCells = GameState.getEmptyCells();
    
    if (emptyCells.length === 0) return;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const { row, col } = randomCell;
    
    const result = GameState.makeMove(row, col);
    
    if (result.success) {
        UI.updateCell(row, col, 'O');
        UI.updateStatus();
        UI.addToMoveHistory(row, col, 'O');
        UI.addTerminalMessage(`AI placed at [${row}, ${col}]`, 'success');
        
        if (result.gameOver) {
            handleGameOver(result);
        }
    }
}

function handleGameOver(result) {
    GameState.gameOver = true;
    
    const stateEl = document.getElementById('game-state');
    if (stateEl) {
        if (result.draw) {
            stateEl.textContent = 'DRAW';
            stateEl.className = 'stat-value';
            stateEl.style.color = '#9ca3af';
        } else {
            stateEl.textContent = `${result.winner} WINS`;
            stateEl.className = `stat-value ${result.winner === 'X' ? 'cyan' : 'red'}`;
        }
    }
    
    if (result.draw) {
        UI.addTerminalMessage('GAME DRAW - No winner', 'warning');
        Toast.warning('Game ended in a draw');
        
        setTimeout(() => {
            showGameOverModal('DRAW', 'No winner - board full');
        }, 500);
    } else {
        UI.addTerminalMessage(`${result.winner} WINS THE BREACH!`, 'breach');
        Toast.success(`${result.winner} wins!`);
        
        // Show confetti for player win
        if (result.winner === 'X') {
            Confetti.create(100);
        }
        
        setTimeout(() => {
            showGameOverModal(result.winner, `${result.winner} completed the breach`);
        }, 1000);
    }
}

function showGameOverModal(winner, message) {
    const content = `
        <div class="text-center py-8">
            <div class="text-6xl font-display font-black mb-6">
                ${winner === 'DRAW' 
                    ? '<span class="text-gray-400">DRAW</span>' 
                    : `<span class="text-${winner === 'X' ? 'neon-cyan' : 'breach-red'}">${winner} WINS</span>`
                }
            </div>
            <p class="text-gray-300 mb-8 text-lg">${message}</p>
            <div class="flex gap-4 justify-center">
                <button onclick="startNewGame()" class="neon-button" style="border-color: #00f6ff; color: #00f6ff;">
                    NEW BREACH
                </button>
                <button onclick="Modal.closeAll(); window.location.href='/stats'" class="neon-button" style="border-color: #b833ff; color: #b833ff;">
                    VIEW STATS
                </button>
            </div>
        </div>
    `;
    
    Modal.show(content, {
        title: 'BREACH COMPLETE',
        closeButton: true
    });
}

function undoMove() {
    if (GameState.moveHistory.length === 0) {
        Toast.warning('No moves to undo');
        return;
    }
    
    // Undo last move (or two if against AI)
    const movesToUndo = GameState.gameMode === 'operator_vs_ai' ? 2 : 1;
    
    for (let i = 0; i < movesToUndo && GameState.moveHistory.length > 0; i++) {
        const lastMove = GameState.moveHistory.pop();
        GameState.board[lastMove.row][lastMove.col] = null;
        GameState.moveCount--;
        
        // Clear cell UI
        const cell = document.querySelector(`.grid-cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        if (cell) cell.innerHTML = '';
    }
    
    // Switch player back
    GameState.currentPlayer = GameState.currentPlayer === 'X' ? 'O' : 'X';
    GameState.gameOver = false;
    GameState.winner = null;
    
    UI.updateStatus();
    UI.addTerminalMessage('Move undone', 'warning');
    Toast.info('Move undone');
}

function runExploitScan() {
    UI.addTerminalMessage('Running exploit scan...', 'system');
    Toast.info('Scanning for threats...');
    
    // Simple threat detection: check if opponent has 2-in-a-row
    // This is a placeholder - real implementation would be more sophisticated
    
    setTimeout(() => {
        UI.addTerminalMessage('Scan complete - No critical threats', 'success');
        Toast.success('Scan complete');
    }, 1000);
}

function confirmNewGame() {
    if (GameState.moveCount === 0) {
        startNewGame();
        return;
    }
    
    const content = `
        <div class="text-center py-4">
            <p class="text-gray-300 mb-6">Current game will be lost. Continue?</p>
            <div class="flex gap-4 justify-center">
                <button onclick="startNewGame(); Modal.closeAll();" class="neon-button" style="border-color: #ff3366; color: #ff3366;">
                    CONFIRM
                </button>
                <button onclick="Modal.closeAll();" class="neon-button" style="border-color: #9ca3af; color: #9ca3af;">
                    CANCEL
                </button>
            </div>
        </div>
    `;
    
    Modal.show(content, { title: 'CONFIRM NEW BREACH' });
}

function startNewGame() {
    GameState.reset();
    UI.createBoard();
    UI.updateStatus();
    
    // Clear move history
    const historyEl = document.getElementById('move-history');
    if (historyEl) {
        historyEl.innerHTML = '<p class="text-sm text-gray-500 font-mono text-center py-4">No moves yet</p>';
    }
    
    // Clear terminal
    const terminalEl = document.getElementById('game-terminal');
    if (terminalEl) {
        terminalEl.innerHTML = '';
    }
    
    UI.addTerminalMessage('New breach initiated', 'breach');
    Toast.success('New game started');
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Get configuration from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const savedConfig = localStorage.getItem('gameConfig');
    
    const config = {
        boardSize: parseInt(urlParams.get('board_size')) || 
                   (savedConfig ? JSON.parse(savedConfig).board_size : 3),
        gameMode: urlParams.get('game_mode') || 
                 (savedConfig ? JSON.parse(savedConfig).game_mode : 'operator_vs_ai'),
        aiDifficulty: urlParams.get('ai_difficulty') || 
                     (savedConfig ? JSON.parse(savedConfig).ai_difficulty : 'easy')
    };
    
    // Initialize game
    GameState.init(config);
    
    // Create board
    UI.createBoard();
    
    // Update UI labels
    document.getElementById('grid-size-display').textContent = `${config.boardSize}×${config.boardSize}`;
    document.getElementById('game-mode-display').textContent = 
        config.gameMode === 'operator_vs_ai' ? 'VS AI' : 'VS PLAYER';
    
    if (config.gameMode === 'operator_vs_operator') {
        document.getElementById('player-o-label').textContent = 'OPERATOR 2 (O)';
    }
    
    // Initial status
    UI.updateStatus();
    UI.addTerminalMessage('Breach protocol active', 'breach');
    UI.addTerminalMessage(`Grid: ${config.boardSize}×${config.boardSize}`, 'info');
    UI.addTerminalMessage(`Mode: ${config.gameMode}`, 'info');
    
    console.log('%cGAME ENGINE LOADED', 'color: #00f6ff; font-weight: bold;');
    console.log('Config:', config);
});

// Export for global access
window.GameState = GameState;
window.handleCellClick = handleCellClick;
window.undoMove = undoMove;
window.runExploitScan = runExploitScan;
window.confirmNewGame = confirmNewGame;
window.startNewGame = startNewGame;