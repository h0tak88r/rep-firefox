// Storage for Auth Analyzer
// Saves and loads session configurations

/**
 * Handles persistence of Auth Analyzer sessions
 */
export class AuthAnalyzerStorage {
    constructor() {
        this.storageKey = 'rep_auth_analyzer_sessions';
        this.configKey = 'rep_auth_analyzer_config';
    }

    /**
     * Save sessions to localStorage
     */
    saveSessions(sessions) {
        try {
            const data = JSON.stringify(sessions);
            localStorage.setItem(this.storageKey, data);
            return true;
        } catch (error) {
            console.error('[Auth Analyzer] Failed to save sessions:', error);
            return false;
        }
    }

    /**
     * Load sessions from localStorage
     */
    loadSessions() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[Auth Analyzer] Failed to load sessions:', error);
            return [];
        }
    }

    /**
     * Save configuration
     */
    saveConfig(config) {
        try {
            const data = JSON.stringify(config);
            localStorage.setItem(this.configKey, data);
            return true;
        } catch (error) {
            console.error('[Auth Analyzer] Failed to save config:', error);
            return false;
        }
    }

    /**
     * Load configuration
     */
    loadConfig() {
        try {
            const data = localStorage.getItem(this.configKey);
            return data ? JSON.parse(data) : this.getDefaultConfig();
        } catch (error) {
            console.error('[Auth Analyzer] Failed to load config:', error);
            return this.getDefaultConfig();
        }
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            enabled: false,
            filters: {
                inScope: false,
                proxyOnly: false,
                excludeFileTypes: ['.css', '.js', '.jpg', '.png', '.gif', '.svg', '.woff', '.woff2'],
                excludeMethods: [],
                excludeStatusCodes: [],
                excludePaths: []
            }
        };
    }

    /**
     * Export sessions to file
     */
    exportToFile(sessions) {
        const data = JSON.stringify(sessions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auth-analyzer-sessions-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import sessions from file
     */
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Clear all data
     */
    clear() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.configKey);
    }
}
