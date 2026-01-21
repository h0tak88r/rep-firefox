/**
 * Response Comparison Logic
 * Compares two responses to determine if they are effectively the same
 */

export class ResponseComparator {
    constructor() {
        this.similarityThreshold = 0.90; // 90% similarity
    }

    /**
     * Compare original and swapped responses
     * @param {Object} original - Original response {status, body, headers}
     * @param {Object} swapped - Swapped response {status, body, headers}
     * @returns {String} 'SAME', 'SIMILAR', or 'DIFFERENT'
     */
    compare(original, swapped) {
        if (!original || !swapped) {
            console.warn('[Comparator] Invalid responses to compare');
            return 'ERROR';
        }

        const origStatus = original.status || 0;
        const swapStatus = swapped.status || 0;

        // 1. Status Code Check
        if (origStatus !== swapStatus) {
            return 'DIFFERENT';
        }

        // 2. Body Normalization & Comparison
        const normOrig = this.normalizeBody(original.body || '');
        const normSwap = this.normalizeBody(swapped.body || '');

        // Exact match after normalization
        if (normOrig === normSwap) {
            return 'SAME';
        }

        // 3. Similarity Check (Levenshtein/Cosine)
        const similarity = this.calculateSimilarity(normOrig, normSwap);

        console.log(`[Comparator] Similarity: ${similarity.toFixed(2)} (${origStatus})`);

        if (similarity >= this.similarityThreshold) {
            // Modified Logic: If status codes are same but bodies are slightly different,
            // we classify as SIMILAR instead of SAME to denote potential false positives
            // or dynamic content differences (e.g., timestamps, CSRF tokens).
            // However, if similarity is VERY high (e.g. > 98%), it might still be SAME.
            // For now, let's strictly valid SAME only for identical normalized bodies.

            // Actually, if it's 90%+ similar and status is same, it's suspicious.
            // But we want to distinguish "Identical" from "Very Similar".

            // If they are VERY close (e.g. 99%), treat as SAME (Bypass)
            // If they are somewhat different (90-99%), treat as SIMILAR (Warning)

            if (similarity > 0.98) {
                return 'SAME';
            }
            return 'SIMILAR';
        }

        // 4. Heuristic: Same Status but Different Body
        // If status is 200/201 and bodies are different, it might be a login page vs success page?
        // Usually if auth fails, we expect 401/403. 
        // If we get 200 OK on both, but bodies are different, it implies:
        // - Original: "Welcome User"
        // - Swapped: "Please Login" (but served with 200 OK)
        // This is effectively DIFFERENT auth state, so it's NOT a bypass.
        // So 'DIFFERENT' is correct here.

        // However, user specifically asked: "make result SIMILAR if same status code different body"
        // So let's implement that specific rule for the 'DIFFERENT' case if status matches.

        if (origStatus === swapStatus) {
            return 'SIMILAR';
        }

        return 'DIFFERENT';
    }

    /**
     * Normalize body for comparison
     * Removes dynamic content like timestamps, tokens, non-content tags
     */
    normalizeBody(body) {
        if (!body) return '';
        if (typeof body !== 'string') return String(body);

        let normalized = body;

        // Remove script tags and content
        normalized = normalized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');

        // Remove style tags and content
        normalized = normalized.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '');

        // Remove hidden inputs (often contain CSRF tokens)
        normalized = normalized.replace(/<input[^>]*type=["']hidden["'][^>]*>/gim, '');

        // Remove timestamps / dates (simple heuristics)
        // ISO dates
        normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '');
        // Unix timestamps (10-13 digits)
        normalized = normalized.replace(/\b\d{10,13}\b/g, '');

        // Collapse whitespace
        normalized = normalized.replace(/\s+/g, ' ').trim();

        return normalized;
    }

    /**
     * Calculate similarity using diff heuristic
     * (Simplified for performance)
     */
    calculateSimilarity(s1, s2) {
        if (s1 === s2) return 1.0;
        if (s1.length === 0 || s2.length === 0) return 0.0;

        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;

        if (longerLength === 0) return 1.0;

        // Edit distance is too expensive for large bodies.
        // Use token overlap (Jacquard index on words).
        const tokens1 = new Set(s1.split(' '));
        const tokens2 = new Set(s2.split(' '));

        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        return intersection.size / union.size;
    }
}
