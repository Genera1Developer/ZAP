const express = require('express');
const router = express.Router();
const { performWebSearch } = require('./results');
const { rateLimitMiddleware } = require('./security');

// Apply basic rate limiting to the search endpoint
router.get('/search', rateLimitMiddleware, async (req, res) => {
    const query = req.query.q;

    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'Search query must be at least 3 characters long.' });
    }

    try {
        console.log(`Processing search for query: "${query}"`);
        const results = await performWebSearch(query);

        if (!results || results.length === 0) {
            return res.json({ results: [] });
        }

        // Return the structured results
        res.json({ results });

    } catch (error) {
        console.error('Search Engine Error:', error);
        res.status(500).json({ error: 'Internal search engine error. Could not complete search.' });
    }
});

module.exports = router;