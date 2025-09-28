import { searchWeb } from './engines.js';
import { sanitizeQuery } from './security.js';

/**
 * Handles the search request, sanitizes input, and returns results.
 * @param {object} req Express request object
 * @param {object} res Express response object
 */
export async function handleSearch(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const safeQuery = sanitizeQuery(q);

  try {
    const results = await searchWeb(safeQuery);
    
    // Structure the response clearly
    res.json({
      query: safeQuery,
      count: results.length,
      results: results
    });

  } catch (error) {
    console.error('Search handler error:', error);
    res.status(500).json({ error: 'Internal server error while processing search.', details: error.message });
  }
}