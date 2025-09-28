const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Basic Rate Limiter configuration
const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        error: 'Too many requests, please try again after 15 minutes.'
    }
});

// Helmet middleware for setting various HTTP headers for security
// Note: Helmet should ideally be applied globally in api/server.js, but defining it here for modularity.
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Vercel often handles this
});

module.exports = {
    rateLimitMiddleware,
    helmetMiddleware
};