/**
 * TACTIX // BLACKBOX - Game Engine (Frontend) - FIXED for Race Condition
 * 
 * FIXES:
 * 1. AI now uses backend /api/ai-move instead of random moves
 * 2. Added isAIThinking state to prevent race conditions
 * 3. Added visual feedback during AI thinking
 * 4. Added timeout protection (5 seconds)
 * 5. Proper error handling for slow AI responses
 * 6. Terminal integration for AI states
 * 7. 🔧 NEW: Fixed race condition in AI move detection by storing old board state
 */

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
    
    async init(config) {
        this.boardSize = config.boardSize || 3;
        this.gameMode = config.gameMode || 'operator_vs_ai';
        this.aiDifficulty = config.aiDifficulty || 'easy';
        await this.fetchStateFromBackend();
    },
    
    async fetchStateFromBackend() {
        try {
            console.log('Fetching game state from /api/state...');
            const response = await fetch('/api/state', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const responseData = await response.json();
            const state = responseData.data.state;
            const config = responseData.data.config;
            
            this.boardSize = config.size;
            this.board = state.board.map(row => row.map(cell => cell === null ? '' : cell));
            this.currentPlayer = state.current_player;
            this.gameOver = state.winner !== null || state.is_draw;
            this.winner = state.winner;
            this.moveCount = state.move_count;
            
            Terminal.log('Game state loaded from backend', 'success');
        } catch (error) {
            console.error('Failed to fetch game state:', error);
            Terminal.log('Failed to load game state - using defaults', 'error');
            Toast.error('Failed to load game state');
            this.reset();
        }
    },
    
    reset() {
        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(''));
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.moveCount = 0;
    },
    
    async makeMove(row, col) {
        if (this.gameOver || (this.board[row][col] !== '' && this.board[row][col] !== null)) {
            return { success: false, message: 'Invalid move' };
        }
        try {
            const pos = row * this.boardSize + col;
            console.log(`Making move at [${row}, ${col}] (pos: ${pos})`);
            
            const response = await fetch('/api/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pos })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Move failed');
            }
            const responseData = await response.json();
            const state = responseData.data.state;
            this.board = state.board.map(row => row.map(cell => cell === null ? '' : cell));
            this.currentPlayer = state.current_player;
            this.gameOver = state.winner !== null || state.is_draw;
            this.winner = state.winner;
            this.moveCount = state.move_count;
            return { success: true, gameOver: this.gameOver, winner: this.winner, draw: state.is_draw };
        } catch (error) {
            console.error('Move error:', error);
            return { success: false, message: error.message || 'Move failed' };
        }
    },
    
    getEmptyCells() {
        const empty = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === '' || this.board[row][col] === null) {
                    empty.push({ row, col });
                }
            }
        }
        return empty;
    },
    
    async undo() {
        try {
            console.log('Calling undo API...');
            const response = await fetch('/api/undo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Undo failed');
            }
            
            const responseData = await response.json();
            const state = responseData.data.state;
            
            this.board = state.board.map(row => row.map(cell => cell === null ? '' : cell));
            this.currentPlayer = state.current_player;
            this.gameOver = state.winner !== null || state.is_draw;
            this.winner = state.winner;
            this.moveCount = state.move_count;
            
            Terminal.log('Move undone successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Undo error:', error);
            Terminal.log(`Undo failed: ${error.message}`, 'error');
            return { success: false, message: error.message || 'Undo failed' };
        }
    },
    
    async scan() {
        try {
            console.log('Calling scan API...');
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Scan failed');
            }
            
            const responseData = await response.json();
            const scanData = responseData.data.scan;
            
            Terminal.log('Exploit scan complete', 'success');
            return { success: true, scan: scanData };
        } catch (error) {
            console.error('Scan error:', error);
            Terminal.log(`Scan failed: ${error.message}`, 'error');
            return { success: false, message: error.message || 'Scan failed' };
        }
    },
    
    async resetGame() {
        try {
            console.log('Calling reset API...');
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Reset failed');
            }
            
            const responseData = await response.json();
            const state = responseData.data.state;
            
            this.board = state.board.map(row => row.map(cell => cell === null ? '' : cell));
            this.currentPlayer = state.current_player;
            this.gameOver = state.winner !== null || state.is_draw;
            this.winner = state.winner;
            this.moveCount = state.move_count;
            
            Terminal.log('Game reset successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Reset error:', error);
            Terminal.log(`Reset failed: ${error.message}`, 'error');
            return { success: false, message: error.message || 'Reset failed' };
        }
    }
};

