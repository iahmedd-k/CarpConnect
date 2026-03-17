const express = require('express');
const { getMyEmissions, computeForBooking } = require('../controllers/emissionsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', getMyEmissions);
router.post('/compute/:bookingId', computeForBooking); // manual trigger

module.exports = router;
