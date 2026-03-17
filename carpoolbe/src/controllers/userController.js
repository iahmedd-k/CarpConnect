const User = require('../models/User');
const Booking = require('../models/Booking');
const RideOffer = require('../models/RideOffer');

/**
 * @desc    Get user profile (specifically for driver profile page)
 * @route   GET /api/users/:id/profile
 */
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -tokens -__v')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Fetch recent completed rides where this user was the driver
        const recentRides = await Booking.find({ driver: req.params.id, status: 'completed' })
            .populate('offer request')
            .sort('-createdAt')
            .limit(10)
            .lean();

        res.status(200).json({
            success: true,
            data: { user, recentRides },
        });
    } catch (error) {
        next(error);
    }
};

const getCommunityData = async (req, res, next) => {
    try {
        const topDrivers = await User.find({ 
            role: { $in: ['driver', 'both'] },
            'ratings.count': { $gt: 0 } 
        })
            .select('name avatar profilePhoto ratings joinedAt vehicle verified')
            .sort({ 'ratings.average': -1, 'ratings.count': -1 })
            .limit(10);

        const totalUsers = await User.countDocuments({ isActive: true });
        const recentBookings = await Booking.find({ status: 'completed' })
            .populate('driver rider')
            .sort('-createdAt')
            .limit(5);

        // Map for leaderboard
        const leaderboard = topDrivers.map(d => ({
            name: d.name,
            id: d._id,
            rating: d.ratings?.average || 0,
            avatar: d.profilePhoto || d.avatar || d.name[0]
        }));

        res.status(200).json({
            success: true,
            data: {
                topDrivers,
                totalUsers,
                recentBookings,
                leaderboard
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getUserProfile, getCommunityData };
