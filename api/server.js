const express = require('express');
const cors = require('cors');
const path = require('path');
const { simpleWebSearch } = require('./engines');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Basic input sanitization (moved to server for simplicity)
const sanitizeInput = (query) => {
    if (!query) return '';
    // Simple sanitization: trim and limit length
    return query.trim().substring(0, 200);
};

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).send({ status: 'ok', engine: 'ZapSearch' });
});

// Search Endpoint
app.get('/api/search', async (req, res) => {
    const rawQuery = req.query.q;
    if (!rawQuery) {
        return res.status(400).json({ error: 'Search query (q) is required.' });
    }

    const query = sanitizeInput(rawQuery);

    try {
        console.log(`Starting search for: ${query}`);
        // This is the raw web crawling function, it is expected to be slow.
        const startTime = Date.now();
        const results = await simpleWebSearch(query);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        res.json({
            query: query,
            results: results,
            message: `Found ${results.length} results through raw web crawling in ${duration} seconds.`
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred during the search process.' });
    }
});

// Fallback for SPA routing (Vercel handles this mostly, but good practice)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


// Vercel deployment requires the server to be exported as a handler
module.exports = app;

// Local development start
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}