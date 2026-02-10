document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('configure-form');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            grid_size: form.querySelector('input[name="grid_size"]:checked').value,
            mode: form.querySelector('input[name="mode"]:checked').value,
            difficulty: form.querySelector('input[name="difficulty"]:checked').value
        };

        fetch('/api/new', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                window.location.href = '/game';
            } else {
                showToast('Failed to create game', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Network error', 'error');
        });
    });
});