const express = require('express');
const path = require('path');
const searchRouter = require('./engines'); // Renamed engines.js to handle routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers (basic setup, can be enhanced in api/security.js)
// Note: For Vercel deployment, security headers are often configured in vercel.json or through Vercel's platform settings.

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', searchRouter);

// Serve the index.html for all other GET requests (SPA style)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;