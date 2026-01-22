// rep+ Config Panel - Global Configuration
import { state, actions } from '../core/state.js';
import { events } from '../core/events.js';

class RepConfigPanel {
    constructor() {
        this.panel = document.getElementById('rep-config-panel');
        this.filterStaticCheckbox = document.getElementById('rep-config-filter-static');
        this.scopeHostnamesInput = document.getElementById('rep-config-scope-hostnames');
        this.saveBtn = document.getElementById('rep-config-save-btn');
        this.cancelBtn = document.getElementById('rep-config-cancel-btn');
        this.closeBtn = document.getElementById('rep-config-close-btn');

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Show panel when rep-config-btn is clicked
        const repConfigBtn = document.getElementById('rep-config-btn');
        if (repConfigBtn) {
            repConfigBtn.addEventListener('click', () => this.show());
        }

        // Close panel handlers
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide());
        }

        // Save configuration
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveConfig());
        }

        // Close panel when clicking outside
        if (this.panel) {
            this.panel.addEventListener('click', (e) => {
                if (e.target === this.panel) {
                    this.hide();
                }
            });
        }
    }

    show() {
        console.log('[rep+ Config] Opening panel...');

        // Load current settings
        this.loadConfig();

        // Show panel with flex display
        if (this.panel) {
            this.panel.style.display = 'flex';
            // Trigger reflow for animation
            setTimeout(() => {
                this.panel.style.opacity = '1';
                this.panel.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
        }

        // Close more menu if open
        const moreMenu = document.getElementById('more-menu');
        if (moreMenu) {
            moreMenu.classList.add('hidden');
        }
    }

    hide() {
        console.log('[rep+ Config] Closing panel...');
        if (this.panel) {
            this.panel.style.opacity = '0';
            this.panel.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => {
                this.panel.style.display = 'none';
            }, 200);
        }
    }

    loadConfig() {
        // Load Filter Static setting
        const filterStaticEnabled = localStorage.getItem('rep_filter_static') === 'true';
        if (this.filterStaticCheckbox) {
            this.filterStaticCheckbox.checked = filterStaticEnabled;
        }

        // Load Scope setting
        const scopeHostnames = localStorage.getItem('rep_scope_hostnames') || '';
        if (this.scopeHostnamesInput) {
            this.scopeHostnamesInput.value = scopeHostnames;
        }
    }

    saveConfig() {
        // Save Filter Static setting
        const filterStaticEnabled = this.filterStaticCheckbox.checked;
        localStorage.setItem('rep_filter_static', filterStaticEnabled);

        // Update UI for filter static button in More menu
        const filterStaticBtn = document.getElementById('filter-static-btn');
        const filterStaticStatus = document.querySelector('.filter-static-status');
        if (filterStaticBtn) {
            if (filterStaticEnabled) {
                filterStaticBtn.classList.add('active');
                if (filterStaticStatus) {
                    filterStaticStatus.textContent = 'ON';
                    filterStaticStatus.style.color = 'var(--accent-color)';
                }
            } else {
                filterStaticBtn.classList.remove('active');
                if (filterStaticStatus) {
                    filterStaticStatus.textContent = 'OFF';
                    filterStaticStatus.style.color = '';
                }
            }
        }

        // Save Scope setting
        const scopeHostnames = this.scopeHostnamesInput.value.trim();
        localStorage.setItem('rep_scope_hostnames', scopeHostnames);

        // Parse and normalize hostnames
        const hostnameList = scopeHostnames
            .split(',')
            .map(h => h.trim().toLowerCase())
            .filter(h => h.length > 0);

        // Store in state
        if (!state.repConfig) {
            state.repConfig = {};
        }
        state.repConfig.scopeHostnames = hostnameList;

        // Hide panel
        this.hide();

        // Trigger filter update
        events.emit('request:filtered');

        console.log('[rep+ Config] Configuration saved:', {
            filterStatic: filterStaticEnabled,
            scopeHostnames: hostnameList
        });
    }
}

// Initialize the panel when the DOM is ready
export function initRepConfigPanel() {
    return new RepConfigPanel();
}
