const { simpleWebSearch } = require('./engines');
const { cleanQuery } = require('./security');

/**
 * Handles the search request, processes the query, and returns results.
 * @param {string} query The user's search query.
 * @returns {Promise<Array<Object>>} A list of search results.
 */
async function getSearchResults(query) {
    const cleanedQuery = cleanQuery(query);
    if (!cleanedQuery) {
        return [];
    }

    console.log(`[Results] Processing search for: ${cleanedQuery}`);

    // Since we are simulating a search engine without an index,
    // we assume the user might be looking for a specific site or topic.
    // We run the simple web search simulation.
    
    // For demonstration purposes, we run the search on the query itself.
    // In a real application, this would be replaced by calling a proper index/crawler.
    
    const result = await simpleWebSearch(cleanedQuery);

    if (result) {
        return [result]; // Return the single simulated result
    }

    // Fallback scenario: If the query wasn't a direct URL,
    // we can try fetching a known good site (e.g., google.com or wikipedia.org)
    // based on the query, but that breaks the 'no external sources' rule if we
    // rely on a third-party search engine.
    
    // Sticking strictly to the simulation:
    // If the direct attempt failed, perhaps the user meant a popular domain.
    // Since we cannot guess, we return empty results.

    return [];
}

module.exports = {
    getSearchResults
};