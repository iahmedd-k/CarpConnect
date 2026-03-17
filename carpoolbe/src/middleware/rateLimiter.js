const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter — applied globally.
 * 100 requests per 15-minute window per IP.
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development ease
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again in 15 minutes.',
    },
});

/**
 * Auth-specific limiter — stricter limits for login/signup to prevent brute force.
 * 100 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Increased to avoid 429 during heavy profile editing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    skipSuccessfulRequests: true, // don't count successful logins
});

/**
 * Match endpoint limiter — prevents abuse of the geospatial matching engine.
 * 30 requests per minute per IP.
 */
const matchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Match request limit reached. Slow down.',
    },
});

module.exports = { globalLimiter, authLimiter, matchLimiter };
