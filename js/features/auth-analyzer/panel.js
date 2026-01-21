/**
 * Auth Analyzer Results Panel UI
 * Displays test results in an expandable table
 */

import { events, EVENT_NAMES } from '../../core/events.js';
import { state } from '../../core/state.js';
import { escapeHtml } from '../../core/utils/dom.js';

export class AuthAnalyzerPanel {
    constructor() {
        this.panel = null;
        this.results = [];
    }

    /**
     * Initialize the panel
     */
    init() {
        this.createPanel();
        this.attachEventListeners();
        this.loadExistingResults();
    }

    /**
     * Load existing results from state
     */
    loadExistingResults() {
        if (!state.requests || state.requests.length === 0) return;

        console.log('[Auth Panel] Loading existing results...');
        let count = 0;

        state.requests.forEach(request => {
            if (request.authComparison) {
                // Check if result already exists to avoid duplicates
                const exists = this.results.some(r => r.id === request.id);
                if (exists) return;

                const result = {
                    id: request.id,
                    timestamp: Date.now(),
                    originalRequest: request,
                    swappedResponse: request.authSwappedResponse || {},
                    comparison: request.authComparison
                };

                this.results.push(result);
                count++;
            }
        });

        if (count > 0) {
            console.log(`[Auth Panel] Loaded ${count} existing results`);
            this.render();
            this.updateBadge();
        }
    }