// ========================================
// 🔧 FIX: AI Thinking State Management
// ========================================
let isAIThinking = false;

function showAIThinking() {
    isAIThinking = true;
    
    // Disable all grid cells
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.style.pointerEvents = 'none';
        cell.style.opacity = '0.6';
    });
    
    // Disable action buttons
    const buttons = ['btn-scan', 'btn-undo', 'btn-reset'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
        }
    });
    
    // Update status message
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerHTML = '<span class="text-orange-400 animate-pulse">●</span> SYSTEM CALCULATING...';
    }
    
    // Update terminal messages
    if (typeof terminal !== 'undefined') {
        terminal.onAIThinking();
    }
    
    // Update system status panels
    const opPanel = document.getElementById('status-operator');
    const sysPanel = document.getElementById('status-system');
    if (opPanel) {
        opPanel.className = 'status-indicator waiting';
        const statusText = opPanel.querySelector('.text-sm');
        if (statusText) statusText.innerHTML = '○ WAITING';
    }
    if (sysPanel) {
        sysPanel.className = 'status-indicator active';
        const statusText = sysPanel.querySelector('.text-sm');
        if (statusText) statusText.innerHTML = '● PROCESSING';
    }
}

function hideAIThinking() {
    isAIThinking = false;
    
    // Re-enable empty cells
    document.querySelectorAll('.grid-cell:not(.occupied)').forEach(cell => {
        cell.style.pointerEvents = 'auto';
        cell.style.opacity = '1';
    });
    
    // Re-enable action buttons
    const buttons = ['btn-scan', 'btn-undo'];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });
    
    // Re-enable reset button separately
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.disabled = false;
        btnReset.style.opacity = '1';
    }
    
    // Update status message
    const statusEl = document.getElementById('game-status');
    if (statusEl) {
        statusEl.innerHTML = '<span class="text-cyan-400">●</span> YOUR TURN';
    }
    
    // Update system status panels
    const opPanel = document.getElementById('status-operator');
    const sysPanel = document.getElementById('status-system');
    if (opPanel) {
        opPanel.className = 'status-indicator active';
        const statusText = opPanel.querySelector('.text-sm');
        if (statusText) statusText.innerHTML = '● ACTIVE';
    }
    if (sysPanel) {
        sysPanel.className = 'status-indicator waiting';
        const statusText = sysPanel.querySelector('.text-sm');
        if (statusText) statusText.innerHTML = '○ WAITING';
    }
}

// ===== UI MANAGEMENT =====

