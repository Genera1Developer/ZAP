const express = require('express');
const helmet = require('helmet');
const path = require('path');
const searchEngine = require('./engines');
const security = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(security.rateLimiter);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API route for search
app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search query is required.' });
    }

    try {
        const results = await searchEngine.search(query);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error.message);
        // Mask specific scraping errors from the user
        res.status(500).json({ error: 'Failed to perform search. The search mechanism might be temporarily blocked or the target structure changed.' });
    }
});

// Basic health check
app.get('/api/health', (req, res) => {
    res.status(200).send('OK');
});

// Serve index.html for all other routes (SPA setup)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server only if not running in Vercel environment (Vercel uses serverless functions)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_REGION) {
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

// Export the app for Vercel serverless function deployment
module.exports = app;