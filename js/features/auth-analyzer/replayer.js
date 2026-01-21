// Request Replayer for Auth Analyzer
// Replays requests with different sessions

import { ParameterExtractor } from './extractor.js';
import { parseRequest } from '../../network/capture.js';
import { sendRequest } from '../../network/request-sender.js';

/**
 * Replays HTTP requests with modified sessions
 */
export class RequestReplayer {
    constructor() {
        this.extractor = new ParameterExtractor();
    }

    /**
     * Replay a request with a specific session
     */
    async replayWithSession(originalRequest, session) {
        // Clone the request
        const modifiedRequest = this.cloneRequest(originalRequest);

        // Replace/add headers from session
        for (const [key, value] of Object.entries(session.headers)) {
            modifiedRequest.headers[key] = value;
        }

        // Remove headers (but not ones we just added from session)
        const sessionHeaderKeys = Object.keys(session.headers).map(k => k.toLowerCase());
        for (const headerName of session.headersToRemove) {
            // Don't remove if we just added it from session
            if (!sessionHeaderKeys.includes(headerName.toLowerCase())) {
                delete modifiedRequest.headers[headerName];
            }
        }

        console.log('[Replayer] Modified request headers after session apply:', {
            hasCookie: !!modifiedRequest.headers['Cookie'],
            cookiePreview: modifiedRequest.headers['Cookie']?.substring(0, 100),
            allHeaders: Object.keys(modifiedRequest.headers)
        });

        // Replace parameters
        for (const param of session.parameters) {
            if (param.remove) {
                modifiedRequest = this.removeParameter(modifiedRequest, param);
            } else if (param.value) {
                modifiedRequest = this.replaceParameter(modifiedRequest, param);
            }
        }

        // Send request
        try {
            const method = session.testCORS ? 'OPTIONS' : modifiedRequest.method;

            // Build raw HTTP request string
            const urlObj = new URL(modifiedRequest.url);
            const path = urlObj.pathname + urlObj.search;
            const host = urlObj.host;

            // Start with request line
            let rawRequest = `${method} ${path} HTTP/1.1\n`;

            // Add Host header
            rawRequest += `Host: ${host}\n`;

            // Add all headers
            for (const [key, value] of Object.entries(modifiedRequest.headers)) {
                // Convert header values to strings if they're objects
                let headerValue = value;
                if (typeof value === 'object' && value !== null) {
                    headerValue = JSON.stringify(value);
                } else {
                    headerValue = String(value);
                }
                rawRequest += `${key}: ${headerValue}\n`;
            }

            // Add empty line to separate headers from body
            rawRequest += '\n';

            // Add body if present
            if (modifiedRequest.body) {
                let bodyToSend = modifiedRequest.body;
                if (typeof bodyToSend === 'object') {
                    bodyToSend = JSON.stringify(bodyToSend);
                }
                rawRequest += bodyToSend;
            }

            console.log('[Replayer] Raw request:', {
                preview: rawRequest.substring(0, 500),
                hasCookie: rawRequest.includes('Cookie:'),
                cookieMatch: rawRequest.match(/Cookie: ([^\n]+)/)?.[1]?.substring(0, 100)
            });

            // Use existing parseRequest and sendRequest infrastructure
            const useHttps = modifiedRequest.url.startsWith('https://');
            const { url, options } = parseRequest(rawRequest, useHttps);

            console.log('[Replayer] Parsed request:', {
                url,
                method: options.method,
                headers: options.headers,
                hasCookie: !!options.headers['Cookie'],
                cookiePreview: options.headers['Cookie']?.substring(0, 100)
            });

            const result = await sendRequest(url, options);

            // Convert headers from Headers object to array format
            const responseHeaders = [];
            if (result.headers && typeof result.headers.entries === 'function') {
                for (const [name, value] of result.headers.entries()) {
                    responseHeaders.push({ name, value });
                }
            }

            return {
                status: result.status,
                statusText: result.statusText,
                headers: responseHeaders,
                body: result.body,
                url: modifiedRequest.url,
                method: method
            };
        } catch (error) {
            console.error('[Auth Analyzer] Request failed:', error);
            return {
                status: 0,
                statusText: 'Error',
                headers: [],
                body: error.message,
                url: modifiedRequest.url,
                method: modifiedRequest.method,
                error: true
            };
        }
    }

    /**
     * Clone a request object
     */
    cloneRequest(request) {
        return {
            url: request.url,
            method: request.method,
            headers: { ...request.headers },
            body: request.body
        };
    }