const UI = {
    createBoard() {
        const board = document.getElementById('game-board');
        if (!board) { console.error('ERROR: #game-board element not found!'); return; }
        
        board.innerHTML = '';
        board.className = `game-grid size-${GameState.boardSize}`;
        
        Object.assign(board.style, {
            display: 'grid',
            gridTemplateColumns: `repeat(${GameState.boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${GameState.boardSize}, 1fr)`,
            gap: '4px',
            background: 'rgba(0, 246, 255, 0.5)',
            border: '3px solid #00f6ff',
            borderRadius: '8px',
            padding: '4px',
            width: 'min(100%, 480px)',
            height: 'min(100vw, 480px)',
            maxWidth: '480px',
            margin: '0 auto',
            boxSizing: 'border-box'
        });
        
        for (let row = 0; row < GameState.boardSize; row++) {
            for (let col = 0; col < GameState.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                Object.assign(cell.style, {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0a0a0f',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    transition: 'background 0.2s ease'
                });
                
                cell.addEventListener('mouseenter', () => {
                    if (!cell.classList.contains('occupied') && !isAIThinking) {
                        cell.style.background = 'rgba(0, 246, 255, 0.12)';
                    }
                });
                cell.addEventListener('mouseleave', () => {
                    if (!cell.classList.contains('occupied')) {
                        cell.style.background = '#0a0a0f';
                    }
                });
                
                cell.addEventListener('click', () => handleCellClick(row, col));
                board.appendChild(cell);
            }
        }
        
        console.log(`Game board created: ${GameState.boardSize}x${GameState.boardSize}`);
        Terminal.log(`Game board created: ${GameState.boardSize}x${GameState.boardSize}`, 'success');
    },
    
    renderBoard() {
        this.clearScanResults();
        
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('occupied');
            cell.style.cursor = 'pointer';
        });
        for (let row = 0; row < GameState.boardSize; row++) {
            for (let col = 0; col < GameState.boardSize; col++) {
                const value = GameState.board[row][col];
                if (value && value !== '' && value !== null) {
                    this.updateCell(row, col, value);
                }
            }
        }
        this.updateUndoButton();
        this.updateScanButton();
    },
    
    updateCell(row, col, player) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        cell.innerHTML = '';
        const symbol = document.createElement('span');
        symbol.className = `cell-symbol player-${player.toLowerCase()}`;
        symbol.textContent = player;
        
        symbol.style.fontFamily = 'Orbitron, monospace';
        symbol.style.fontSize = 'clamp(2rem, 5vw, 4rem)';
        symbol.style.fontWeight = '900';
        symbol.style.lineHeight = '1';
        symbol.style.color = player === 'X' ? '#00f6ff' : '#ff3366';
        symbol.style.textShadow = player === 'X'
            ? '0 0 20px #00f6ff, 0 0 40px rgba(0,246,255,0.5)'
            : '0 0 20px #ff3366, 0 0 40px rgba(255,51,102,0.5)';
        
        cell.appendChild(symbol);
        cell.classList.add('occupied');
        cell.style.cursor = 'not-allowed';
    },
    
    updateStatus() {
        const movesCountEl = document.getElementById('info-moves');
        if (movesCountEl) movesCountEl.textContent = GameState.moveCount;
        
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            if (GameState.gameOver) {
                if (GameState.winner) {
                    statusEl.innerHTML = `<span style="color:${GameState.winner === 'X' ? '#00f6ff' : '#ff3366'}">●</span> ${GameState.winner} WINS!`;
                } else {
                    statusEl.innerHTML = `<span style="color:#b833ff">●</span> DRAW - STALEMATE`;
                }
            } else {
                statusEl.innerHTML = `<span style="color:${GameState.currentPlayer === 'X' ? '#00f6ff' : '#ff3366'}">●</span> ${GameState.currentPlayer} TO MOVE`;
            }
        }
        
        const opPanel = document.getElementById('status-operator');
        const sysPanel = document.getElementById('status-system');
        if (opPanel && sysPanel) {
            if (GameState.currentPlayer === 'X') {
                opPanel.className = 'status-indicator active';
                opPanel.querySelector('.text-sm').innerHTML = '● ACTIVE';
                sysPanel.className = 'status-indicator waiting';
                sysPanel.querySelector('.text-sm').innerHTML = '○ WAITING';
            } else {
                opPanel.className = 'status-indicator waiting';
                opPanel.querySelector('.text-sm').innerHTML = '○ WAITING';
                sysPanel.className = 'status-indicator active';
                sysPanel.querySelector('.text-sm').innerHTML = '● ACTIVE';
            }
        }
        
        this.updateUndoButton();
        this.updateScanButton();
    },
    
    updateUndoButton() {
        const btnUndo = document.getElementById('btn-undo');
        if (btnUndo) {
            if (GameState.moveCount > 0 && !GameState.gameOver && !isAIThinking) {
                btnUndo.disabled = false;
                btnUndo.style.opacity = '1';
                btnUndo.style.cursor = 'pointer';
            } else {
                btnUndo.disabled = true;
                btnUndo.style.opacity = '0.5';
                btnUndo.style.cursor = 'not-allowed';
            }
        }
    },
    
    addToMoveHistory(row, col, player) {
        const historyEl = document.getElementById('move-history');
        if (!historyEl) return;
        if (GameState.moveCount === 1) historyEl.innerHTML = '';
        const moveEl = document.createElement('div');
        moveEl.className = 'move-item';
        moveEl.innerHTML = `
            <span style="color:#6b7280">Move ${GameState.moveCount}:</span>
            <span style="color:${player === 'X' ? '#00f6ff' : '#ff3366'}">${player}</span>
            → (${row}, ${col})
        `;
        historyEl.insertBefore(moveEl, historyEl.firstChild);
        while (historyEl.children.length > 10) historyEl.removeChild(historyEl.lastChild);
    },
    
    removeFromMoveHistory() {
        const historyEl = document.getElementById('move-history');
        if (!historyEl) return;
        
        if (historyEl.firstChild && !historyEl.firstChild.textContent.includes('No moves yet')) {
            historyEl.removeChild(historyEl.firstChild);
        }
        
        if (historyEl.children.length === 0 || GameState.moveCount === 0) {
            historyEl.innerHTML = '<div class="text-center text-gray-500 text-sm">No moves yet</div>';
        }
    },
    
    clearMoveHistory() {
        const historyEl = document.getElementById('move-history');
        if (!historyEl) return;
        historyEl.innerHTML = '<div class="text-center text-gray-500 text-sm">No moves yet</div>';
    },
    
    showScanResults(scanData) {
        this.clearScanResults();
        
        const { bestMovesRC, dangerMovesRC, forksRC, centerMovesRC } = scanData;
        
        console.log('Scan data:', scanData);
        
        if (bestMovesRC && bestMovesRC.length > 0) {
            console.log('Showing best moves:', bestMovesRC);
            bestMovesRC.forEach(([row, col]) => {
                this.addScanHint(row, col, 'best', 'BEST MOVE');
            });
        }
        
        if (dangerMovesRC && dangerMovesRC.length > 0) {
            console.log('Showing danger moves:', dangerMovesRC);
            dangerMovesRC.forEach(([row, col]) => {
                this.addScanHint(row, col, 'danger', 'DANGER');
            });
        }
        
        if (forksRC && forksRC.length > 0) {
            console.log('Showing forks:', forksRC);
            forksRC.forEach(([row, col]) => {
                this.addScanHint(row, col, 'fork', 'FORK');
            });
        }
        
        if (centerMovesRC && centerMovesRC.length > 0 && 
            (!bestMovesRC || bestMovesRC.length === 0) &&
            (!dangerMovesRC || dangerMovesRC.length === 0) &&
            (!forksRC || forksRC.length === 0)) {
            console.log('Showing center moves:', centerMovesRC.slice(0, 3));
            centerMovesRC.slice(0, 3).forEach(([row, col]) => {
                this.addScanHint(row, col, 'center', 'CENTER');
            });
        }
        
        Terminal.log(`Scan revealed: ${bestMovesRC?.length || 0} best, ${dangerMovesRC?.length || 0} danger, ${forksRC?.length || 0} forks`, 'info');
    },
    
    addScanHint(row, col, type, label) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (!cell) {
            console.warn(`Cell not found at [${row}, ${col}]`);
            return;
        }
        if (cell.classList.contains('occupied')) {
            console.warn(`Cell at [${row}, ${col}] is occupied, skipping hint`);
            return;
        }
        
        console.log(`Adding ${type} hint to cell [${row}, ${col}]`);
        
        const hint = document.createElement('div');
        hint.className = `scan-hint ${type}`;
        hint.dataset.scanHint = 'true';
        
        const labelEl = document.createElement('div');
        labelEl.className = `scan-label ${type}`;
        labelEl.textContent = label;
        hint.appendChild(labelEl);
        
        cell.style.position = 'relative';
        cell.appendChild(hint);
    },
    
    clearScanResults() {
        const hints = document.querySelectorAll('[data-scan-hint]');
        console.log(`Clearing ${hints.length} scan hints`);
        hints.forEach(hint => hint.remove());
    },
    
    updateScanButton() {
        const scanBtn = document.getElementById('btn-scan');
        if (!scanBtn) return;
        
        const canScan = !GameState.gameOver && 
                       GameState.moveCount > 0 && 
                       !isAIThinking &&
                       (GameState.gameMode !== 'operator_vs_ai' || GameState.currentPlayer === 'X');
        
        if (canScan) {
            scanBtn.disabled = false;
            scanBtn.style.opacity = '1';
            scanBtn.style.pointerEvents = 'auto';
        } else {
            scanBtn.disabled = true;
            scanBtn.style.opacity = '0.3';
            scanBtn.style.pointerEvents = 'none';
        }
    }
};

