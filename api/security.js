// api/security.js
// Enhanced security and utility functions for the search engine

const crypto = require('crypto');

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

/**
 * Advanced sanitization for search queries
 * @param {string} query The raw search query
 * @returns {string} The sanitized query
 */
function sanitizeQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }
    
    // Remove potentially harmful characters and patterns
    let sanitized = query.trim()
        .replace(/[<>'"\\&]/g, function (match) {
            switch (match) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                case '&': return '&amp;';
                case '\\': return '';
                default: return match;
            }
        })
        // Remove potential script injections
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        .trim();
    
    return sanitized;
}

/**
 * Enhanced rate limiting with IP tracking
 * @param {object} req The request object
 * @returns {boolean} True if request is allowed, false if rate limited
 */
function checkRateLimit(req) {
    const clientIP = getClientIP(req);
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Get or create rate limit data for this IP
    if (!rateLimitStore.has(clientIP)) {
        rateLimitStore.set(clientIP, []);
    }
    
    const requests = rateLimitStore.get(clientIP);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    // Add current request
    recentRequests.push(now);
    rateLimitStore.set(clientIP, recentRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
        cleanupRateLimitStore();
    }
    
    return true;
}

/**
 * Extract client IP from request
 * @param {object} req The request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
}

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitStore() {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    for (const [ip, requests] of rateLimitStore.entries()) {
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        if (recentRequests.length === 0) {
            rateLimitStore.delete(ip);
        } else {
            rateLimitStore.set(ip, recentRequests);
        }
    }
}

/**
 * Enhanced query validation with additional checks
 * @param {string} query The query string
 * @returns {object} Validation result with success flag and message
 */
function validateQuery(query) {
    const minLength = 1;
    const maxLength = 500;
    
    if (!query) {
        return { valid: false, message: 'Query is required' };
    }
    
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < minLength) {
        return { valid: false, message: 'Query too short' };
    }
    
    if (trimmedQuery.length > maxLength) {
        return { valid: false, message: 'Query too long' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /script\s*:/i,
        /javascript\s*:/i,
        /data\s*:/i,
        /vbscript\s*:/i,
        /<\s*script/i,
        /eval\s*\(/i,
        /expression\s*\(/i
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(trimmedQuery)) {
            return { valid: false, message: 'Invalid characters detected' };
        }
    }
    
    return { valid: true, message: 'Valid query' };
}

/**
 * Generate a secure session token for search requests
 * @returns {string} Secure random token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate URL for web scraping safety
 * @param {string} url The URL to validate
 * @returns {boolean} True if URL is safe to scrape
 */
function validateURL(url) {
    try {
        const parsedURL = new URL(url);
        
        // Only allow HTTP and HTTPS
        if (!['http:', 'https:'].includes(parsedURL.protocol)) {
            return false;
        }
        
        // Block localhost and private IPs
        const hostname = parsedURL.hostname.toLowerCase();
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Clean and normalize search results for safe display
 * @param {Array} results Array of search results
 * @returns {Array} Sanitized results
 */
function sanitizeResults(results) {
    if (!Array.isArray(results)) {
        return [];
    }
    
    return results.map(result => ({
        title: sanitizeHTML(result.title || ''),
        url: result.url || '',
        description: sanitizeHTML(result.description || ''),
        timestamp: Date.now()
    })).filter(result => result.title && result.url);
}

/**
 * Sanitize HTML content
 * @param {string} html Raw HTML content
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    
    return html
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/&/g, '&amp;')
        .trim();
}

/**
 * Log security events for monitoring
 * @param {string} event Event type
 * @param {object} details Event details
 */
function logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    console.log(`[SECURITY] ${timestamp} - ${event}:`, details);
}

module.exports = {
    sanitizeQuery,
    checkRateLimit,
    validateQuery,
    generateSessionToken,
    validateURL,
    sanitizeResults,
    sanitizeHTML,
    getClientIP,
    logSecurityEvent
};