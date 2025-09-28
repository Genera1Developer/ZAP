// Basic security measures for API endpoints
const rateLimit = (req, res, next) => {
    // In a real application, implement robust rate limiting using redis or similar.
    // For this simple Vercel/Node setup, we'll skip complex stateful rate limiting,
    // but include a placeholder for future implementation.
    next();
};

const sanitizeInput = (query) => {
    if (!query) return '';
    // Simple sanitization: trim and limit length
    return query.trim().substring(0, 200);
};

module.exports = { rateLimit, sanitizeInput };