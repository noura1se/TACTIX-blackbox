/**
 * TACTIX // BLACKBOX - Combat Statistics Dashboard
 * Displays comprehensive game statistics with neon-themed charts
 */

// Chart.js default colors and theme
Chart.defaults.color = '#9ca3af';
Chart.defaults.borderColor = 'rgba(156, 163, 175, 0.1)';
Chart.defaults.font.family = "'Orbitron', monospace";

let gridSizeChart = null;
let outcomesChart = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('⚡ Loading combat statistics...');
    
    // Load stats
    await loadStats();
    
    // Setup reset button
    setupResetButton();
    
    console.log('✓ Statistics dashboard loaded successfully');
});

// ===== LOAD STATS =====

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const data = result.data;
        
        console.log('📊 Stats loaded:', data);
        
        // Update all sections
        updateOperatorSystemBar(data);
        updateOverviewCards(data);
        updateDifficultyStats(data);
        updateModeStats(data);
        updateGridBreakdown(data);
        createGridSizeChart(data);
        createOutcomesChart(data);
        updateRecentGames(data);
        
    } catch (error) {
        console.error('❌ Failed to load statistics:', error);
        showError('Failed to load combat statistics');
    }
}

// ===== RESET STATS FUNCTIONALITY =====

function setupResetButton() {
    const resetBtn = document.getElementById('reset-stats-btn');
    const modal = document.getElementById('reset-confirmation-modal');
    const confirmBtn = document.getElementById('confirm-reset-btn');
    const cancelBtn = document.getElementById('cancel-reset-btn');
    
    // Show modal on reset button click
    resetBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    
    // Hide modal on cancel
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Close modal on clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Confirm reset
    confirmBtn.addEventListener('click', async () => {
        try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Resetting...';
            
            const response = await fetch('/api/stats/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Show success message
                showSuccess('Statistics reset successfully');
                
                // Close modal
                modal.classList.add('hidden');
                
                // Reload stats
                await loadStats();
            } else {
                throw new Error(result.message || 'Failed to reset stats');
            }
            
        } catch (error) {
            console.error('❌ Failed to reset statistics:', error);
            showError('Failed to reset statistics');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Reset';
        }
    });
}

// ===== OPERATOR VS SYSTEM DOMINANCE BAR =====

function updateOperatorSystemBar(data) {
    const totals = data.totals || {};
    const winsByWinner = totals.winsByWinner || { X: 0, O: 0 };
    
    const operatorWins = winsByWinner.X || 0;
    const systemWins = winsByWinner.O || 0;
    const totalDraws = totals.draws || 0;
    const totalGames = totals.gamesPlayed || 0;
    
    // Calculate percentages
    const operatorPercentage = totalGames > 0 ? Math.round((operatorWins / totalGames) * 100) : 0;
    const systemPercentage = totalGames > 0 ? Math.round((systemWins / totalGames) * 100) : 0;
    
    // Update progress bars with animation
    setTimeout(() => {
        document.getElementById('operator-progress').style.width = operatorPercentage + '%';
        document.getElementById('system-progress').style.width = systemPercentage + '%';
    }, 100);
    
    // Update labels (removed from inside bar, now only in bottom stats)
    document.getElementById('total-games-bar').textContent = totalGames;
    document.getElementById('operator-wins').textContent = operatorWins;
    document.getElementById('system-wins').textContent = systemWins;
    document.getElementById('total-draws').textContent = totalDraws;
}

// ===== OVERVIEW CARDS =====

function updateOverviewCards(data) {
    const totals = data.totals || {};
    
    // Total games
    const totalGames = totals.gamesPlayed || 0;
    document.getElementById('total-games').textContent = totalGames;
    
    // Win rate
    const winRate = Math.round(totals.overallWinRate || 0);
    document.getElementById('win-rate').textContent = winRate + '%';
    
    // Draw rate
    const drawRate = Math.round(totals.overallDrawRate || 0);
    document.getElementById('draw-rate').textContent = drawRate + '%';
    
    // Win streak
    const winStreak = calculateWinStreak(data.recentGames || []);
    document.getElementById('win-streak').textContent = winStreak;
}

