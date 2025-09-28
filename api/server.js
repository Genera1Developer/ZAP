const express = require('express');
const cors = require('cors');
const { simpleWebSearch } = require('./engines');
const { rateLimit, sanitizeInput } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok', engine: 'ZapSearch' });
});

// Search Endpoint
app.get('/api/search', rateLimit, async (req, res) => {
    const rawQuery = req.query.q;
    if (!rawQuery) {
        return res.status(400).json({ error: 'Search query (q) is required.' });
    }

    const query = sanitizeInput(rawQuery);

    try {
        // Since this is a raw web search (no indexes), it will be slow.
        // We simulate the time cost of crawling.
        const results = await simpleWebSearch(query);
        
        res.json({
            query: query,
            results: results,
            message: `Found ${results.length} results through raw web crawling.`
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during the search process.' });
    }
});

// Vercel deployment requires the server to be exported as a handler
module.exports = app;

// Local development start
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}