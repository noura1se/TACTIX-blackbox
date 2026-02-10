// UI helpers

// Mise en évidence du lien actif dans la navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '15px 30px';
    toast.style.backgroundColor = type === 'error' ? 'rgba(255,0,0,0.9)' : 'rgba(0,255,0,0.9)';
    toast.style.color = '#000';
    toast.style.border = '1px solid #00ff00';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '10000';
    toast.style.fontFamily = 'Courier New, monospace';
    toast.style.fontWeight = 'bold';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}