// ===== GAME ACTIONS =====

async function handleCellClick(row, col) {
    // 🔧 FIX: Prevent clicks while AI is thinking
    if (isAIThinking) {
        console.log('AI is thinking, ignoring click');
        Toast.warning('Wait for AI to finish');
        return;
    }
    
    if (GameState.gameOver) { 
        Toast.warning('Game is over!'); 
        return; 
    }
    
    if (GameState.gameMode === 'operator_vs_ai' && GameState.currentPlayer === 'O') {
        Toast.warning('Wait for AI move'); 
        return;
    }
    
    const result = await GameState.makeMove(row, col);
    if (!result.success) { 
        Toast.error(result.message || 'Invalid move'); 
        return; 
    }
    
    UI.renderBoard();
    UI.updateStatus();
    const player = GameState.currentPlayer === 'X' ? 'O' : 'X';
    UI.addToMoveHistory(row, col, player);
    Terminal.log(`${player} placed at [${row}, ${col}]`, 'info');
    
    // Add terminal message for player move
    if (typeof terminal !== 'undefined') {
        terminal.onPlayerMove([row, col]);
    }
    
    if (result.gameOver) { 
        handleGameOver(result); 
        return; 
    }
    
    if (GameState.gameMode === 'operator_vs_ai' && GameState.currentPlayer === 'O') {
        // Small delay before AI thinks
        setTimeout(() => makeAIMove(), 500);
    }
}

