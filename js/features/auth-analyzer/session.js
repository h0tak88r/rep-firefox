// Session Management for Auth Analyzer
// Manages user sessions with auto-extraction and parameter replacement

/**
 * Represents a user session for authorization testing
 */
export class Session {
    constructor(name, color = '#4CAF50') {
        this.id = this.generateId();
        this.name = name; // e.g., "Admin", "User", "Guest"
        this.color = color; // Visual indicator
        this.active = true;
        this.parameters = []; // Array of Parameter objects
        this.headers = {}; // Headers to add/replace
        this.headersToRemove = []; // Headers to remove
        this.dropOriginal = false; // For idempotent operations
        this.testCORS = false;
        this.privilege = 'low'; // 'high', 'medium', 'low' for bypass detection
    }

    generateId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add a parameter to this session
     */
    addParameter(parameter) {
        this.parameters.push(parameter);
    }

    /**
     * Remove a parameter by name
     */
    removeParameter(name) {
        this.parameters = this.parameters.filter(p => p.name !== name);
    }

    /**
     * Get parameter by name
     */
    getParameter(name) {
        return this.parameters.find(p => p.name === name);
    }

    /**
     * Clone this session
     */
    clone(newName) {
        const cloned = new Session(newName || `${this.name} (Copy)`, this.color);
        cloned.active = this.active;
        cloned.headers = { ...this.headers };
        cloned.headersToRemove = [...this.headersToRemove];
        cloned.dropOriginal = this.dropOriginal;
        cloned.testCORS = this.testCORS;
        cloned.privilege = this.privilege;
        cloned.parameters = this.parameters.map(p => p.clone());
        return cloned;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            active: this.active,
            parameters: this.parameters.map(p => p.toJSON()),
            headers: this.headers,
            headersToRemove: this.headersToRemove,
            dropOriginal: this.dropOriginal,
            testCORS: this.testCORS,
            privilege: this.privilege
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        const session = new Session(data.name, data.color);
        session.id = data.id;
        session.active = data.active;
        session.headers = data.headers || {};
        session.headersToRemove = data.headersToRemove || [];
        session.dropOriginal = data.dropOriginal || false;
        session.testCORS = data.testCORS || false;
        session.privilege = data.privilege || 'low';
        session.parameters = (data.parameters || []).map(p => Parameter.fromJSON(p));
        return session;
    }
}

/**
 * Represents a parameter to extract and replace
 */
export class Parameter {
    constructor(name, extractionType = 'auto') {
        this.name = name;
        this.extractionType = extractionType; // 'auto', 'fromTo', 'static', 'prompt'
        this.value = null;
        this.lastExtracted = null; // Timestamp of last extraction

        // Auto extraction settings
        this.extractFrom = {
            cookie: true,
            htmlInput: true,
            json: true
        };

        // From-To string extraction
        this.fromToString = {
            from: '',
            to: '',
            extractFromHeader: true,
            extractFromBody: true
        };

        // Static value
        this.staticValue = '';

        // Replacement settings
        this.replaceIn = {
            path: true,
            urlParam: true,
            cookie: true,
            body: true,
            json: true,
            header: false // For Authorization: Bearer {token}
        };

        this.remove = false; // For CSRF testing
    }

    /**
     * Set the parameter value
     */
    setValue(value) {
        this.value = value;
        this.lastExtracted = Date.now();
    }

    /**
     * Clone this parameter
     */
    clone() {
        const cloned = new Parameter(this.name, this.extractionType);
        cloned.value = this.value;
        cloned.lastExtracted = this.lastExtracted;
        cloned.extractFrom = { ...this.extractFrom };
        cloned.fromToString = { ...this.fromToString };
        cloned.staticValue = this.staticValue;
        cloned.replaceIn = { ...this.replaceIn };
        cloned.remove = this.remove;
        return cloned;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            name: this.name,
            extractionType: this.extractionType,
            value: this.value,
            lastExtracted: this.lastExtracted,
            extractFrom: this.extractFrom,
            fromToString: this.fromToString,
            staticValue: this.staticValue,
            replaceIn: this.replaceIn,
            remove: this.remove
        };
    }

    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        const param = new Parameter(data.name, data.extractionType);
        param.value = data.value;
        param.lastExtracted = data.lastExtracted;
        param.extractFrom = data.extractFrom || { cookie: true, htmlInput: true, json: true };
        param.fromToString = data.fromToString || { from: '', to: '', extractFromHeader: true, extractFromBody: true };
        param.staticValue = data.staticValue || '';
        param.replaceIn = data.replaceIn || { path: true, urlParam: true, cookie: true, body: true, json: true, header: false };
        param.remove = data.remove || false;
        return param;
    }
}

/**
 * Session Manager - manages all sessions
 */
export class SessionManager {
    constructor() {
        this.sessions = [];
        this.activeSessionIds = new Set();
    }

    /**
     * Add a new session
     */
    addSession(session) {
        this.sessions.push(session);
        if (session.active) {
            this.activeSessionIds.add(session.id);
        }
    }

    /**
     * Remove a session
     */
    removeSession(sessionId) {
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.activeSessionIds.delete(sessionId);
    }

    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.find(s => s.id === sessionId);
    }

    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return this.sessions.filter(s => s.active);
    }

    /**
     * Toggle session active state
     */
    toggleSession(sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
            session.active = !session.active;
            if (session.active) {
                this.activeSessionIds.add(sessionId);
            } else {
                this.activeSessionIds.delete(sessionId);
            }
        }
    }

    /**
     * Serialize all sessions
     */
    toJSON() {
        return this.sessions.map(s => s.toJSON());
    }

    /**
     * Deserialize sessions
     */
    fromJSON(data) {
        this.sessions = data.map(s => Session.fromJSON(s));
        this.activeSessionIds = new Set(
            this.sessions.filter(s => s.active).map(s => s.id)
        );
    }
}
