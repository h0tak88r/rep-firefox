// Parameter Extraction Engine for Auth Analyzer
// Auto-extracts parameter values from HTTP responses

/**
 * Extracts parameter values from responses
 */
export class ParameterExtractor {
    /**
     * Extract parameter value from response based on parameter settings
     */
    extract(response, parameter) {
        if (parameter.extractionType === 'static') {
            return parameter.staticValue;
        }

        if (parameter.extractionType === 'prompt') {
            // Will be handled by UI
            return null;
        }

        if (parameter.extractionType === 'auto') {
            return this.autoExtract(response, parameter);
        }

        if (parameter.extractionType === 'fromTo') {
            return this.fromToExtract(response, parameter);
        }

        return null;
    }

    /**
     * Auto-extract from cookies, HTML inputs, or JSON
     */
    autoExtract(response, parameter) {
        const paramName = parameter.name;

        // Try cookie extraction
        if (parameter.extractFrom.cookie) {
            const cookieValue = this.extractFromCookie(response, paramName);
            if (cookieValue) return cookieValue;
        }

        // Try HTML input extraction
        if (parameter.extractFrom.htmlInput) {
            const htmlValue = this.extractFromHTML(response, paramName);
            if (htmlValue) return htmlValue;
        }

        // Try JSON extraction
        if (parameter.extractFrom.json) {
            const jsonValue = this.extractFromJSON(response, paramName);
            if (jsonValue) return jsonValue;
        }

        return null;
    }

    /**
     * Extract from Set-Cookie header
     */
    extractFromCookie(response, paramName) {
        if (!response.headers) return null;

        // Find Set-Cookie header
        const setCookieHeader = response.headers.find(h =>
            h.name.toLowerCase() === 'set-cookie'
        );

        if (!setCookieHeader) return null;

        // Parse cookie: "sessionId=abc123; Path=/; HttpOnly"
        const cookieRegex = new RegExp(`${paramName}=([^;]+)`, 'i');
        const match = setCookieHeader.value.match(cookieRegex);

        return match ? match[1] : null;
    }

    /**
     * Extract from HTML input field
     */
    extractFromHTML(response, paramName) {
        if (!response.body || typeof response.body !== 'string') return null;

        const body = response.body.toLowerCase();
        if (!body.includes('<input')) return null;

        // Match: <input name="csrf" value="abc123">
        const inputRegex = new RegExp(
            `<input[^>]*name=["']${paramName}["'][^>]*value=["']([^"']+)["']`,
            'i'
        );
        let match = body.match(inputRegex);

        if (!match) {
            // Try reverse order: <input value="abc123" name="csrf">
            const reverseRegex = new RegExp(
                `<input[^>]*value=["']([^"']+)["'][^>]*name=["']${paramName}["']`,
                'i'
            );
            match = body.match(reverseRegex);
        }

        return match ? match[1] : null;
    }

    /**
     * Extract from JSON response
     */
    extractFromJSON(response, paramName) {
        if (!response.body || typeof response.body !== 'string') return null;

        try {
            const json = JSON.parse(response.body);
            return this.findInJSON(json, paramName);
        } catch (e) {
            // Not valid JSON
            return null;
        }
    }

    /**
     * Recursively search for key in JSON object
     */
    findInJSON(obj, key) {
        if (obj === null || typeof obj !== 'object') return null;

        // Direct match
        if (obj.hasOwnProperty(key)) {
            return obj[key];
        }

        // Recursive search
        for (const k in obj) {
            if (typeof obj[k] === 'object') {
                const result = this.findInJSON(obj[k], key);
                if (result !== null) return result;
            }
        }

        return null;
    }

    /**
     * Extract value between two strings
     */
    fromToExtract(response, parameter) {
        const { from, to, extractFromHeader, extractFromBody } = parameter.fromToString;

        if (!from || !to) return null;

        let text = '';

        // Extract from headers
        if (extractFromHeader && response.headers) {
            text += response.headers.map(h => `${h.name}: ${h.value}`).join('\n');
        }

        // Extract from body
        if (extractFromBody && response.body) {
            text += '\n' + response.body;
        }

        // Find value between from and to strings
        const fromIndex = text.indexOf(from);
        if (fromIndex === -1) return null;

        const startIndex = fromIndex + from.length;
        const toIndex = text.indexOf(to, startIndex);
        if (toIndex === -1) return null;

        return text.substring(startIndex, toIndex).trim();
    }
}
