// api/security.js
// Basic security and utility functions for the server.

/**
 * Sanitizes a search query string to prevent basic XSS or injection attempts.
 * @param {string} query The raw search query.
 * @returns {string} The sanitized query.
 */
function sanitizeQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }
    // Simple sanitization: remove potentially harmful characters
    return query.trim().replace(/[<>'"\\/&]/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            case '&': return '&amp;';
            default: return match;
        }
    });
}

/**
 * Basic rate limiting check (placeholder/simple implementation).
 * In a real application, this would involve tracking IP addresses/sessions.
 * @param {object} req The request object (e.g., from Express/Vercel serverless function).
 * @returns {boolean} True if the request is allowed, false otherwise.
 */
function checkRateLimit(req) {
    // For a simple demo, we allow all requests.
    // Implement actual rate limiting here if necessary.
    return true;
}

/**
 * Basic validation for the search query length.
 * @param {string} query The query string.
 * @returns {boolean} True if the query is valid, false otherwise.
 */
function validateQuery(query) {
    const minLength = 1;
    const maxLength = 200;
    
    if (!query) {
        return false;
    }
    const trimmedQuery = query.trim();
    return trimmedQuery.length >= minLength && trimmedQuery.length <= maxLength;
}


module.exports = {
    sanitizeQuery,
    checkRateLimit,
    validateQuery
};