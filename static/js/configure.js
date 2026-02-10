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
            'operator_vs_ai': 'Operator vs AI',
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

function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate configuration
    if (!ConfigState.boardSize || !ConfigState.gameMode) {
        Toast.error('Please complete the configuration');
        return;
    }
    
    // Prepare configuration data
    const config = {
        board_size: ConfigState.boardSize,
        game_mode: ConfigState.gameMode,
        ai_difficulty: ConfigState.gameMode === 'operator_vs_ai' ? ConfigState.aiDifficulty : null
    };
    
    // Store in localStorage for game page
    localStorage.setItem('gameConfig', JSON.stringify(config));
    
    // Log
    Terminal.log('Configuration saved', 'success');
    Terminal.log('Initiating breach...', 'breach');
    
    // Show loading
    Loading.show('#configForm', 'INITIALIZING BREACH...');
    
    // Redirect to game page after brief delay
    setTimeout(() => {
        const params = new URLSearchParams(config);
        window.location.href = `/game?${params.toString()}`;
    }, 1500);
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