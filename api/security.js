import { URL } from 'url';

/**
 * Simple input sanitization for search queries.
 * Prevents common injection attempts (though less critical for a search query).
 * @param {string} query The raw search query.
 * @returns {string} The sanitized query.
 */
export function sanitizeQuery(query) {
  if (typeof query !== 'string') {
    return '';
  }
  
  // Basic trimming and removal of non-standard control characters
  let safeQuery = query.trim();
  
  // URL encode the query (handled by the engine, but good practice here too)
  // safeQuery = encodeURIComponent(safeQuery);
  
  // Remove script tags or HTML entities if somehow passed
  safeQuery = safeQuery.replace(/<[^>]*>?/gm, '');
  
  return safeQuery;
}

/**
 * Basic rate limiting middleware (placeholder).
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export function rateLimiter(req, res, next) {
    // In a real application, this would track IPs and request counts.
    // For now, it's a simple placeholder.
    next();
}

/**
 * CORS handling middleware (necessary for development/deployment).
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
export function corsHandler(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
}