// Auth Analyzer - Main Entry Point
// Authorization testing feature for rep+

import { Session, SessionManager, Parameter } from './session.js';
import { ParameterExtractor } from './extractor.js';
import { RequestReplayer } from './replayer.js';
import { ResponseComparator } from './comparator.js';
import { AuthAnalyzerStorage } from './storage.js';
import { events, EVENT_NAMES } from '../../core/events.js';

/**
 * Main Auth Analyzer controller
 */
export class AuthAnalyzer {
    constructor() {
        this.sessionManager = new SessionManager();
        this.extractor = new ParameterExtractor();
        this.replayer = new RequestReplayer();
        this.comparator = new ResponseComparator();
        this.storage = new AuthAnalyzerStorage();

        this.enabled = false;
        this.config = this.storage.loadConfig();
        this.results = []; // Array of test results

        // Load saved sessions
        this.loadSessions();
    }

    /**
     * Start Auth Analyzer
     */
    start() {
        this.enabled = true;
        this.config.enabled = true;
        this.storage.saveConfig(this.config);
        console.log('[Auth Analyzer] Started');
        events.emit('AUTH_ANALYZER_STARTED');
    }

    /**
     * Stop Auth Analyzer
     */
    stop() {
        this.enabled = false;
        this.config.enabled = false;
        this.storage.saveConfig(this.config);
        console.log('[Auth Analyzer] Stopped');
        events.emit('AUTH_ANALYZER_STOPPED');
    }