function calculateWinStreak(recentGames) {
    if (!recentGames || recentGames.length === 0) return 0;
    
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Games are ordered newest first, so reverse to get chronological order
    const chronological = [...recentGames].reverse();
    
    for (const game of chronological) {
        // Count wins where player (X) won
        if (game.result === 'WIN' && game.winner === 'X') {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }
    
    return maxStreak;
}

// ===== DIFFICULTY STATS =====

function updateDifficultyStats(data) {
    const container = document.getElementById('difficulty-stats');
    const byDifficulty = data.byDifficulty || {};
    
    if (Object.keys(byDifficulty).length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">No difficulty data available</div>';
        return;
    }
    
    const difficulties = Object.keys(byDifficulty).sort();
    
    container.innerHTML = difficulties.map(difficulty => {
        const stats = byDifficulty[difficulty];
        const winRate = Math.round(stats.winRate || 0);
        const drawRate = Math.round(stats.drawRate || 0);
        
        const difficultyColors = {
            'EASY': 'text-neon-green',
            'MEDIUM': 'text-neon-purple',
            'RELENTLESS': 'text-neon-pink'
        };
        
        const color = difficultyColors[difficulty] || 'text-neon-cyan';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-900/30 rounded border border-gray-800 hover:border-gray-700 transition-colors">
                <div class="flex-1">
                    <div class="font-bold ${color} text-sm">${difficulty}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${stats.games} games · ${stats.wins}W / ${stats.draws}D
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-neon-green">${winRate}%</div>
                    <div class="text-xs text-gray-500">Win Rate</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== MODE STATS =====

function updateModeStats(data) {
    const container = document.getElementById('mode-stats');
    const byMode = data.byMode || {};
    
    if (Object.keys(byMode).length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">No mode data available</div>';
        return;
    }
    
    container.innerHTML = Object.entries(byMode).map(([mode, stats]) => {
        const winRate = Math.round(stats.winRate || 0);
        const drawRate = Math.round(stats.drawRate || 0);
        
        const displayMode = mode === 'OPERATOR_VS_SYSTEM' ? 'vs AI' : 'vs PLAYER';
        const modeColor = mode === 'OPERATOR_VS_SYSTEM' ? 'text-neon-cyan' : 'text-neon-pink';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-900/30 rounded border border-gray-800 hover:border-gray-700 transition-colors">
                <div class="flex-1">
                    <div class="font-bold ${modeColor} text-sm">${displayMode}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${stats.games} games · ${stats.wins}W / ${stats.draws}D
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-neon-green">${winRate}%</div>
                    <div class="text-xs text-gray-500">Win Rate</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== GRID SIZE BREAKDOWN TABLE =====

function updateGridBreakdown(data) {
    const tbody = document.getElementById('grid-breakdown-table');
    const byBoardSize = data.byBoardSize || {};
    
    if (Object.keys(byBoardSize).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">No grid data available</td></tr>';
        return;
    }
    
    const sizes = Object.keys(byBoardSize).sort((a, b) => parseInt(a) - parseInt(b));
    
    tbody.innerHTML = sizes.map(size => {
        const stats = byBoardSize[size];
        const winRate = Math.round(stats.winRate || 0);
        const drawRate = Math.round(stats.drawRate || 0);
        
        return `
            <tr class="border-b border-gray-800/30 hover:bg-gray-900/20 transition-colors">
                <td class="py-3 px-4 text-neon-cyan font-bold">${size}x${size}</td>
                <td class="py-3 px-4 text-center text-gray-300">${stats.games}</td>
                <td class="py-3 px-4 text-center text-neon-green font-bold">${stats.wins}</td>
                <td class="py-3 px-4 text-center text-neon-purple font-bold">${stats.draws}</td>
                <td class="py-3 px-4 text-center text-neon-green">${winRate}%</td>
                <td class="py-3 px-4 text-center text-neon-purple">${drawRate}%</td>
            </tr>
        `;
    }).join('');
}

// ===== GRID SIZE CHART =====

function createGridSizeChart(data) {
    const ctx = document.getElementById('grid-size-chart');
    if (!ctx) {
        console.error('Grid size chart canvas not found');
        return;
    }
    
    const byBoardSize = data.byBoardSize || {};
    
    if (Object.keys(byBoardSize).length === 0) {
        console.log('No board size data available for chart');
        return;
    }
    
    const sizes = Object.keys(byBoardSize).sort((a, b) => parseInt(a) - parseInt(b));
    
    const labels = sizes.map(s => `${s}x${s}`);
    const winRates = sizes.map(size => Math.round(byBoardSize[size].winRate || 0));
    
    if (gridSizeChart) {
        gridSizeChart.destroy();
    }
    
    try {
        gridSizeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Win Rate %',
                    data: winRates,
                    backgroundColor: 'rgba(0, 246, 255, 0.6)',
                    borderColor: '#00f6ff',
                    borderWidth: 2,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(0, 246, 255, 0.8)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 15, 0.95)',
                        borderColor: '#00f6ff',
                        borderWidth: 1,
                        titleColor: '#00f6ff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const size = sizes[context.dataIndex];
                                const stats = byBoardSize[size];
                                return [
                                    `Win Rate: ${Math.round(stats.winRate)}%`,
                                    `Wins: ${stats.wins}`,
                                    `Draws: ${stats.draws}`,
                                    `Games: ${stats.games}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0, 246, 255, 0.1)' },
                        ticks: {
                            color: '#00f6ff',
                            callback: value => value + '%'
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#00f6ff',
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });
        console.log('✓ Grid size chart created successfully');
    } catch (error) {
        console.error('Error creating grid size chart:', error);
    }
}

// ===== OUTCOMES CHART =====

function createOutcomesChart(data) {
    const ctx = document.getElementById('outcomes-chart');
    if (!ctx) {
        console.error('Outcomes chart canvas not found');
        return;
    }
    
    const totals = data.totals || {};
    const totalWins = totals.wins || 0;
    const totalDraws = totals.draws || 0;
    
    if (totalWins === 0 && totalDraws === 0) {
        console.log('No outcomes data available for chart');
        return;
    }
    
    if (outcomesChart) {
        outcomesChart.destroy();
    }
    
    try {
        outcomesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['WINS', 'DRAWS'],
                datasets: [{
                    data: [totalWins, totalDraws],
                    backgroundColor: [
                        'rgba(0, 255, 159, 0.7)',
                        'rgba(184, 51, 255, 0.7)'
                    ],
                    borderColor: ['#00ff9f', '#b833ff'],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9ca3af',
                            padding: 20,
                            font: {
                                family: "'Orbitron', monospace",
                                size: 12,
                                weight: 'bold'
                            },
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i]}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    lineWidth: 2,
                                    hidden: false,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 15, 0.95)',
                        borderColor: '#b833ff',
                        borderWidth: 1,
                        titleColor: '#b833ff',
                        bodyColor: '#fff',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('✓ Outcomes chart created successfully');
    } catch (error) {
        console.error('Error creating outcomes chart:', error);
    }
}

// ===== RECENT GAMES TABLE =====

function updateRecentGames(data) {
    const tbody = document.getElementById('recent-games-table');
    if (!tbody) return;
    
    const recentGames = data.recentGames || [];
    
    if (recentGames.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <div class="font-mono">
                        <span class="text-neon-cyan">◆</span> NO BREACHES RECORDED <span class="text-neon-cyan">◆</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = recentGames.slice(0, 10).map(game => {
        const resultColor = game.result === 'WIN' ? 'text-neon-green' : 
                           game.result === 'DRAW' ? 'text-neon-purple' : 'text-neon-pink';
        
        const resultIcon = game.result === 'WIN' ? '✓' : 
                          game.result === 'DRAW' ? '―' : '✗';
        
        const winnerDisplay = game.winner ? 
            `<span class="${game.winner === 'X' ? 'text-neon-cyan' : 'text-neon-pink'}">${game.winner}</span>` : 
            '<span class="text-gray-500">―</span>';
        
        return `
            <tr class="border-b border-gray-800/30 hover:bg-gray-900/20 transition-colors">
                <td class="py-3 px-4 text-gray-400">${formatDate(game.ts)}</td>
                <td class="py-3 px-4 text-neon-cyan font-bold">${game.boardSize}x${game.boardSize}</td>
                <td class="py-3 px-4 text-gray-300">${formatMode(game.mode)}</td>
                <td class="py-3 px-4 text-neon-purple">${game.difficulty || 'MEDIUM'}</td>
                <td class="py-3 px-4 text-center font-bold">${winnerDisplay}</td>
                <td class="py-3 px-4 text-center ${resultColor} font-bold">
                    <span class="inline-flex items-center gap-1">
                        ${resultIcon} ${game.result}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== UTILITY FUNCTIONS =====

function formatDate(timestamp) {
    if (!timestamp) return 'UNKNOWN';
    
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    } catch (e) {
        return 'UNKNOWN';
    }
}

function formatMode(mode) {
    if (!mode) return 'STANDARD';
    
    const modeMap = {
        'OPERATOR_VS_SYSTEM': 'vs AI',
        'OPERATOR_VS_OPERATOR': 'vs PLAYER'
    };
    
    return modeMap[mode] || mode.replace(/_/g, ' ');
}

function showError(message) {
    // Try to use Toast if available
    if (window.Toast) {
        Toast.error(message);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    // Try to use Toast if available
    if (window.Toast) {
        Toast.success(message);
    } else {
        alert(message);
    }
}

console.log('%c⚡ COMBAT STATISTICS MODULE LOADED', 'color: #00ff9f; font-weight: bold; font-size: 14px;');