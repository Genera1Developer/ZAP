const express = require('express');
const path = require('path');
const { getSearchResults } = require('./results');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for serving static files
app.use(express.static(path.join(__dirname, '../public')));

// Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers (basic)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'");
    next();
});

// API Endpoint for search
app.get('/api/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const results = await getSearchResults(query);
        res.json({
            query: query,
            count: results.length,
            results: results
        });
    } catch (error) {
        console.error('Search API Error:', error);
        res.status(500).json({ error: 'An internal server error occurred during search.' });
    }
});

// Root route serves the index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`ZapAI Search Engine running on http://localhost:${PORT}`);
});