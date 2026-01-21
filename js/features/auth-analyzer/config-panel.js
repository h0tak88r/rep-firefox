/**
 * Auth Analyzer Configuration Panel UI
 */
import { state } from '../../core/state.js';

export class AuthAnalyzerConfigPanel {
    constructor(authAnalyzer) {
        this.authAnalyzer = authAnalyzer;
        this.panel = document.getElementById('auth-analyzer-config-panel');
        this.headerInput = document.getElementById('auth-config-header-input');

        // Header type controls
        this.headerTypeSelect = document.getElementById('auth-header-type');
        this.customHeaderNameInput = document.getElementById('auth-custom-header-name');
        this.customHeaderNameContainer = document.getElementById('auth-custom-header-name-container');
        this.headerValueLabel = document.getElementById('auth-header-value-label');
        this.headerHint = document.getElementById('auth-header-hint');

        // Realtime controls
        this.realtimeToggle = document.getElementById('auth-realtime-toggle');
        this.realtimeScope = document.getElementById('auth-realtime-scope');
        this.filterStaticToggle = document.getElementById('auth-filter-static');

        this.statusText = document.getElementById('auth-config-status-text');
        this.statusDiv = document.getElementById('auth-config-status');
        this.isVisible = false;

        this.init();
    }

    init() {
        console.log('[Auth Analyzer Config] Initializing...');
        if (!this.panel) {
            console.error('[Auth Analyzer Config] Panel element not found');
            return;
        }

        this.attachEventListeners();
        this.updateStatus();
        console.log('[Auth Analyzer Config] Initialized successfully');
    }

