const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { auth } = require('express-openid-connect');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security & Global Middleware ─────────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true })); // CORS

// Stripe webhook needs raw body — must be registered BEFORE express.json()
app.use('/api/payments', require('./routes/paymentRoutes'));

app.use(express.json({ limit: '10kb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Request logging
}

// Auth0 Configuration
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET || 'a long, randomly-generated string stored in env',
    baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:5000',
    clientID: process.env.AUTH0_CLIENT_ID || 'F71yaO56arH90545wvhZRgAXaOzpdwcD',
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-7xbjdtky7mud4pm4.us.auth0.com'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// Apply rate limiter globally
app.use('/api', globalLimiter);

// ── Routes (Placeholders until controllers are generated) ────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'CarpConnect API is running.' });
});

// We will mount router files here in the next step
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rides', require('./routes/rideRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/emissions', require('./routes/emissionsRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
    res.status(404).json({ success: false, message: `Can't find ${req.originalUrl} on this server!` });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