// ========================================
// 🔧 FIX: Proper AI Move with Race Condition Fix
// ========================================
async function makeAIMove() {
    // Prevent multiple simultaneous AI moves
    if (isAIThinking) {
        console.log('AI already thinking, skipping');
        return;
    }
    
    showAIThinking();
    
    // Small delay to let UI update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        console.log('Requesting AI move from backend...');
        Terminal.log('AI analyzing position...', 'info');
        
        // 🔧 CRITICAL FIX: Store old board BEFORE making the API call
        const oldBoard = GameState.board.map(row => [...row]);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/api/ai-move', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `AI request failed: ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log('AI response:', responseData);
        
        if (!responseData.data || !responseData.data.state) {
            throw new Error('Invalid AI response format');
        }
        
        const state = responseData.data.state;
        const aiMeta = responseData.data.ai_meta || {};
        
        // Update game state from backend response
        GameState.board = state.board.map(row => row.map(cell => cell === null ? '' : cell));
        GameState.currentPlayer = state.current_player;
        GameState.gameOver = state.winner !== null || state.is_draw;
        GameState.winner = state.winner;
        GameState.moveCount = state.move_count;
        
        // 🔧 CRITICAL FIX: Find AI move by comparing OLD board vs NEW board
        let aiRow = -1, aiCol = -1;
        for (let r = 0; r < GameState.boardSize; r++) {
            for (let c = 0; c < GameState.boardSize; c++) {
                // Compare new state with OLD board (before API call)
                if (state.board[r][c] === 'O' && 
                    (oldBoard[r][c] === '' || oldBoard[r][c] === null)) {
                    aiRow = r;
                    aiCol = c;
                    break;
                }
            }
            if (aiRow !== -1) break;
        }
        
        // Update UI
        UI.renderBoard();
        UI.updateStatus();
        
        if (aiRow !== -1 && aiCol !== -1) {
            UI.addToMoveHistory(aiRow, aiCol, 'O');
            Terminal.log(`AI placed at [${aiRow}, ${aiCol}] (score: ${aiMeta.score || 'N/A'})`, 'success');
            
            // Add terminal message for AI move
            if (typeof terminal !== 'undefined') {
                terminal.onAIMove([aiRow, aiCol]);
            }
        } else {
            // Fallback: couldn't detect AI move location
            console.warn('Could not detect AI move location');
            Terminal.log('AI move completed (location unknown)', 'success');
        }
        
        // Check if game is over
        if (GameState.gameOver) {
            handleGameOver({
                gameOver: true,
                winner: GameState.winner,
                draw: state.is_draw
            });
        }
        
    } catch (error) {
        console.error('AI Error:', error);
        
        if (error.name === 'AbortError') {
            Terminal.log('AI timeout - taking too long', 'error');
            Toast.error('AI timed out. Please try resetting the game.');
        } else {
            Terminal.log(`AI error: ${error.message}`, 'error');
            Toast.error('AI encountered an error. Please try again.');
        }
        
        // Show error in status
        const statusEl = document.getElementById('game-status');
        if (statusEl) {
            statusEl.innerHTML = '<span class="text-red-400">●</span> AI ERROR - Try Reset';
        }
        
    } finally {
        // Always hide thinking state
        hideAIThinking();
    }
}

