/**
 * TACTIX // BLACKBOX - UI Utilities
 * Helper functions for cyberpunk interface interactions
 */

// ===== TOAST NOTIFICATIONS =====

const Toast = {
    container: null,
    
    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-6 right-6 z-50 space-y-3';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const icons = {
            success: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>`,
            error: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>`,
            warning: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>`,
            info: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>`
        };
        
        const colors = {
            success: 'border-neon-green text-neon-green',
            error: 'border-breach-red text-breach-red',
            warning: 'border-yellow-400 text-yellow-400',
            info: 'border-neon-cyan text-neon-cyan'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type} ${colors[type]} flex items-start gap-3 font-mono text-sm`;
        
        toast.innerHTML = `
            <div class="shrink-0 mt-0.5">${icons[type]}</div>
            <div class="flex-1">${message}</div>
            <button onclick="this.parentElement.remove()" class="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// ===== TERMINAL LOGGER =====

const Terminal = {
    logs: [],
    maxLogs: 100,
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const entry = { message, type, timestamp };
        
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Dispatch event for components listening to terminal updates
        window.dispatchEvent(new CustomEvent('terminal-log', { detail: entry }));
        
        return entry;
    },
    
    clear() {
        this.logs = [];
        window.dispatchEvent(new CustomEvent('terminal-clear'));
    },
    
    getLogs() {
        return [...this.logs];
    }
};

// ===== AUDIO EFFECTS =====

const Audio = {
    sounds: {},
    enabled: true,
    
    init() {
        // Preload sounds (URLs would be actual sound files)
        this.sounds = {
            click: new window.Audio('/static/audio/click.mp3'),
            move: new window.Audio('/static/audio/move.mp3'),
            win: new window.Audio('/static/audio/win.mp3'),
            error: new window.Audio('/static/audio/error.mp3'),
        };
        
        // Set volume
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });
    },
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName].cloneNode();
            sound.play().catch(() => {});
        } catch (e) {
            // Silently fail if audio not available
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

// ===== MODAL UTILITY =====

const Modal = {
    show(content, options = {}) {
        const {
            title = '',
            closeButton = true,
            backdrop = true,
            onClose = null
        } = options;
        
        // Create backdrop
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm';
        
        if (backdrop) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.close(modal, onClose);
                }
            };
        }
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content max-w-2xl w-full mx-4 bg-void border-2 border-neon-cyan shadow-neon-cyan/50';
        
        modalContent.innerHTML = `
            ${title ? `
                <div class="modal-header flex items-center justify-between p-6 border-b border-grid-line">
                    <h3 class="font-display font-bold text-xl text-neon-cyan uppercase tracking-wider">${title}</h3>
                    ${closeButton ? `
                        <button onclick="Modal.closeAll()" class="text-gray-500 hover:text-neon-cyan transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            <div class="modal-body p-6">
                ${content}
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        return modal;
    },
    
    close(modal, onClose = null) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            
            // Restore body scroll if no other modals
            if (!document.querySelector('.modal-backdrop')) {
                document.body.style.overflow = '';
            }
            
            if (onClose) onClose();
        }, 300);
    },
    
    closeAll() {
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            this.close(modal);
        });
    }
};

// ===== LOADING INDICATOR =====

const Loading = {
    show(target, text = 'LOADING...') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        const loader = document.createElement('div');
        loader.className = 'loading-overlay absolute inset-0 flex flex-col items-center justify-center bg-void/90 backdrop-blur-sm z-50';
        loader.innerHTML = `
            <div class="loading-spinner mb-4"></div>
            <div class="font-mono text-sm text-neon-cyan uppercase tracking-widest animate-pulse">
                ${text}
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(loader);
        
        return loader;
    },
    
    hide(target) {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        const loader = element.querySelector('.loading-overlay');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }
};

// ===== CONFETTI EFFECT =====

const Confetti = {
    create(count = 50) {
        const colors = ['#00f6ff', '#ff006e', '#b833ff', '#00ff9f', '#ff3366'];
        const container = document.createElement('div');
        container.className = 'fixed inset-0 pointer-events-none z-50';
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti absolute w-2 h-2';
            confetti.style.cssText = `
                left: ${Math.random() * 100}%;
                top: -10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 2}s;
                animation-duration: ${3 + Math.random() * 2}s;
            `;
            container.appendChild(confetti);
        }
        
        document.body.appendChild(container);
        
        setTimeout(() => container.remove(), 5000);
    }
};

// ===== UTILITY FUNCTIONS =====

const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('Copied to clipboard');
        }).catch(() => {
            Toast.error('Failed to copy');
        });
    },
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
};

// ===== KEYBOARD SHORTCUTS =====

const Keyboard = {
    shortcuts: {},
    
    register(key, callback, options = {}) {
        const { ctrl = false, shift = false, alt = false } = options;
        const id = `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${alt ? 'alt+' : ''}${key}`;
        this.shortcuts[id] = callback;
    },
    
    init() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const id = `${e.ctrlKey ? 'ctrl+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${key}`;
            
            if (this.shortcuts[id]) {
                e.preventDefault();
                this.shortcuts[id](e);
            }
        });
    }
};

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    // Initialize systems
    Toast.init();
    Keyboard.init();
    
    // Register common shortcuts
    Keyboard.register('escape', () => Modal.closeAll());
    
    // Add ripple effect to buttons
    document.querySelectorAll('.neon-button').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'absolute inset-0 bg-current opacity-20 rounded-full transform scale-0';
            ripple.style.animation = 'button-ripple 0.6s ease-out';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Update uptime in footer
    const startTime = Date.now();
    setInterval(() => {
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const uptimeEl = document.querySelector('footer .terminal-cursor');
        if (uptimeEl) {
            uptimeEl.previousSibling.textContent = `UPTIME: ${Utils.formatTime(uptime)} `;
        }
    }, 1000);
    
    console.log('%cTACTIX // BLACKBOX', 'color: #00f6ff; font-size: 24px; font-weight: bold;');
    console.log('%cBREACH PROTOCOL v2.0 - INITIALIZED', 'color: #00ff9f; font-size: 14px;');
});

// Export to global scope
window.Toast = Toast;
window.Terminal = Terminal;
window.Audio = Audio;
window.Modal = Modal;
window.Loading = Loading;
window.Confetti = Confetti;
window.Utils = Utils;
window.Keyboard = Keyboard;