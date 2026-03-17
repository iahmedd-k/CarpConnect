const express = require('express');
const {
    createOffer,
    createRequest,
    getMatches,
    searchRides,
    searchRidesPublic,
    bookDirect,
    getMyOffers,
    getOffers,
    updateOfferStatus,
    startRide,
    completeRide,
} = require('../controllers/rideController');
const { validate, rideOfferSchema, rideRequestSchema } = require('../utils/validators');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { matchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── Public Routes (No Auth Required) ──────────────────────────────────────────
// Homepage & dashboard destination search — no auth needed for browsing
router.get('/search-dest', searchRidesPublic);

// ── Protected Routes ───────────────────────────────────────────────────────────
router.use(protect);

// Autocomplete suggestions (address lookup while typing)
router.get('/search', restrictTo('rider', 'both'), searchRides);

// ── Driver offer management ────────────────────────────────────────────────────
router.post('/offers', restrictTo('driver', 'both'), validate(rideOfferSchema), createOffer);
router.get('/offers', restrictTo('driver', 'both'), getOffers);
router.patch('/offers/:id/status', restrictTo('driver', 'both'), updateOfferStatus);
router.post('/offers/:id/start', restrictTo('driver', 'both'), startRide);
router.post('/offers/:id/complete', restrictTo('driver', 'both'), completeRide);

// ── Rider booking ──────────────────────────────────────────────────────────────
// PRIMARY: Direct booking from search results (no pre-created match needed)
router.post('/book-direct', restrictTo('rider', 'both'), bookDirect);

// LEGACY: Create ride request → get matches (used when rider has GPS coords)
router.post(
    '/requests',
    restrictTo('rider', 'both'),
    validate(rideRequestSchema),
    createRequest
);
router.get(
    '/requests/:requestId/matches',
    restrictTo('rider', 'both'),
    matchLimiter,
    getMatches
);

module.exports = router;