function handleGameOver(result) {
    GameState.gameOver = true;
    if (result.draw) {
        Terminal.log('GAME DRAW - No winner', 'warning');
        Toast.warning('Game ended in a draw');
        
        if (typeof terminal !== 'undefined') {
            terminal.onDraw();
        }
        
        setTimeout(() => showGameOverModal('DRAW', 'No winner - board full'), 500);
    } else {
        Terminal.log(`${result.winner} WINS THE BREACH!`, 'breach');
        Toast.success(`${result.winner} wins!`);
        
        if (typeof terminal !== 'undefined') {
            if (result.winner === 'X') {
                terminal.onPlayerWin();
            } else {
                terminal.onAIWin();
            }
        }
        
        if (result.winner === 'X') Confetti.create(100);
        setTimeout(() => showGameOverModal(result.winner, `${result.winner} completed the breach`), 1000);
    }
}

function showGameOverModal(winner, message) {
    const color = winner === 'X' ? '#00f6ff' : (winner === 'DRAW' ? '#b833ff' : '#ff3366');
    const content = `
        <div class="text-center py-8">
            <div style="font-size:3.5rem;font-family:Orbitron,sans-serif;font-weight:900;color:${color};text-shadow:0 0 30px ${color};margin-bottom:1.5rem">
                ${winner === 'DRAW' ? 'DRAW' : `${winner} WINS`}
            </div>
            <p style="color:#d1d5db;margin-bottom:2rem;font-size:1.1rem">${message}</p>
            <div style="display:flex;gap:1rem;justify-content:center">
                <button onclick="startNewGame()" class="neon-button" style="border-color:#00f6ff;color:#00f6ff">NEW BREACH</button>
                <button onclick="Modal.closeAll();window.location.href='/stats'" class="neon-button" style="border-color:#b833ff;color:#b833ff">VIEW STATS</button>
            </div>
        </div>`;
    Modal.show(content, { title: 'BREACH COMPLETE', closeButton: true });
}

async function undoMove() {
    // 🔧 FIX: Prevent undo during AI thinking
    if (isAIThinking) {
        Toast.warning('Cannot undo while AI is thinking');
        return;
    }
    
    if (GameState.moveCount === 0) {
        Toast.warning('No moves to undo');
        return;
    }
    
    if (GameState.gameOver) {
        Toast.warning('Cannot undo - game is over');
        return;
    }
    
    Terminal.log('Undoing last move...', 'info');
    
    const isVsAI = GameState.gameMode === 'operator_vs_ai';
    const needsDoubleUndo = isVsAI && GameState.moveCount > 1 && GameState.currentPlayer === 'X';
    
    const result1 = await GameState.undo();
    if (!result1.success) {
        Toast.error(result1.message || 'Undo failed');
        return;
    }
    
    if (needsDoubleUndo) {
        const result2 = await GameState.undo();
        if (!result2.success) {
            Toast.error('Failed to undo AI move');
            return;
        }
    }
    
    UI.renderBoard();
    UI.updateStatus();
    UI.removeFromMoveHistory();
    if (needsDoubleUndo) {
        UI.removeFromMoveHistory();
    }
    
    // Add terminal message
    if (typeof terminal !== 'undefined') {
        terminal.onUndo();
    }
    
    Toast.success('Move undone');
}