    /**
     * Replace parameter in request
     */
    replaceParameter(request, param) {
        const { name, value, replaceIn } = param;

        // Replace in URL path
        if (replaceIn.path) {
            request.url = this.replaceInPath(request.url, name, value);
        }

        // Replace in URL parameters
        if (replaceIn.urlParam) {
            request.url = this.replaceInURLParam(request.url, name, value);
        }

        // Replace in Cookie header
        if (replaceIn.cookie) {
            request.headers = this.replaceInCookie(request.headers, name, value);
        }

        // Replace in body
        if (replaceIn.body && request.body) {
            request.body = this.replaceInBody(request.body, name, value);
        }

        // Replace in JSON body
        if (replaceIn.json && request.body) {
            request.body = this.replaceInJSON(request.body, name, value);
        }

        // Replace in specific header
        if (replaceIn.header && request.headers) {
            request.headers = this.replaceInHeader(request.headers, name, value);
        }

        return request;
    }

    /**
     * Remove parameter from request
     */
    removeParameter(request, param) {
        const { name, replaceIn } = param;

        if (replaceIn.urlParam) {
            request.url = this.removeFromURLParam(request.url, name);
        }

        if (replaceIn.cookie) {
            request.headers = this.removeFromCookie(request.headers, name);
        }

        if (replaceIn.body && request.body) {
            request.body = this.removeFromBody(request.body, name);
        }

        if (replaceIn.json && request.body) {
            request.body = this.removeFromJSON(request.body, name);
        }

        return request;
    }

    /**
     * Replace in URL path (e.g., /api/user/123 -> /api/user/456)
     */
    replaceInPath(url, name, value) {
        const urlObj = new URL(url);
        const pathRegex = new RegExp(`/${name}/([^/]+)`, 'i');
        urlObj.pathname = urlObj.pathname.replace(pathRegex, `/${name}/${value}`);
        return urlObj.toString();
    }

    /**
     * Replace in URL parameters
     */
    replaceInURLParam(url, name, value) {
        const urlObj = new URL(url);
        if (urlObj.searchParams.has(name)) {
            urlObj.searchParams.set(name, value);
        }
        return urlObj.toString();
    }

    /**
     * Remove from URL parameters
     */
    removeFromURLParam(url, name) {
        const urlObj = new URL(url);
        urlObj.searchParams.delete(name);
        return urlObj.toString();
    }

    /**
     * Replace in Cookie header
     */
    replaceInCookie(headers, name, value) {
        if (!headers.Cookie) return headers;

        const cookies = headers.Cookie.split('; ');
        const newCookies = cookies.map(cookie => {
            const [cookieName, cookieValue] = cookie.split('=');
            if (cookieName === name) {
                return `${name}=${value}`;
            }
            return cookie;
        });

        headers.Cookie = newCookies.join('; ');
        return headers;
    }

    /**
     * Remove from Cookie header
     */
    removeFromCookie(headers, name) {
        if (!headers.Cookie) return headers;

        const cookies = headers.Cookie.split('; ');
        const newCookies = cookies.filter(cookie => {
            const [cookieName] = cookie.split('=');
            return cookieName !== name;
        });

        headers.Cookie = newCookies.join('; ');
        return headers;
    }

    /**
     * Replace in URL-encoded body
     */
    replaceInBody(body, name, value) {
        const params = new URLSearchParams(body);
        if (params.has(name)) {
            params.set(name, value);
        }
        return params.toString();
    }

    /**
     * Remove from URL-encoded body
     */
    removeFromBody(body, name) {
        const params = new URLSearchParams(body);
        params.delete(name);
        return params.toString();
    }

    /**
     * Replace in JSON body
     */
    replaceInJSON(body, name, value) {
        try {
            const json = JSON.parse(body);
            this.setInJSON(json, name, value);
            return JSON.stringify(json);
        } catch (e) {
            return body;
        }
    }

    /**
     * Remove from JSON body
     */
    removeFromJSON(body, name) {
        try {
            const json = JSON.parse(body);
            this.deleteInJSON(json, name);
            return JSON.stringify(json);
        } catch (e) {
            return body;
        }
    }

    /**
     * Set value in JSON object (recursive)
     */
    setInJSON(obj, key, value) {
        if (obj.hasOwnProperty(key)) {
            obj[key] = value;
            return true;
        }

        for (const k in obj) {
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                if (this.setInJSON(obj[k], key, value)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Delete key from JSON object (recursive)
     */
    deleteInJSON(obj, key) {
        if (obj.hasOwnProperty(key)) {
            delete obj[key];
            return true;
        }

        for (const k in obj) {
            if (typeof obj[k] === 'object' && obj[k] !== null) {
                if (this.deleteInJSON(obj[k], key)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Replace in specific header (e.g., Authorization: Bearer {token})
     */
    replaceInHeader(headers, name, value) {
        // Find header that contains the parameter name as a placeholder
        for (const [headerName, headerValue] of Object.entries(headers)) {
            if (headerValue.includes(`{${name}}`)) {
                headers[headerName] = headerValue.replace(`{${name}}`, value);
            }
        }
        return headers;
    }
}
