/**
 * TACTIX // BLACKBOX - Configuration Page
 * Handles game setup and configuration
 */

// Configuration State
const ConfigState = {
    boardSize: 3,
    gameMode: 'operator_vs_ai',
    aiDifficulty: 'easy',
    
    getWinLength() {
        const WIN_LENGTHS = { 3: 3, 4: 4, 5: 4 };
        return WIN_LENGTHS[this.boardSize];
    }
};

// ===== GRID SIZE SELECTION =====

function selectGridSize(size) {
    ConfigState.boardSize = size;
    
    // Update UI
    document.querySelectorAll('.selection-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`.selection-card[data-size="${size}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Update hidden input
    document.getElementById('boardSize').value = size;
    
    // Update summary
    updateSummary();
    
    // Log to terminal
    Terminal.log(`Grid size selected: ${size}×${size}`, 'info');
    
    // Toast notification
    Toast.info(`Grid changed to ${size}×${size}`);
}

// ===== GAME MODE SELECTION =====

function handleGameModeChange() {
    const gameModeRadios = document.querySelectorAll('input[name="game_mode"]');
    const aiDifficultySection = document.getElementById('aiDifficultySection');
    
    gameModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            ConfigState.gameMode = e.target.value;
            
            // Show/hide AI difficulty section
            if (ConfigState.gameMode === 'operator_vs_ai') {
                aiDifficultySection.style.display = 'block';
            } else {
                aiDifficultySection.style.display = 'none';
            }
            
            updateSummary();
            Terminal.log(`Game mode: ${ConfigState.gameMode}`, 'info');
        });
    });
}

// ===== AI DIFFICULTY SELECTION =====

function handleAIDifficultyChange() {
    const difficultyRadios = document.querySelectorAll('input[name="ai_difficulty"]');
    
    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            ConfigState.aiDifficulty = e.target.value;
            updateSummary();
            
            const difficultyLabels = {
                'easy': 'Training Mode',
                'medium': 'Tactical Challenge',
                'relentless': 'Neural Supremacy'
            };
            
            Terminal.log(`AI difficulty: ${difficultyLabels[ConfigState.aiDifficulty]}`, 'info');
        });
    });
}

// ===== SUMMARY UPDATE =====

function updateSummary() {
    // Grid Size
    const gridSizeEl = document.getElementById('summaryGridSize');
    if (gridSizeEl) {
        gridSizeEl.textContent = `${ConfigState.boardSize}×${ConfigState.boardSize}`;
    }
    
    // Game Mode
    const gameModeEl = document.getElementById('summaryGameMode');
    if (gameModeEl) {
        const modeLabels = {
            'operator_vs_ai': 'Operator vs System',
            'operator_vs_operator': 'Operator vs Operator'
        };
        gameModeEl.textContent = modeLabels[ConfigState.gameMode];
    }
    
    // AI Difficulty
    const difficultyContainer = document.getElementById('summaryDifficultyContainer');
    const difficultyEl = document.getElementById('summaryDifficulty');
    
    if (ConfigState.gameMode === 'operator_vs_ai') {
        if (difficultyContainer) difficultyContainer.style.display = 'flex';
        if (difficultyEl) {
            const difficultyLabels = {
                'easy': 'Easy',
                'medium': 'Medium',
                'relentless': 'Relentless'
            };
            difficultyEl.textContent = difficultyLabels[ConfigState.aiDifficulty];
            
            // Color based on difficulty
            difficultyEl.className = 'stat-value';
            if (ConfigState.aiDifficulty === 'easy') {
                difficultyEl.classList.add('green');
            } else if (ConfigState.aiDifficulty === 'medium') {
                difficultyEl.style.color = '#fbbf24';
            } else {
                difficultyEl.classList.add('red');
            }
        }
    } else {
        if (difficultyContainer) difficultyContainer.style.display = 'none';
    }
    
    // Win Condition
    const winConditionEl = document.getElementById('summaryWinCondition');
    if (winConditionEl) {
        const winLength = ConfigState.getWinLength();
        winConditionEl.textContent = `${winLength} in a row`;
    }
}

// ===== FORM SUBMISSION =====

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate configuration
    if (!ConfigState.boardSize || !ConfigState.gameMode) {
        Toast.error('Please complete the configuration');
        return;
    }
    
    // Log
    Terminal.log('Configuration saved', 'success');
    Terminal.log('Initiating breach...', 'breach');
    
    // Show loading
    Loading.show('#configForm', 'INITIALIZING BREACH...');
    
    try {
        // Map frontend mode names to backend API names
        const modeMap = {
            'operator_vs_ai': 'HUMAN_VS_AI',
            'operator_vs_operator': 'HUMAN_VS_HUMAN'
        };
        
        const difficultyMap = {
            'easy': 'EASY',
            'medium': 'MEDIUM',
            'relentless': 'RELENTLESS'
        };
        
        console.log('Sending configuration:', {
            boardSize: ConfigState.boardSize,
            mode: modeMap[ConfigState.gameMode],
            difficulty: difficultyMap[ConfigState.aiDifficulty]
        });
        
        // Call the backend API to create the game
        const response = await fetch('/api/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                boardSize: ConfigState.boardSize,
                mode: modeMap[ConfigState.gameMode] || 'HUMAN_VS_AI',
                difficulty: ConfigState.gameMode === 'operator_vs_ai' 
                    ? (difficultyMap[ConfigState.aiDifficulty] || 'EASY')
                    : 'MEDIUM'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('API Response:', result);
        
        if (result.success) {
            Terminal.log('Game session created successfully', 'success');
            
            // Save to localStorage for game.js to read
            localStorage.setItem('boardSize', ConfigState.boardSize);
            localStorage.setItem('gameMode', ConfigState.gameMode);
            localStorage.setItem('aiDifficulty', ConfigState.aiDifficulty);
            
            // Redirect to game page
            setTimeout(() => {
                window.location.href = '/game';
            }, 800);
        } else {
            throw new Error(result.message || 'Game creation failed');
        }
        
    } catch (error) {
        console.error('Error creating game:', error);
        Terminal.log(`Breach initialization failed: ${error.message}`, 'error');
        Toast.error(`Failed to create game: ${error.message}`);
        Loading.hide('#configForm');
    }
}
// ===== KEYBOARD SHORTCUTS =====

function registerShortcuts() {
    // Number keys 3, 4, 5 to select grid size
    Keyboard.register('3', () => selectGridSize(3));
    Keyboard.register('4', () => selectGridSize(4));
    Keyboard.register('5', () => selectGridSize(5));
    
    // Enter to submit
    Keyboard.register('enter', () => {
        document.getElementById('configForm').requestSubmit();
    });
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Set default selection
    selectGridSize(3);
    
    // Initialize event listeners
    handleGameModeChange();
    handleAIDifficultyChange();
    
    // Form submission
    const form = document.getElementById('configForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Register keyboard shortcuts
    registerShortcuts();
    
    // Initial summary update
    updateSummary();
    
    // Terminal welcome
    Terminal.log('Configuration interface loaded', 'system');
    Terminal.log('Select your breach parameters', 'info');
    
    console.log('%cCONFIGURE PAGE LOADED', 'color: #00ff9f; font-weight: bold;');
});

// Export for use in other scripts if needed
window.ConfigState = ConfigState;
window.selectGridSize = selectGridSize;