async function runExploitScan() {
    // 🔧 FIX: Prevent scan during AI thinking
    if (isAIThinking) {
        Toast.warning('Cannot scan while AI is thinking');
        return;
    }
    
    if (GameState.gameOver) {
        Toast.warning('Cannot scan - game is over');
        return;
    }
    
    if (GameState.moveCount === 0) {
        Toast.info('Make a move first to analyze the board');
        return;
    }
    
    const existingHints = document.querySelectorAll('[data-scan-hint]');
    if (existingHints.length > 0) {
        UI.clearScanResults();
        Toast.info('Scan cleared');
        Terminal.log('Scan overlay cleared', 'info');
        return;
    }
    
    Terminal.log('Initiating exploit scan...', 'info');
    Toast.info('Analyzing board positions...');
    
    // Add terminal message
    if (typeof terminal !== 'undefined') {
        terminal.onScan();
    }
    
    const scanBtn = document.getElementById('btn-scan');
    if (scanBtn) {
        scanBtn.disabled = true;
        scanBtn.style.opacity = '0.5';
    }
    
    try {
        const result = await GameState.scan();
        
        if (!result.success) {
            Toast.error(result.message || 'Scan failed');
            return;
        }
        
        UI.showScanResults(result.scan);
        
        const { bestMovesRC, dangerMovesRC, forksRC } = result.scan;
        let summary = 'Scan complete: ';
        const parts = [];
        
        if (bestMovesRC && bestMovesRC.length > 0) {
            parts.push(`${bestMovesRC.length} optimal move${bestMovesRC.length > 1 ? 's' : ''}`);
        }
        if (dangerMovesRC && dangerMovesRC.length > 0) {
            parts.push(`${dangerMovesRC.length} threat${dangerMovesRC.length > 1 ? 's' : ''}`);
        }
        if (forksRC && forksRC.length > 0) {
            parts.push(`${forksRC.length} fork${forksRC.length > 1 ? 's' : ''}`);
        }
        
        if (parts.length === 0) {
            summary += 'Strategic positions highlighted';
        } else {
            summary += parts.join(', ');
        }
        
        Toast.success(summary);
        Terminal.log(summary, 'success');
        
    } catch (error) {
        console.error('Scan error:', error);
        Toast.error('Scan failed');
    } finally {
        if (scanBtn) {
            scanBtn.disabled = false;
            scanBtn.style.opacity = '1';
        }
    }
}

async function resetGame() {
    // 🔧 FIX: Reset is allowed even during AI thinking
    if (isAIThinking) {
        isAIThinking = false; // Force stop AI thinking
        hideAIThinking();
    }
    
    if (!confirm('Reset the grid? All progress will be lost.')) {
        return;
    }
    
    Terminal.log('Resetting game...', 'info');
    Toast.info('Resetting board...');
    
    // Add terminal message
    if (typeof terminal !== 'undefined') {
        terminal.onReset();
    }
    
    const result = await GameState.resetGame();
    
    if (!result.success) {
        Toast.error(result.message || 'Reset failed');
        return;
    }
    
    UI.renderBoard();
    UI.updateStatus();
    UI.clearMoveHistory();
    
    Toast.success('Board reset successfully');
    Terminal.log('Game reset - ready for new breach', 'success');
}

async function startNewGame() { 
    window.location.href = '/configure'; 
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', async () => {
    Terminal.log('DOM LOADED - Initializing game...', 'system');
    
    const boardSize = parseInt(localStorage.getItem('boardSize') || '3');
    const gameMode = localStorage.getItem('gameMode') || 'operator_vs_ai';
    const aiDifficulty = localStorage.getItem('aiDifficulty') || 'easy';
    
    try {
        Terminal.log('Loading existing game session...', 'info');
        await GameState.init({ boardSize, gameMode, aiDifficulty });
        Terminal.log('Game session loaded successfully', 'success');
    } catch (error) {
        Terminal.log('No active game session found', 'error');
        Toast.error('No game session found. Redirecting...');
        setTimeout(() => { window.location.href = '/configure'; }, 2000);
        return;
    }
    
    UI.createBoard();
    UI.renderBoard();
    
    const gridSizeDisplay = document.getElementById('info-grid-size');
    if (gridSizeDisplay) gridSizeDisplay.textContent = `${GameState.boardSize}x${GameState.boardSize}`;
    const gameModeDisplay = document.getElementById('info-mode');
    if (gameModeDisplay) gameModeDisplay.textContent = gameMode === 'operator_vs_ai' ? 'vs AI' : 'vs OPERATOR';
    const difficultyDisplay = document.getElementById('info-difficulty');
    if (difficultyDisplay) difficultyDisplay.textContent = aiDifficulty.toUpperCase();
    
    UI.updateStatus();
    
    const btnScan = document.getElementById('btn-scan');
    if (btnScan) {
        btnScan.addEventListener('click', runExploitScan);
        console.log('Scan button event listener attached');
    }
    
    const btnUndo = document.getElementById('btn-undo');
    if (btnUndo) {
        btnUndo.addEventListener('click', undoMove);
    }
    
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', resetGame);
    }
    
    Terminal.log('GAME ENGINE READY', 'success');
    console.log('%cGAME ENGINE LOADED', 'color: #00ff9f; font-weight: bold;');
});

window.GameState = GameState;
window.handleCellClick = handleCellClick;
window.undoMove = undoMove;
window.runExploitScan = runExploitScan;
window.resetGame = resetGame;
window.startNewGame = startNewGame;