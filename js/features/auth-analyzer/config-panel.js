/**
 * Auth Analyzer Configuration Panel UI
 */
import { state } from '../../core/state.js';

export class AuthAnalyzerConfigPanel {
    constructor(authAnalyzer) {
        this.authAnalyzer = authAnalyzer;
        this.panel = document.getElementById('auth-analyzer-config-panel');

        // Cookie configuration controls
        this.useCookieCheckbox = document.getElementById('auth-use-cookie');
        this.cookieConfigDiv = document.getElementById('auth-cookie-config');
        this.cookieValueInput = document.getElementById('auth-cookie-value');

        // Custom header configuration controls (dynamic list)
        this.useCustomHeaderCheckbox = document.getElementById('auth-use-custom-header');
        this.customHeaderConfigDiv = document.getElementById('auth-custom-header-config');
        this.customHeadersList = document.getElementById('auth-custom-headers-list');
        this.addCustomHeaderBtn = document.getElementById('auth-add-custom-header-btn');
        this.customHeaders = []; // Array of {name, value} objects

        // URL parameter configuration controls (dynamic list)
        this.useUrlParamCheckbox = document.getElementById('auth-use-url-param');
        this.urlParamConfigDiv = document.getElementById('auth-url-param-config');
        this.urlParamsList = document.getElementById('auth-url-params-list');
        this.addUrlParamBtn = document.getElementById('auth-add-url-param-btn');
        this.urlParams = []; // Array of {name, value} objects

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
        // Cookie checkbox toggle
        if (this.useCookieCheckbox) {
            this.useCookieCheckbox.addEventListener('change', () => {
                if (this.cookieConfigDiv) {
                    this.cookieConfigDiv.style.display = this.useCookieCheckbox.checked ? 'block' : 'none';
                }
            });
        }

        // Custom header checkbox toggle
        if (this.useCustomHeaderCheckbox) {
            this.useCustomHeaderCheckbox.addEventListener('change', () => {
                if (this.customHeaderConfigDiv) {
                    this.customHeaderConfigDiv.style.display = this.useCustomHeaderCheckbox.checked ? 'block' : 'none';
                }
            });
        }

        // URL parameter checkbox toggle
        if (this.useUrlParamCheckbox) {
            this.useUrlParamCheckbox.addEventListener('change', () => {
                if (this.urlParamConfigDiv) {
                    this.urlParamConfigDiv.style.display = this.useUrlParamCheckbox.checked ? 'block' : 'none';
                }
            });
        }

        // Add custom header button
        if (this.addCustomHeaderBtn) {
            this.addCustomHeaderBtn.addEventListener('click', () => {
                this.addCustomHeader();
            });
        }

        // Add URL parameter button
        if (this.addUrlParamBtn) {
            this.addUrlParamBtn.addEventListener('click', () => {
                this.addUrlParam();
            });
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

        // Load cookie configuration
        const useCookie = this.authAnalyzer.config.useCookie || false;
        const cookieValue = this.authAnalyzer.config.cookieValue || '';

        if (this.useCookieCheckbox) {
            this.useCookieCheckbox.checked = useCookie;
        }
        if (this.cookieValueInput) {
            this.cookieValueInput.value = cookieValue;
        }
        if (this.cookieConfigDiv) {
            this.cookieConfigDiv.style.display = useCookie ? 'block' : 'none';
        }

        // Load custom header configuration from arrays
        const useCustomHeader = this.authAnalyzer.config.useCustomHeader || false;
        const savedHeaders = this.authAnalyzer.config.customHeaders || [];

        if (this.useCustomHeaderCheckbox) {
            this.useCustomHeaderCheckbox.checked = useCustomHeader;
        }
        if (this.customHeaderConfigDiv) {
            this.customHeaderConfigDiv.style.display = useCustomHeader ? 'block' : 'none';
        }

        // Populate custom headers list
        this.customHeaders = savedHeaders.length > 0 ? savedHeaders.map((h, i) => ({
            id: Date.now() + i,
            name: h.name || '',
            value: h.value || ''
        })) : [];

        // Add at least one empty header if enabled but no headers exist
        if (useCustomHeader && this.customHeaders.length === 0) {
            this.customHeaders.push({ id: Date.now(), name: '', value: '' });
        }
        this.renderCustomHeaders();

        // Load URL parameter configuration from arrays
        const useUrlParam = this.authAnalyzer.config.useUrlParam || false;
        const savedParams = this.authAnalyzer.config.urlParams || [];

        if (this.useUrlParamCheckbox) {
            this.useUrlParamCheckbox.checked = useUrlParam;
        }
        if (this.urlParamConfigDiv) {
            this.urlParamConfigDiv.style.display = useUrlParam ? 'block' : 'none';
        }

        // Populate URL params list
        this.urlParams = savedParams.length > 0 ? savedParams.map((p, i) => ({
            id: Date.now() + 1000 + i,
            name: p.name || '',
            value: p.value || ''
        })) : [];

        // Add at least one empty param if enabled but no params exist
        if (useUrlParam && this.urlParams.length === 0) {
            this.urlParams.push({ id: Date.now() + 1000, name: '', value: '' });
        }
        this.renderUrlParams();

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

        this.updateStatus();
        this.panel.classList.add('visible');
        this.isVisible = true;

        // Focus first enabled input
        setTimeout(() => {
            if (useCookie && this.cookieValueInput) {
                this.cookieValueInput.focus();
            } else if (useCustomHeader && this.customHeaderNameInput) {
                this.customHeaderNameInput.focus();
            }
        }, 100);
    }

    hide() {
        if (!this.panel) return;
        this.panel.classList.remove('visible');
        this.isVisible = false;
    }



    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    updateStatus() {
        // Consider enabled if analyzer is on AND at least one header type is configured
        const hasHeaders = (this.authAnalyzer.config.useCookie && this.authAnalyzer.config.cookieValue) ||
            (this.authAnalyzer.config.useCustomHeader && this.authAnalyzer.config.customHeaderName && this.authAnalyzer.config.customHeaderValue);
        const isEnabled = this.authAnalyzer.enabled && hasHeaders;

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
        // Get cookie configuration
        const useCookie = this.useCookieCheckbox ? this.useCookieCheckbox.checked : false;
        const cookieValue = this.cookieValueInput ? this.cookieValueInput.value.trim() : '';

        // Get custom header configuration from dynamic list
        const useCustomHeader = this.useCustomHeaderCheckbox ? this.useCustomHeaderCheckbox.checked : false;
        const validHeaders = this.customHeaders.filter(h => h.name && h.value);

        // Get URL parameter configuration from dynamic list
        const useUrlParam = this.useUrlParamCheckbox ? this.useUrlParamCheckbox.checked : false;
        const validParams = this.urlParams.filter(p => p.name && p.value);

        // Validate cookie configuration
        if (useCookie && !cookieValue) {
            alert('Please enter a cookie value or uncheck "Use Session Cookie"');
            return;
        }

        // Validate custom header configuration
        if (useCustomHeader && validHeaders.length === 0) {
            alert('Please add at least one custom header with name and value');
            return;
        }

        // Validate URL parameter configuration
        if (useUrlParam && validParams.length === 0) {
            alert('Please add at least one URL parameter with name and value');
            return;
        }

        // Validate at least one authentication method is configured
        if (!useCookie && !useCustomHeader && !useUrlParam) {
            alert('Please enable at least one authentication method (Cookie, Custom Header, or URL Parameter)');
            return;
        }

        // Get realtime settings
        const enabledRealtime = this.realtimeToggle ? this.realtimeToggle.checked : true;
        const realtimeScope = this.realtimeScope ? this.realtimeScope.value.trim() : '';
        const filterStatic = this.filterStaticToggle ? this.filterStaticToggle.checked : true;

        // Save config with multi-header and multi-parameter structure
        this.authAnalyzer.config.useCookie = useCookie;
        this.authAnalyzer.config.cookieValue = cookieValue;
        this.authAnalyzer.config.useCustomHeader = useCustomHeader;
        this.authAnalyzer.config.customHeaders = validHeaders; // Array of headers
        this.authAnalyzer.config.useUrlParam = useUrlParam;
        this.authAnalyzer.config.urlParams = validParams; // Array of parameters
        this.authAnalyzer.config.enabledRealtime = enabledRealtime;
        this.authAnalyzer.config.realtimeScope = realtimeScope;
        this.authAnalyzer.config.filterStatic = filterStatic;

        // Backward compatibility: keep legacy single header fields for old code paths
        if (validHeaders.length > 0) {
            this.authAnalyzer.config.customHeaderName = validHeaders[0].name;
            this.authAnalyzer.config.customHeaderValue = validHeaders[0].value;
        }
        if (validParams.length > 0) {
            this.authAnalyzer.config.urlParamName = validParams[0].name;
            this.authAnalyzer.config.urlParamValue = validParams[0].value;
        }
        this.authAnalyzer.config.swapCookie = cookieValue || (validHeaders.length > 0 ? validHeaders[0].value : '');

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

    // Dynamic list methods for custom headers
    addCustomHeader(name = '', value = '') {
        const id = Date.now();
        this.customHeaders.push({ id, name, value });
        this.renderCustomHeaders();
    }

    removeCustomHeader(id) {
        this.customHeaders = this.customHeaders.filter(h => h.id !== id);
        this.renderCustomHeaders();
    }

    renderCustomHeaders() {
        if (!this.customHeadersList) return;

        this.customHeadersList.innerHTML = this.customHeaders.map(header => `
            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
                <input type="text" class="auth-config-input" placeholder="Header Name" value="${header.name}" 
                    style="flex: 1; min-height: 36px;" data-header-id="${header.id}" data-field="name">
                <input type="text" class="auth-config-input" placeholder="Header Value" value="${header.value}"
                    style="flex: 2; min-height: 36px;" data-header-id="${header.id}" data-field="value">
                <button type="button" data-header-id="${header.id}" 
                    style="padding: 6px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
            </div>
        `).join('');

        // Attach event listeners
        this.customHeadersList.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.headerId);
                const field = e.target.dataset.field;
                const header = this.customHeaders.find(h => h.id === id);
                if (header) header[field] = e.target.value;
            });
        });

        this.customHeadersList.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.headerId);
                this.removeCustomHeader(id);
            });
        });
    }

    // Dynamic list methods for URL parameters
    addUrlParam(name = '', value = '') {
        const id = Date.now();
        this.urlParams.push({ id, name, value });
        this.renderUrlParams();
    }

    removeUrlParam(id) {
        this.urlParams = this.urlParams.filter(p => p.id !== id);
        this.renderUrlParams();
    }

    renderUrlParams() {
        if (!this.urlParamsList) return;

        this.urlParamsList.innerHTML = this.urlParams.map(param => `
            <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start;">
                <input type="text" class="auth-config-input" placeholder="Param Name" value="${param.name}"
                    style="flex: 1; min-height: 36px;" data-param-id="${param.id}" data-field="name">
                <input type="text" class="auth-config-input" placeholder="Param Value" value="${param.value}"
                    style="flex: 1; min-height: 36px;" data-param-id="${param.id}" data-field="value">
                <button type="button" data-param-id="${param.id}"
                    style="padding: 6px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
            </div>
        `).join('');

        // Attach event listeners
        this.urlParamsList.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const id = parseInt(e.target.dataset.paramId);
                const field = e.target.dataset.field;
                const param = this.urlParams.find(p => p.id === id);
                if (param) param[field] = e.target.value;
            });
        });

        this.urlParamsList.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.paramId);
                this.removeUrlParam(id);
            });
        });
    }
}

let configPanelInstance = null;

export function initAuthAnalyzerConfigPanel(authAnalyzer) {
    if (!configPanelInstance) {
        configPanelInstance = new AuthAnalyzerConfigPanel(authAnalyzer);
    }
    return configPanelInstance;
}
