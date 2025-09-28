/**
 * Cleans and sanitizes the user query string.
 * @param {string} query The input query.
 * @returns {string} The cleaned query.
 */
function cleanQuery(query) {
    if (typeof query !== 'string' || !query.trim()) {
        return '';
    }
    // Basic sanitization: trim whitespace, limit length, strip problematic characters
    let cleaned = query.trim().substring(0, 256);
    
    // Remove characters that might cause issues in URLs or database queries (if used)
    cleaned = cleaned.replace(/[<>{}()\[\]\\|;]/g, '');
    
    return cleaned;
}

module.exports = {
    cleanQuery
};