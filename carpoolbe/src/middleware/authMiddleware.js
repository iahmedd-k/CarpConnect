const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies JWT from Authorization header.
 * Attaches `req.user` with the full user document on success.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorised — no token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-passwordHash -refreshToken');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });
        }

        req.user = user;
        next();
    } catch (err) {
        const message =
            err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.';
        return res.status(401).json({ success: false, message });
    }
};

/**
 * Role guard middleware factory.
 * Usage: restrictTo('driver', 'both')
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires role: ${roles.join(' or ')}.`,
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