    /**
     * Process a captured request (simplified header swap mode)
     * @param {Object} request - The captured request
     * @param {Boolean} isAutomatic - Whether this was triggered automatically by realtime analysis
     */
    async processRequest(request, isAutomatic = false) {
        if (!this.enabled) {
            console.log('[Auth Analyzer] Skipped - not enabled');
            return;
        }

        // Check if at least one authentication method is configured
        const hasCookie = this.config.useCookie && this.config.cookieValue && this.config.cookieValue.trim() !== '' && this.config.cookieValue !== 'null';
        const hasCustomHeader = this.config.useCustomHeader && this.config.customHeaderName && this.config.customHeaderValue;
        const hasUrlParam = this.config.useUrlParam && this.config.urlParamName && this.config.urlParamValue;

        if (!hasCookie && !hasCustomHeader && !hasUrlParam) {
            console.log('[Auth Analyzer] Skipped - no valid authentication method configured (cookie, header, or URL param)');
            return;
        }

        // Realtime Analysis Checks
        if (isAutomatic) {
            // Check if realtime is enabled (default true if undefined)
            if (this.config.enabledRealtime === false) {
                console.log('[Auth Analyzer] Skipped - realtime analysis disabled');
                return;
            }

            // Check Scope
            if (this.config.realtimeScope && this.config.realtimeScope.trim() !== '') {
                const url = request.url || request.request?.url || '';
                const scope = this.config.realtimeScope.trim();
                try {
                    // Try regex first
                    const regex = new RegExp(scope, 'i');
                    if (!regex.test(url)) {
                        console.log('[Auth Analyzer] Skipped - URL does not match scope:', scope);
                        return;
                    }
                } catch (e) {
                    // Fallback to simple string includes
                    if (!url.toLowerCase().includes(scope.toLowerCase())) {
                        console.log('[Auth Analyzer] Skipped - URL does not match scope string:', scope);
                        return;
                    }
                }
            }
        }

        if (!request.response) {
            console.log('[Auth Analyzer] Skipped - no response yet for', request.url);
            return;
        }

        if (this.config.filterStatic !== false) {
            const isStatic = this.isStaticFile(request.url || request.request?.url);
            if (isStatic) {
                console.log('[Auth Analyzer] Skipped - static file:', request.url);
                return;
            }
        }

        // Apply filters
        if (!this.shouldProcess(request)) {
            console.log('[Auth Analyzer] Skipped by filters:', request.url);
            return;
        }

        console.log(`[Auth Analyzer] Testing: ${request.method} ${request.url || request.request?.url}`);

        // Debug: Log the entire request structure to see what we have
        console.log('[Auth Analyzer] Request structure:', {
            hasBody: !!request.body,
            bodyType: typeof request.body,
            bodyValue: request.body,
            hasRequestPostData: !!request.request?.postData,
            postDataText: request.request?.postData?.text,
            requestKeys: Object.keys(request),
            requestRequestKeys: request.request ? Object.keys(request.request) : null
        });

        // Get the request body properly
        let requestBody = null;
        if (request.body && typeof request.body === 'string') {
            requestBody = request.body;
            console.log('[Auth Analyzer] Using request.body (string):', requestBody?.substring(0, 100));
        } else if (request.request?.postData?.text) {
            requestBody = request.request.postData.text;
            console.log('[Auth Analyzer] Using request.request.postData.text:', requestBody?.substring(0, 100));
        } else if (request.body) {
            // Body exists but is not a string - might be an object that needs stringifying
            console.log('[Auth Analyzer] Body is object, type:', typeof request.body);
            requestBody = null; // Don't send objects
        }

        // Get headers in the correct format
        let requestHeaders = {};
        const rawHeaders = request.headers || request.request?.headers;

        if (Array.isArray(rawHeaders)) {
            // Headers are in HAR format: [{name: "Host", value: "example.com"}, ...]
            rawHeaders.forEach(header => {
                if (header.name && header.value) {
                    requestHeaders[header.name] = header.value;
                }
            });
        } else if (typeof rawHeaders === 'object') {
            // Headers are already in object format
            requestHeaders = { ...rawHeaders };
        }

        // Clone request with swapped cookie
        const cleanHeaders = { ...requestHeaders };

        // Remove existing cookie header case-insensitively to avoid duplicates
        Object.keys(cleanHeaders).forEach(key => {
            if (key.toLowerCase() === 'cookie') {
                delete cleanHeaders[key];
            }
        });

        // Sanitize user input (remove "Cookie:" prefix if pasted)
        let swapCookieValue = this.config.swapCookie;
        if (swapCookieValue) {
            // Remove "cookie:" prefix if present (case insensitive)
            swapCookieValue = swapCookieValue.replace(/^(cookie|authorization):\s*/i, '');
        }

        const swappedRequest = {
            url: request.url || request.request?.url,
            method: request.method || request.request?.method,
            headers: cleanHeaders, // Don't add Cookie here - session building will handle it
            body: requestBody
        };

        console.log('[Auth Analyzer] Swapped request:', {
            url: swappedRequest.url,
            method: swappedRequest.method,
            bodyType: swappedRequest.body === null ? 'null' : swappedRequest.body === undefined ? 'undefined' : typeof swappedRequest.body,
            bodyPreview: swappedRequest.body?.substring(0, 100)
        });

        try {
            // Build session headers from configuration (supports both cookie AND custom headers)
            let sessionHeaders = {};
            let headersToRemove = [];

            // Apply cookie if configured
            if (this.config.useCookie && this.config.cookieValue) {
                const cookieValue = this.config.cookieValue.trim();
                // Remove "Cookie:" prefix if pasted
                const cleanCookieValue = cookieValue.replace(/^cookie:\s*/i, '');
                sessionHeaders['Cookie'] = cleanCookieValue;
                headersToRemove.push('Cookie');
                console.log('[Auth Analyzer] Adding session cookie');
            }

            // Apply custom header if configured
            if (this.config.useCustomHeader && this.config.customHeaderName && this.config.customHeaderValue) {
                const headerName = this.config.customHeaderName.trim();
                let headerValue = this.config.customHeaderValue.trim();

                // Special handling for Authorization header
                if (headerName.toLowerCase() === 'authorization') {
                    // Remove "Authorization:" prefix if pasted
                    headerValue = headerValue.replace(/^authorization:\s*/i, '');
                    // Auto-add "Bearer " prefix if it looks like a JWT token without it
                    if (!headerValue.startsWith('Bearer ') && headerValue.match(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
                        headerValue = `Bearer ${headerValue}`;
                    }
                }

                sessionHeaders[headerName] = headerValue;
                headersToRemove.push(headerName);
                console.log(`[Auth Analyzer] Adding custom header: ${headerName}`);
            }

            // Apply URL parameter swaps if configured (supports multiple parameters)
            if (this.config.useUrlParam) {
                const urlParams = this.config.urlParams || [];

                if (urlParams.length > 0) {
                    try {
                        const url = new URL(swappedRequest.url);

                        // Process each URL parameter - only replace if it exists in original URL
                        urlParams.forEach(param => {
                            if (param.name && param.value) {
                                const paramName = param.name.trim();
                                const paramValue = param.value.trim();

                                // Only replace if the parameter already exists in the original URL
                                if (url.searchParams.has(paramName)) {
                                    url.searchParams.set(paramName, paramValue);
                                    console.log(`[Auth Analyzer] Swapped URL parameter ${paramName} = ${paramValue}`);
                                } else {
                                    console.log(`[Auth Analyzer] Skipping parameter ${paramName} - not found in original URL`);
                                }
                            }
                        });

                        swappedRequest.url = url.toString();
                    } catch (error) {
                        console.error('[Auth Analyzer] Failed to swap URL parameters:', error);
                    }
                }
            }

            // Validate at least one authentication method is configured
            if (Object.keys(sessionHeaders).length === 0 && !this.config.useUrlParam) {
                console.warn('[Auth Analyzer] No headers configured, skipping analysis');
                return;
            }

            // Replay with swapped headers
            console.log('[Auth Analyzer] Calling replayer with session:', {
                sessionHeadersApplied: Object.keys(sessionHeaders),
                sessionHeaders
            });

            const swappedResponse = await this.replayer.replayWithSession(swappedRequest, {
                headers: sessionHeaders,
                headersToRemove: headersToRemove,
                parameters: [],
                testCORS: false,
                dropOriginal: false
            });

            // Compare responses
            // Construct original response object from captured data
            const originalResponse = {
                status: request.responseStatus || request.response?.status || 0,
                statusText: request.response?.statusText || '',
                body: request.responseBody || request.response?.body || '',
                headers: request.response?.headers || []
            };

            console.log('[Auth Analyzer] Original response:', {
                status: originalResponse.status,
                bodyLength: originalResponse.body?.length || 0,
                bodyPreview: (originalResponse.body || '').substring(0, 100)
            });

            const comparison = this.comparator.compare(originalResponse, swappedResponse);

            // Store result with comparison
            const result = {
                id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: Date.now(),
                originalRequest: request,
                originalResponse,  // Store the constructed response
                swappedResponse,
                comparison,
                // Swapped request details for debugging/export
                swappedRequest: {
                    url: swappedRequest.url,
                    method: swappedRequest.method,
                    headers: sessionHeaders
                }
            };

            this.results.push(result);

            // Attach comparison to original request for UI display
            request.authComparison = comparison;

            const requestUrl = request.url || request.request?.url || 'unknown';
            console.log(`[Auth Analyzer] ${requestUrl}: ${comparison}`);

            // Emit event for UI update - force full re-render
            console.log('[Auth Analyzer] =====> Emitting AUTH_ANALYZER_RESULT event');
            console.log('[Auth Analyzer] Event payload:', { id: result.id, comparison: result.comparison, url: requestUrl });
            events.emit('AUTH_ANALYZER_RESULT', result);
            console.log('[Auth Analyzer] Event emitted successfully');

            // Import and call renderRequestList to force UI update
            import('../../ui/request-list.js').then(({ renderRequestList }) => {
                renderRequestList();
            });

            // Add the swapped request/response as a new entry in the request history
            import('../../core/state/index.js').then(({ addRequest }) => {
                // Merge original headers with swapped auth headers
                const originalHeaders = request.headers || request.request?.headers || {};

                // Convert headers to array format - could be object or array
                let headersArray;
                if (Array.isArray(originalHeaders)) {
                    headersArray = originalHeaders;
                } else if (typeof originalHeaders === 'object') {
                    // Convert object to array of {name, value} pairs
                    headersArray = Object.entries(originalHeaders).map(([name, value]) => ({ name, value }));
                } else {
                    headersArray = [];
                }

                const mergedHeaders = [...headersArray];

                // Add/replace with swapped auth headers
                Object.entries(sessionHeaders).forEach(([name, value]) => {
                    const existingIndex = mergedHeaders.findIndex(h => h.name && h.name.toLowerCase() === name.toLowerCase());
                    if (existingIndex >= 0) {
                        mergedHeaders[existingIndex] = { name, value };
                    } else {
                        mergedHeaders.push({ name, value });
                    }
                });

                const syntheticRequest = {
                    id: `swapped_${result.id}`,
                    url: swappedRequest.url,
                    method: swappedRequest.method,
                    timestamp: Date.now(),
                    request: {
                        url: swappedRequest.url,
                        method: swappedRequest.method,
                        headers: mergedHeaders,
                        body: swappedRequest.body || null,
                        postData: swappedRequest.body ? {
                            mimeType: request.request?.postData?.mimeType || 'application/x-www-form-urlencoded',
                            text: swappedRequest.body
                        } : null
                    },
                    response: {
                        status: swappedResponse.status,
                        statusText: swappedResponse.statusText || '',
                        headers: swappedResponse.headers || [],
                        body: swappedResponse.body || ''
                    },
                    responseStatus: swappedResponse.status,
                    responseBody: swappedResponse.body || '',
                    // Mark as swapped for visual indication
                    isSwapped: true,
                    authComparison: comparison
                };

                // Add to state
                addRequest(syntheticRequest);

                // Select and display the new request
                import('../../core/state/index.js').then((stateModule) => {
                    stateModule.state.selectedRequest = syntheticRequest;
                    // Trigger UI update
                    import('../../ui/request-list.js').then(({ renderRequestList }) => renderRequestList());
                });
            });

            return result;
        } catch (error) {
            const requestUrl = request.url || request.request?.url || 'unknown';
            console.error(`[Auth Analyzer] Error testing ${requestUrl}:`, error);
        }
    }

    /**
     * Extract parameters from response for a session
     */
    async extractParameters(response, session) {
        for (const param of session.parameters) {
            if (param.extractionType === 'static') {
                // Static values don't need extraction
                continue;
            }

            if (param.extractionType === 'prompt') {
                // Prompt will be handled by UI
                continue;
            }

            const value = this.extractor.extract(response, param);
            if (value) {
                param.setValue(value);
                console.log(`[Auth Analyzer] Extracted ${param.name} = ${value} for ${session.name}`);
            }
        }

        // Save updated session
        this.saveSessions();
    }

    /**
     * Check if URL is a static file based on extension
     */
    isStaticFile(url) {
        if (!url) return false;

        const staticExtensions = [
            // Scripts
            'js', 'mjs', 'jsx',
            // Stylesheets
            'css', 'scss', 'sass', 'less',
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff',
            // Fonts
            'woff', 'woff2', 'ttf', 'otf', 'eot',
            // Media
            'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac',
            // Documents (optional - comment out if you want to analyze these)
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            // Archives
            'zip', 'rar', 'tar', 'gz', '7z',
            // Source maps
            'map'
        ];

        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const extension = pathname.split('.').pop();

            return staticExtensions.includes(extension);
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if URL is a static file based on extension
     */
    isStaticFile(url) {
        if (!url) return false;

        const staticExtensions = [
            // Scripts
            'js', 'mjs', 'jsx',
            // Stylesheets
            'css', 'scss', 'sass', 'less',
            // Images
            'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff',
            // Fonts
            'woff', 'woff2', 'ttf', 'otf', 'eot',
            // Media
            'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac',
            // Documents.
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            // Archives
            'zip', 'rar', 'tar', 'gz', '7z',
            // Source maps
            'map'
        ];

        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            const extension = pathname.split('.').pop();

            return staticExtensions.includes(extension);
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if request should be processed
     */
    shouldProcess(request) {
        const { filters } = this.config;

        // Get URL safely
        const url = request.url || request.request?.url;
        if (!url) {
            console.log('[Auth Analyzer] Skipped - no URL found');
            return false;
        }

        // Check file type
        if (filters.excludeFileTypes && filters.excludeFileTypes.length > 0) {
            const urlLower = url.toLowerCase();
            for (const ext of filters.excludeFileTypes) {
                if (urlLower.endsWith(ext) || urlLower.includes(ext + '?')) {
                    return false;
                }
            }
        }

        // Check HTTP method
        const method = request.method || request.request?.method;
        if (filters.excludeMethods && method && filters.excludeMethods.includes(method)) {
            return false;
        }

        // Check status code
        if (filters.excludeStatusCodes && request.response) {
            if (filters.excludeStatusCodes.includes(request.response.status)) {
                return false;
            }
        }

        // Check path
        if (filters.excludePaths && filters.excludePaths.length > 0) {
            try {
                const urlObj = new URL(url);
                for (const path of filters.excludePaths) {
                    if (urlObj.pathname.includes(path)) {
                        return false;
                    }
                }
            } catch (e) {
                console.warn('[Auth Analyzer] Invalid URL:', url);
                return false;
            }
        }

        return true;
    }

    /**
     * Add a new session
     */
    addSession(session) {
        this.sessionManager.addSession(session);
        this.saveSessions();
        events.emit('AUTH_ANALYZER_SESSION_ADDED', session);
    }

    /**
     * Remove a session
     */
    removeSession(sessionId) {
        this.sessionManager.removeSession(sessionId);
        this.saveSessions();
        events.emit('AUTH_ANALYZER_SESSION_REMOVED', sessionId);
    }

    /**
     * Update a session
     */
    updateSession(session) {
        this.saveSessions();
        events.emit('AUTH_ANALYZER_SESSION_UPDATED', session);
    }

    /**
     * Toggle session active state
     */
    toggleSession(sessionId) {
        this.sessionManager.toggleSession(sessionId);
        this.saveSessions();
        events.emit('AUTH_ANALYZER_SESSION_TOGGLED', sessionId);
    }

    /**
     * Save sessions to storage
     */
    saveSessions() {
        const data = this.sessionManager.toJSON();
        this.storage.saveSessions(data);
    }

    /**
     * Load sessions from storage
     */
    loadSessions() {
        const data = this.storage.loadSessions();
        this.sessionManager.fromJSON(data);
    }

    /**
     * Clear all results
     */
    clearResults() {
        this.results = [];
        events.emit('AUTH_ANALYZER_RESULTS_CLEARED');
    }

    /**
     * Export sessions to file
     */
    exportSessions() {
        const data = this.sessionManager.toJSON();
        this.storage.exportToFile(data);
    }

    /**
     * Import sessions from file
     */
    async importSessions(file) {
        try {
            const data = await this.storage.importFromFile(file);
            this.sessionManager.fromJSON(data);
            this.saveSessions();
            events.emit('AUTH_ANALYZER_SESSIONS_IMPORTED');
            return true;
        } catch (error) {
            console.error('[Auth Analyzer] Import failed:', error);
            return false;
        }
    }
}

// Global instance
let authAnalyzerInstance = null;

/**
 * Initialize Auth Analyzer
 */
export function initAuthAnalyzer() {
    if (!authAnalyzerInstance) {
        authAnalyzerInstance = new AuthAnalyzer();

        // Listen for captured requests
        events.on(EVENT_NAMES.NETWORK_RESPONSE_RECEIVED, (request) => {
            console.log('[Auth Analyzer] RESPONSE_RECEIVED event:', {
                url: request.url,
                hasResponse: !!request.response,
                enabled: authAnalyzerInstance.enabled,
                hasCookie: !!authAnalyzerInstance.config.swapCookie
            });

            if (authAnalyzerInstance.enabled && request.response) {
                // Pass true for isAutomatic to enable realtime checks
                authAnalyzerInstance.processRequest(request, true);
            }
        });

        console.log('[Auth Analyzer] Event listener registered for NETWORK_RESPONSE_RECEIVED');
    }

    return authAnalyzerInstance;
}

/**
 * Get Auth Analyzer instance
 */
export function getAuthAnalyzer() {
    return authAnalyzerInstance;
}

// Export classes for testing
export { Session, SessionManager, Parameter };
