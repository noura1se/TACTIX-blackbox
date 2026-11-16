// terminal.js - Dynamic Terminal Messages System

class TerminalMessages {
    constructor() {
        this.container = document.getElementById('terminal-messages');
        this.messageQueue = [];
        this.maxLines = 2;
        this.isTyping = false;
        
        // Message templates for different game events
        this.messages = {
            init: [
                'OPERATOR ACCESS GRANTED',
                'SYSTEM RESPONDING',
                'NEURAL LINK ESTABLISHED',
                'BREACH PROTOCOL INITIALIZED'
            ],
            playerMove: [
                'OPERATOR MOVE DETECTED',
                'BREACH VECTOR DEPLOYED',
                'NODE COMPROMISED',
                'EXPLOIT EXECUTED',
                'ACCESS POINT SECURED',
                'FIREWALL BYPASSED',
                'INJECTION SUCCESSFUL',
                'PAYLOAD DELIVERED'
            ],
            aiThinking: [
                'SYSTEM ANALYZING',
                'COUNTERMEASURE CALCULATING',
                'DEFENSIVE PROTOCOL ACTIVE',
                'THREAT ASSESSMENT IN PROGRESS',
                'SECURITY ALGORITHM PROCESSING',
                'COUNTER-HACK INITIATED'
            ],
            aiMove: [
                'SYSTEM COUNTERATTACK',
                'DEFENSIVE NODE PLACED',
                'FIREWALL REINFORCED',
                'SECURITY MEASURE DEPLOYED',
                'COUNTERMEASURE ACTIVE',
                'SYSTEM RESPONSE EXECUTED',
                'DEFENSIVE PROTOCOL ENGAGED'
            ],
            scan: [
                'INITIATING EXPLOIT SCAN',
                'ANALYZING BREACH VECTORS',
                'VULNERABILITY SCAN COMPLETE',
                'TACTICAL ASSESSMENT DONE',
                'THREAT MATRIX CALCULATED'
            ],
            undo: [
                'ROLLING BACK OPERATION',
                'FIREWALL RESTORE INITIATED',
                'PREVIOUS STATE RECOVERED',
                'OPERATION REVERSED'
            ],
            reset: [
                'SYSTEM RESET INITIATED',
                'PURGING ALL DATA',
                'BREACH GRID CLEARED',
                'RESTARTING PROTOCOL'
            ],
            playerWin: [
                'BREACH SUCCESSFUL',
                'SYSTEM COMPROMISED',
                'TOTAL SYSTEM FAILURE',
                'OPERATOR VICTORY CONFIRMED',
                'FIREWALL COMPLETELY BREACHED'
            ],
            aiWin: [
                'BREACH CONTAINED',
                'SYSTEM DEFENDED',
                'OPERATOR ACCESS DENIED',
                'SECURITY MEASURES SUCCESSFUL',
                'INTRUSION REPELLED'
            ],
            draw: [
                'STALEMATE DETECTED',
                'GRIDLOCK PROTOCOL',
                'NO WINNER DETERMINED',
                'TACTICAL DEADLOCK'
            ],
            warning: [
                'WARNING: CRITICAL NODE AT RISK',
                'ALERT: VICTORY PATH DETECTED',
                'DANGER: SYSTEM VULNERABILITY',
                'CAUTION: TACTICAL THREAT'
            ]
        };
    }

    addMessage(text, delay = 0) {
        setTimeout(() => {
            const lines = this.container.querySelectorAll('.terminal-line');
            
            // Mark old lines
            lines.forEach(line => {
                line.classList.add('old');
            });
            
            // Remove oldest if we have max lines
            if (lines.length >= this.maxLines) {
                const oldest = lines[0];
                oldest.style.transition = 'opacity 0.3s';
                oldest.style.opacity = '0';
                setTimeout(() => oldest.remove(), 300);
            }
            
            // Add new message
            const newLine = document.createElement('div');
            newLine.className = 'terminal-line';
            newLine.innerHTML = text;
            
            // Add cursor to last message
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            newLine.appendChild(cursor);
            
            this.container.appendChild(newLine);
            
        }, delay);
    }

    getRandomMessage(category) {
        const msgs = this.messages[category];
        return msgs[Math.floor(Math.random() * msgs.length)];
    }

    onGameStart() {
        this.addMessage(this.getRandomMessage('init'), 0);
        this.addMessage('READY TO BREACH', 800);
    }

    onPlayerMove(position) {
        this.addMessage(this.getRandomMessage('playerMove'), 100);
    }

    onAIThinking() {
        this.addMessage(this.getRandomMessage('aiThinking'), 200);
    }

    onAIMove(position) {
        this.addMessage(this.getRandomMessage('aiMove'), 100);
    }

    onScan() {
        this.addMessage(this.getRandomMessage('scan'), 0);
        this.addMessage('RECOMMENDATIONS DISPLAYED', 600);
    }

    onUndo() {
        this.addMessage(this.getRandomMessage('undo'), 0);
    }

    onReset() {
        this.addMessage(this.getRandomMessage('reset'), 0);
        setTimeout(() => {
            this.container.innerHTML = '';
            this.onGameStart();
        }, 1000);
    }

    onPlayerWin() {
        this.addMessage(this.getRandomMessage('playerWin'), 200);
        this.addMessage('MISSION ACCOMPLISHED', 800);
    }

    onAIWin() {
        this.addMessage(this.getRandomMessage('aiWin'), 200);
        this.addMessage('MISSION FAILED', 800);
    }

    onDraw() {
        this.addMessage(this.getRandomMessage('draw'), 200);
        this.addMessage('MATCH CONCLUDED', 800);
    }

    onWarning() {
        this.addMessage(this.getRandomMessage('warning'), 0);
    }
}

// Initialize terminal messages system
const terminal = new TerminalMessages();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    terminal.onGameStart();
});

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerminalMessages;
}