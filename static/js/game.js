document.addEventListener('DOMContentLoaded', function() {
    const gameBoard = document.getElementById('game-board');
    const exploitScanButton = document.getElementById('exploit-scan');
    const firewallLockButton = document.getElementById('firewall-lock');
    const resetGameButton = document.getElementById('reset-game');
    const undoMoveButton = document.getElementById('undo-move');

    let boardSize = 3;
    let board = [];

    // Charger l'état initial du plateau depuis la session
    fetch('/api/stats')  // Note: ce n'est pas la bonne route, mais pour l'exemple
    .then(response => response.json())
    .then(data => {
        // Ici, nous devrions récupérer l'état du jeu depuis une API dédiée
        // Pour l'instant, on initialise avec un plateau vide
        initBoard(3);
    })
    .catch(error => {
        console.error('Error loading game state:', error);
        initBoard(3);
    });

    function initBoard(size) {
        boardSize = size;
        board = Array(size).fill().map(() => Array(size).fill(''));
        renderBoard();
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        gameBoard.className = `game-board cell-${boardSize}`;

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if (board[i][j] === 'X') {
                    cell.classList.add('x');
                    cell.textContent = 'X';
                } else if (board[i][j] === 'O') {
                    cell.classList.add('o');
                    cell.textContent = 'O';
                }
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', handleCellClick);
                gameBoard.appendChild(cell);
            }
        }
    }

    function handleCellClick(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);

        if (board[row][col] !== '') {
            showToast('Cell already taken', 'error');
            return;
        }

        fetch('/api/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ row, col })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, 'error');
                return;
            }

            board = data.board;
            renderBoard();

            if (data.status === 'win') {
                showToast('OPERATOR wins!', 'info');
            } else if (data.status === 'loss') {
                showToast('SYSTEM wins!', 'error');
            } else if (data.status === 'draw') {
                showToast('Draw!', 'info');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Network error', 'error');
        });
    }

    exploitScanButton.addEventListener('click', function() {
        fetch('/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            showToast('Scan completed', 'info');
            // Ici, on pourrait afficher des informations supplémentaires
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Scan failed', 'error');
        });
    });

    firewallLockButton.addEventListener('click', function() {
        showToast('Firewall locked', 'info');
        // Logique supplémentaire pour le verrouillage du firewall
    });

    resetGameButton.addEventListener('click', function() {
        fetch('/api/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            board = data.board;
            renderBoard();
            showToast('Game reset', 'info');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Reset failed', 'error');
        });
    });

    undoMoveButton.addEventListener('click', function() {
        fetch('/api/undo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, 'error');
                return;
            }
            board = data.board;
            renderBoard();
            showToast('Move undone', 'info');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Undo failed', 'error');
        });
    });
});