const Review = require('../models/Review');
const User = require('../models/User');

/**
 * @desc    Submit a review for a ride
 * @route   POST /api/reviews
 */
const createReview = async (req, res, next) => {
    try {
        const { to, booking, rating, comment, tags } = req.body;

        // Verify the booking exists and is completed before allowing a review
        const Booking = require('../models/Booking');
        const bookingDoc = await Booking.findById(booking);
        if (!bookingDoc) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        if (bookingDoc.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'You can only review completed rides.' });
        }
        const review = await Review.create({
            from: req.user._id,
            to,
            booking,
            rating,
            comment,
            tags
        });

        // Update target user average rating
        const targetUser = await User.findById(to);
        if (targetUser) {
            const oldRating = targetUser.ratings.average || 0;
            const oldCount = targetUser.ratings.count || 0;
            const newCount = oldCount + 1;
            const newAverage = ((oldRating * oldCount) + rating) / newCount;

            targetUser.ratings.average = parseFloat(newAverage.toFixed(1));
            targetUser.ratings.count = newCount;
            await targetUser.save();
        }

        res.status(201).json({ success: true, data: { review } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reviews for a user
 * @route   GET /api/reviews/:userId
 */
const getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ to: req.params.userId })
            .populate('from', 'name avatar')
            .sort('-createdAt');

        res.status(200).json({ success: true, results: reviews.length, data: { reviews } });
    } catch (error) {
        next(error);
    }
};

module.exports = { createReview, getReviews };