    /**
     * Create the panel DOM
     */
    createPanel() {
        // Create panel
        this.panel = document.createElement('div');
        this.panel.id = 'auth-analyzer-panel';
        this.panel.className = 'side-panel';
        this.panel.innerHTML = `
            <div class="side-panel-header">
                <h3>🔒 Auth Analyzer Results</h3>
                <div style="display: flex; gap: 8px;">
                    <button id="auth-panel-config-btn" class="icon-btn" title="Configuration" style="color: var(--text-secondary); padding: 4px;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L4.04 9.43c-.11.2-.06.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.11-.2.06-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                        </svg>
                    </button>
                    <button id="auth-panel-close-btn" class="close-btn">×</button>
                </div>
            </div>
            <div id="auth-panel-dashboard" style="padding: 12px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-around; font-size: 11px;">
                <div style="text-align: center;">
                    <div id="auth-count-same" style="font-size: 20px; font-weight: bold; color: #f44336;">0</div>
                    <div style="color: var(--text-secondary);">SAME (Critical)</div>
                </div>
                <div style="text-align: center;">
                    <div id="auth-count-similar" style="font-size: 20px; font-weight: bold; color: #ff9800;">0</div>
                    <div style="color: var(--text-secondary);">SIMILAR (Warning)</div>
                </div>
                <div style="text-align: center;">
                    <div id="auth-count-different" style="font-size: 20px; font-weight: bold; color: #4caf50;">0</div>
                    <div style="color: var(--text-secondary);">DIFFERENT (OK)</div>
                </div>
            </div>
            <div class="side-panel-content" id="auth-panel-content" style="overflow-y: auto;">
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    No results yet. Auth Analyzer will test requests as they're captured.
                </div>
            </div>
        `;

        // Append to body
        document.body.appendChild(this.panel);

        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'auth-panel-resize-handle';
        this.panel.appendChild(resizeHandle); // Append to panel so it moves with it

        // Resize Logic
        let isResizing = false;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
            resizeHandle.classList.add('active');
            e.preventDefault(); // Prevent text selection
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            // Calculate new width: Window Width - Mouse X
            // (Since panel is anchored to the right)
            const newWidth = window.innerWidth - e.clientX;

            // Constraints
            if (newWidth > 300 && newWidth < window.innerWidth - 50) {
                this.panel.style.width = `${newWidth}px`;
                // Update main content margin if necessary (optional, depending on overlap preference)
                // document.body.style.setProperty('--auth-panel-width', `${newWidth}px`);
                localStorage.setItem('rep_auth_panel_width', newWidth);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                resizeHandle.classList.remove('active');
            }
        });

        // Restore saved width
        const savedWidth = localStorage.getItem('rep_auth_panel_width');
        if (savedWidth) {
            this.panel.style.width = `${savedWidth}px`;
        }

        // Close button handler
        const closeBtn = this.panel.querySelector('#auth-panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Config button handler
        const configBtn = this.panel.querySelector('#auth-panel-config-btn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                if (this.configPanel) {
                    this.configPanel.show();
                } else {
                    console.warn('[Auth Panel] Config panel not linked');
                }
            });
        }
    }

    /**
     * Link configuration panel
     */
    setConfigPanel(configPanel) {
        this.configPanel = configPanel;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Listen for Auth Analyzer results
        events.on('AUTH_ANALYZER_RESULT', (result) => {
            console.log('[Auth Panel] Received AUTH_ANALYZER_RESULT:', result);
            this.addResult(result);
        });

        // Listen for clear requests
        events.on(EVENT_NAMES.STATE_REQUESTS_CLEARED, () => {
            console.log('[Auth Panel] Requests cleared, resetting panel');
            this.clearResults();
        });
    }

    /**
     * Show the panel
     */
    show() {
        if (this.panel) {
            this.panel.classList.add('visible');
        }
    }

    /**
     * Hide the panel
     */
    hide() {
        if (this.panel) {
            this.panel.classList.remove('visible');
        }
    }

    /**
     * Toggle panel visibility
     */
    toggle() {
        if (this.panel) {
            const isVisible = this.panel.classList.contains('visible');
            if (isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
    }

    /**
     * Add a result
     */
    addResult(result) {
        console.log('[Auth Panel] Adding result to panel:', {
            id: result.id,
            comparison: result.comparison,
            totalResults: this.results.length + 1
        });

        this.results.push(result);
        this.render();
        this.updateBadge();

        // Auto-show panel for critical findings
        if (result.comparison === 'SAME') {
            this.show();
        }
    }

    /**
     * Clear all results
     */
    clearResults() {
        this.results = [];
        this.render();
        this.updateBadge();
    }

    /**
     * Render results
     */
    render() {
        const container = document.getElementById('auth-panel-content');
        if (!container) return;

        // Update dashboard
        const counts = {
            'SAME': 0,
            'SIMILAR': 0,
            'DIFFERENT': 0
        };

        this.results.forEach(r => {
            counts[r.comparison] = (counts[r.comparison] || 0) + 1;
        });

        document.getElementById('auth-count-same').textContent = counts['SAME'];
        document.getElementById('auth-count-similar').textContent = counts['SIMILAR'];
        document.getElementById('auth-count-different').textContent = counts['DIFFERENT'];

        // Render table
        if (this.results.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    No results yet. Auth Analyzer will test requests as they're captured.
                </div>
            `;
            return;
        }

        // Sorting: SAME > SIMILAR > DIFFERENT, then by timestamp (newest first)
        const severityWeight = { 'SAME': 3, 'SIMILAR': 2, 'DIFFERENT': 1, 'ERROR': 0 };
        const sortedResults = [...this.results].sort((a, b) => {
            const weightA = severityWeight[a.comparison] || 0;
            const weightB = severityWeight[b.comparison] || 0;

            if (weightA !== weightB) {
                return weightB - weightA; // Higher weight first
            }
            return b.timestamp - a.timestamp; // Newest first
        });

        let html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: var(--bg-secondary); position: sticky; top: 0;">
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--border-color);">Method</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--border-color);">URL</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--border-color);">Orig</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--border-color);">Swap</th>
                        <th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--border-color);">Result</th>
                    </tr>
                </thead>
                <tbody id="auth-results-tbody">
        `;

        sortedResults.forEach((result, sortIdx) => {
            const idx = this.results.indexOf(result);

            const req = result.originalRequest;
            const method = req.method || req.request?.method || 'GET';
            const url = req.url || req.request?.url || '';
            const origStatus = req.response?.status || req.responseStatus || '?';
            const swapStatus = result.swappedResponse?.status || '?';
            const comp = result.comparison;

            const displayUrl = url.length > 50 ? url.substring(0, 50) + '...' : url;

            const colors = { 'SAME': '#f44336', 'SIMILAR': '#ff9800', 'DIFFERENT': '#4caf50' };
            const color = colors[comp] || '#999';

            const methodColors = { 'GET': '#4caf50', 'POST': '#2196f3', 'PUT': '#ff9800', 'DELETE': '#f44336' }[method] || '#757575';

            html += `
                <tr class="auth-row" data-idx="${idx}" style="border-bottom: 1px solid var(--border-color); cursor: pointer;">
                    <td style="padding: 6px 8px;">
                        <span style="background: ${methodColors}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600;">${method}</span>
                    </td>
                    <td style="padding: 6px 8px; font-family: monospace; font-size: 10px;" title="${escapeHtml(url)}">${escapeHtml(displayUrl)}</td>
                    <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-size: 11px;">${origStatus}</td>
                    <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-size: 11px;">${swapStatus}</td>
                    <td style="padding: 6px 8px; text-align: center;">
                        <span style="color: ${color}; font-weight: 600; font-size: 11px;">${comp}</span>
                    </td>
                </tr>
                <tr class="auth-details" id="details-${idx}" style="display: none;">
                    <td colspan="5" style="padding: 12px; background: var(--bg-hover); border-bottom: 2px solid var(--border-color);">
                        
                        <!-- Full URL Display -->
                        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                            <div style="font-weight: 600; margin-bottom: 4px; font-size: 11px; color: var(--text-secondary);">Request URL</div>
                            <div style="font-family: monospace; word-break: break-all; background: var(--bg-primary); padding: 8px; border-radius: 4px; font-size: 11px; user-select: text; border: 1px solid var(--border-color);">${escapeHtml(url)}</div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 8px;">Original (Your Session)</div>
                                <div style="background: var(--bg-primary); padding: 8px; border-radius: 4px; border-left: 3px solid ${color};">
                                    <div style="margin-bottom: 4px;"><strong>Status:</strong> ${origStatus}</div>
                                    <div style="margin-bottom: 8px;"><strong>Body:</strong></div>
                                    <pre style="margin: 0; font-size: 10px; max-height: 200px; overflow: auto; white-space: pre-wrap;">${escapeHtml((req.response?.body || '').substring(0, 500))}</pre>
                                </div>
                            </div>
                            <div>
                                <div style="font-weight: 600; margin-bottom: 8px;">Swapped (Test Session)</div>
                                <div style="background: var(--bg-primary); padding: 8px; border-radius: 4px; border-left: 3px solid ${color};">
                                    <div style="margin-bottom: 4px;"><strong>Status:</strong> ${swapStatus}</div>
                                    <div style="margin-bottom: 8px;"><strong>Body:</strong></div>
                                    <pre style="margin: 0; font-size: 10px; max-height: 200px; overflow: auto; white-space: pre-wrap;">${escapeHtml((result.swappedResponse?.body || '').substring(0, 500))}</pre>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 12px; padding: 8px; background: ${color}20; border-radius: 4px; font-size: 11px;">
                            ${comp === 'SAME' ? '⚠️ <strong>Auth Bypass!</strong> Responses identical.' :
                    comp === 'SIMILAR' ? '⚠️ <strong>Review needed.</strong> Responses similar.' :
                        '✓ Responses different - auth enforced.'}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Attach expand handlers
        const rows = container.querySelectorAll('.auth-row');
        rows.forEach(row => {
            row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-hover)');
            row.addEventListener('mouseleave', () => row.style.background = '');

            row.addEventListener('click', () => {
                const idx = row.dataset.idx;
                const details = document.getElementById(`details-${idx}`);
                if (details) {
                    const vis = details.style.display !== 'none';
                    container.querySelectorAll('.auth-details').forEach(d => d.style.display = 'none');
                    details.style.display = vis ? 'none' : 'table-row';
                }
            });
        });
    }

    /**
     * Update badge
     */
    updateBadge() {
        const btn = document.getElementById('auth-analyzer-toggle');
        if (!btn) return;

        const critical = this.getCriticalCount();
        const badge = btn.querySelector('.badge');

        if (critical > 0) {
            if (badge) {
                badge.textContent = critical;
                badge.style.display = 'inline-block';
            }
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Get count of critical findings
     */
    getCriticalCount() {
        return this.results.filter(r => r.comparison === 'SAME').length;
    }

    /**
     * Check if panel is visible
     */
    isVisible() {
        return this.panel && this.panel.classList.contains('visible');
    }
}

let panelInstance = null;

export function initAuthAnalyzerPanel() {
    if (!panelInstance) {
        panelInstance = new AuthAnalyzerPanel();
        panelInstance.init();
    }
    return panelInstance;
}
