document.addEventListener('DOMContentLoaded', function() {
    const resetStatsButton = document.getElementById('reset-stats');

    // Charger les statistiques
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('operator-progress').style.width = data.global_progress.operator_dominance + '%';
            document.getElementById('system-progress').style.width = data.global_progress.system_resistance + '%';
            document.getElementById('total-games').textContent = data.global_progress.total_games;

            document.getElementById('3x3-wld').textContent = 
                `${data.grid_stats['3x3'].wins} / ${data.grid_stats['3x3'].losses} / ${data.grid_stats['3x3'].draws}`;
            document.getElementById('3x3-rate').textContent = data.grid_stats['3x3'].percentage + '%';

            document.getElementById('4x4-wld').textContent = 
                `${data.grid_stats['4x4'].wins} / ${data.grid_stats['4x4'].losses} / ${data.grid_stats['4x4'].draws}`;
            document.getElementById('4x4-rate').textContent = data.grid_stats['4x4'].percentage + '%';

            document.getElementById('5x5-wld').textContent = 
                `${data.grid_stats['5x5'].wins} / ${data.grid_stats['5x5'].losses} / ${data.grid_stats['5x5'].draws}`;
            document.getElementById('5x5-rate').textContent = data.grid_stats['5x5'].percentage + '%';

            document.getElementById('undetected-wins').textContent = data.undetected_wins;
            document.getElementById('successful-exploits').textContent = data.successful_exploits;
            document.getElementById('firewall-locks').textContent = data.firewall_locks;
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showToast('Failed to load statistics', 'error');
        });

    resetStatsButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
            fetch('/api/stats/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    showToast('Statistics reset', 'info');
                    // Recharger les statistiques
                    location.reload();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Reset failed', 'error');
            });
        }
    });
});