    attachEventListeners() {
        // Header type change
        if (this.headerTypeSelect) {
            this.headerTypeSelect.addEventListener('change', () => this.updateHeaderTypeUI());
        }

        // Close button
        const closeBtn = document.getElementById('auth-config-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Save & Enable button
        const saveBtn = document.getElementById('auth-config-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveConfig());
        }

        // Disable button
        const disableBtn = document.getElementById('auth-config-disable-btn');
        if (disableBtn) {
            disableBtn.addEventListener('click', () => this.disable());
        }

        // Bulk Replay button
        const bulkReplayBtn = document.getElementById('auth-bulk-replay-btn');
        if (bulkReplayBtn) {
            console.log('[Auth Analyzer Config] Bulk replay button found, attaching listener');
            bulkReplayBtn.addEventListener('click', (e) => {
                console.log('[Auth Analyzer Config] Bulk replay button clicked');
                this.bulkReplay();
            });
        } else {
            console.error('[Auth Analyzer Config] Bulk replay button NOT found');
        }
    }

    show() {
        if (!this.panel) return;

        // Load current config
        if (this.authAnalyzer.config.swapCookie) {
            this.headerInput.value = this.authAnalyzer.config.swapCookie;
        }

        // Load realtime settings
        if (this.realtimeToggle) {
            this.realtimeToggle.checked = this.authAnalyzer.config.enabledRealtime !== false; // Default true
        }
        if (this.realtimeScope && this.authAnalyzer.config.realtimeScope) {
            this.realtimeScope.value = this.authAnalyzer.config.realtimeScope;
        }
        if (this.filterStaticToggle) {
            this.filterStaticToggle.checked = this.authAnalyzer.config.filterStatic !== false; // Default true
        }

        // Load header type settings
        if (this.headerTypeSelect) {
            this.headerTypeSelect.value = this.authAnalyzer.config.headerType || 'cookie';
        }
        if (this.customHeaderNameInput && this.authAnalyzer.config.customHeaderName) {
            this.customHeaderNameInput.value = this.authAnalyzer.config.customHeaderName;
        }

        this.updateStatus();
        this.panel.classList.add('visible');
        this.isVisible = true;

        // Update header type UI after loading values
        this.updateHeaderTypeUI();

        // Focus input
        setTimeout(() => this.headerInput.focus(), 100);
    }

    hide() {
        if (!this.panel) return;
        this.panel.classList.remove('visible');
        this.isVisible = false;
    }

    /**
     * Update UI based on selected header type
     */
    updateHeaderTypeUI() {
        const headerType = this.headerTypeSelect?.value || 'cookie';

        // Show/hide custom header name field
        if (this.customHeaderNameContainer) {
            this.customHeaderNameContainer.style.display = headerType === 'custom' ? 'block' : 'none';
        }

        // Update label and placeholder based on type
        if (this.headerValueLabel && this.headerInput && this.headerHint) {
            switch (headerType) {
                case 'authorization':
                    this.headerValueLabel.textContent = 'Bearer Token';
                    this.headerInput.placeholder = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
                    this.headerHint.innerHTML = '<strong>Tip:</strong> Paste just the token value (without "Bearer " prefix).';
                    break;
                case 'custom':
                    this.headerValueLabel.textContent = 'Header Value';
                    this.headerInput.placeholder = 'custom-value-here';
                    this.headerHint.innerHTML = '<strong>Tip:</strong> Enter the full header value to swap.';
                    break;
                default: // cookie
                    this.headerValueLabel.textContent = 'Cookie Value (e.g. session=...)';
                    this.headerInput.placeholder = 'session=abc12345; user_role=admin';
                    this.headerHint.innerHTML = '<strong>Tip:</strong> Log in as the test user in another browser/container, copy their Cookie header, and paste it here.';
            }
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateStatus() {
        const isEnabled = this.authAnalyzer.enabled && this.authAnalyzer.config.swapCookie;

        if (isEnabled) {
            this.statusDiv.classList.remove('disabled');
            this.statusDiv.classList.add('enabled');
            this.statusDiv.querySelector('.auth-config-status-icon').textContent = '🟢';

            const realtimeStatus = this.authAnalyzer.config.enabledRealtime !== false ? 'Realtime ON' : 'Realtime OFF';
            this.statusText.textContent = `Auth Analyzer ENABLED (${realtimeStatus})`;

            // Disable button enabled
            document.getElementById('auth-config-disable-btn').disabled = false;
        } else {
            this.statusDiv.classList.remove('enabled');
            this.statusDiv.classList.add('disabled');
            this.statusDiv.querySelector('.auth-config-status-icon').textContent = '⚪';
            this.statusText.textContent = 'Auth Analyzer is DISABLED';

            // Disable button disabled
            document.getElementById('auth-config-disable-btn').disabled = true;
        }
    }

    saveConfig() {
        const headerValue = this.headerInput.value.trim();

        if (!headerValue) {
            alert('Please enter a valid header value');
            return;
        }

        // Get realtime settings
        const enabledRealtime = this.realtimeToggle ? this.realtimeToggle.checked : true;
        const realtimeScope = this.realtimeScope ? this.realtimeScope.value.trim() : '';
        const filterStatic = this.filterStaticToggle ? this.filterStaticToggle.checked : true;

        // Get header type settings
        const headerType = this.headerTypeSelect ? this.headerTypeSelect.value : 'cookie';
        const customHeaderName = this.customHeaderNameInput ? this.customHeaderNameInput.value.trim() : '';

        // Save config
        this.authAnalyzer.config.swapCookie = headerValue;
        this.authAnalyzer.config.headerType = headerType;
        this.authAnalyzer.config.customHeaderName = customHeaderName;
        this.authAnalyzer.config.enabledRealtime = enabledRealtime;
        this.authAnalyzer.config.realtimeScope = realtimeScope;
        this.authAnalyzer.config.filterStatic = filterStatic;

        this.authAnalyzer.start(); // This saves the config and enables it

        this.updateStatus();
        this.hide();
    }

    disable() {
        this.authAnalyzer.stop();
        this.updateStatus();
    }

    // Config panel also handles bulk replay inputs
    async bulkReplay() {
        console.log('[Auth Analyzer Config] bulkReplay() called');
        const hostsInput = document.getElementById('auth-bulk-hosts-input');
        const statusDiv = document.getElementById('auth-bulk-status');
        const button = document.getElementById('auth-bulk-replay-btn');

        // Hosts list from input
        const hostsText = hostsInput ? hostsInput.value : '';
        console.log('[Auth Analyzer Config] Hosts:', hostsText);

        const hosts = hostsText.split(',')
            .map(h => h.trim())
            .filter(h => h.length > 0);

        // Filter requests
        console.log('[Auth Analyzer Config] Filtering requests from state.requests:', state.requests?.length);
        const requests = state.requests.filter(req => {
            if (hosts.length === 0) return true; // Replay all if empty

            const url = req.url || req.request.url;
            try {
                const hostname = new URL(url).hostname;
                return hosts.some(h => hostname.includes(h));
            } catch (e) {
                return false;
            }
        });

        if (requests.length === 0) {
            statusDiv.textContent = 'No matching requests found.';
            statusDiv.style.color = '#f44336';
            return;
        }

        // Removed blocking confirm() as it may not work in DevTools panel
        // if (!confirm(`Found ${requests.length} matching requests.\n\nStart bulk replay?`)) {
        //    return;
        // }

        console.log(`[Auth Analyzer Config] Starting bulk replay for ${requests.length} requests`);

        // Start Replay
        statusDiv.textContent = `Starting replay of ${requests.length} requests...`;
        statusDiv.style.color = 'var(--text-secondary)';
        button.disabled = true;

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            const percent = Math.round(((i + 1) / requests.length) * 100);

            statusDiv.textContent = `Replaying ${i + 1}/${requests.length} (${percent}%)...`;

            if (i % 10 === 0) {
                console.log(`[Auth Analyzer Config] Processing request ${i + 1}/${requests.length}`);
            }

            try {
                await this.authAnalyzer.processRequest(req);
                successCount++;
            } catch (e) {
                console.error('Bulk replay error:', e);
                failCount++;
            }

            // Small delay to prevent blocking UI
            await new Promise(r => setTimeout(r, 50));
        }

        statusDiv.textContent = `Done! Processed ${requests.length} requests.`;
        statusDiv.style.color = '#4caf50';
        button.disabled = false;

        // Open results panel
        const authPanel = window.authAnalyzerPanel;
        if (authPanel) {
            authPanel.show();
        }
    }
}

let configPanelInstance = null;

export function initAuthAnalyzerConfigPanel(authAnalyzer) {
    if (!configPanelInstance) {
        configPanelInstance = new AuthAnalyzerConfigPanel(authAnalyzer);
    }
    return configPanelInstance;
}
