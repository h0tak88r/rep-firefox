// Request Sender Module - Handles actual HTTP request execution
import { executeRequest } from './capture.js';

/**
 * Sends an HTTP request and returns the raw response
 * @param {string} url - The URL to send the request to
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} Response object with status, headers, body, size, duration
 */
export async function sendRequest(url, options = {}) {
    const startTime = performance.now();

    try {
        const fetchOptions = {
            method: options.method || 'GET',
            headers: options.headers || {},
            mode: 'cors',
            credentials: options.credentials || 'omit',
            redirect: options.redirect || 'follow'
        };

        // Add body if provided
        if (options.body) {
            fetchOptions.body = options.body;
        }

        const response = await fetch(url, fetchOptions);
        const endTime = performance.now();

        let body;
        const contentType = response.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                body = await response.text(); // Get JSON as text
            } else {
                body = await response.text();
            }
        } catch (e) {
            body = '';
        }

        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body: body,
            duration: Math.round(endTime - startTime),
            size: new Blob([body]).size
        };
    } catch (error) {
        const endTime = performance.now();
        console.error('[Request Sender] Error:', error);

        return {
            status: 0,
            statusText: 'Network Error',
            headers: new Headers(),
            body: `Error: ${error.message}`,
            duration: Math.round(endTime - startTime),
            size: 0,
            error: true
        };
    }
}
