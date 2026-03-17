const express = require('express');
const { createBooking, getMyBookings, updateBookingStatus, getEarnings, getSpending, pickupRider, dropoffRider } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { validate, bookingSchema } = require('../utils/validators');

const router = express.Router();

router.use(protect);

router.post('/', validate(bookingSchema), createBooking);
router.get('/', getMyBookings);
router.get('/earnings', getEarnings);
router.get('/spending', getSpending);
router.patch('/:id/status', updateBookingStatus);
router.post('/:id/pickup', pickupRider);
router.post('/:id/dropoff', dropoffRider);

module.exports = router;
