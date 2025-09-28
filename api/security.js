const rateLimit = require('express-rate-limit');

/**
 * Basic rate limiting to prevent abuse.
 * Limits each IP to 15 requests per minute.
 */
const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // Limit each IP to 15 requests per windowMs
    message: {
        error: "Too many requests, please try again after 1 minute."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Sanitizes and validates input query.
 * @param {string} query 
 * @returns {string} Cleaned query
 */
const sanitizeQuery = (query) => {
    if (!query) return '';
    // Simple sanitization: trim and limit length
    let sanitized = query.trim();
    if (sanitized.length > 256) {
        sanitized = sanitized.substring(0, 256);
    }
    // Basic URL encoding for safety in scraping
    return encodeURIComponent(sanitized);
};

module.exports = {
    rateLimiter,
    sanitizeQuery
};