// api/server.js
const express = require('express');
const { searchWeb } = require('./engines');
const { sanitizeQuery, checkRateLimit } = require('./security');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for serving static files (for local testing/development)
app.use(express.static(path.join(__dirname, '../public')));

// Basic rate limiting middleware
app.use((req, res, next) => {
    if (!checkRateLimit(req)) {
        return res.status(429).send({ error: 'Too many requests. Please try again later.' });
    }
    next();
});

// Search endpoint
app.get('/api/search', async (req, res) => {
    const rawQuery = req.query.q;

    if (!rawQuery) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const query = sanitizeQuery(rawQuery);

    try {
        // Note: The searchWeb function is where the core logic resides,
        // simulating "raw web searching power" by fetching and parsing URLs.
        const results = await searchWeb(query);
        res.json({ query: rawQuery, results });
    } catch (error) {
        console.error('Search error:', error.message);
        // Send a generic error message to the client
        res.status(500).json({ error: 'An error occurred during the search operation.' });
    }
});

// Vercel serverless function export
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}