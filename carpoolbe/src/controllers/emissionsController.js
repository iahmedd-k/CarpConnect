const { getUserLifetimeSavings, calculateSavings } = require('../services/emissionsService');
const EmissionsReport = require('../models/EmissionsReport');
const Booking = require('../models/Booking');

/**
 * @desc    Get aggregate emissions stats for current user
 * @route   GET /api/emissions/me
 */
const getMyEmissions = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await getUserLifetimeSavings(req.user._id);

        let query = {
            $or: [{ driver: req.user._id }, { riders: req.user._id }],
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const recentReports = await EmissionsReport.find(query)
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                stats,
                recentReports,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Admin or System route to manually compute emissions for a completed booking
 * @route   POST /api/emissions/compute/:bookingId
 */
const computeForBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId).populate('offer');
        if (!booking || booking.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Booking not completed.' });
        }

        const { createReport } = require('../services/emissionsService');
        const report = await createReport({
            bookingId: booking._id,
            driverId: booking.driver,
            riderIds: [booking.rider],
            distanceKm: booking.offer.estimatedDistanceKm || 10,
            fuelType: 'petrol'
        });

        res.status(200).json({ success: true, data: { report } });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyEmissions, computeForBooking };
