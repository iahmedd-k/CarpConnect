const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const createSendToken = (user, statusCode, res, message) => {
    const token = signToken(user._id, user.role);

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        message,
        token,
        data: { user },
    });
};

/**
 * @desc    Register a new user (rider or driver)
 * @route   POST /api/auth/signup
 */
const signup = async (req, res, next) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password, // hashed in pre-save hook
            role: req.body.role || 'rider',
            vehicle: req.body.vehicle,
        });

        createSendToken(newUser, 201, res, 'User created successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user via email & password
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        // 2. Check if user exists && password is correct
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
        }

        // 3. Check if account is active
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });
        }

        // 4. If everything ok, send token
        createSendToken(user, 200, res, 'Logged in successfully.');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PATCH /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, vehicle, profilePhoto, preferences, twoFactorEnabled } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (profilePhoto) user.profilePhoto = profilePhoto;
        if (vehicle && (user.role === 'driver' || user.role === 'both')) {
            user.vehicle = vehicle;
        }
        if (preferences) {
            user.preferences = { ...user.preferences, ...preferences };
        }
        if (typeof twoFactorEnabled === 'boolean') {
            user.twoFactorEnabled = twoFactorEnabled;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Change user password
 * @route   PATCH /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id).select('+password');
        
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }
        
        user.password = newPassword;
        await user.save();
        
        // Send a fresh token
        createSendToken(user, 200, res, 'Password changed successfully. You have been re-authenticated.');
    } catch (error) {
        next(error);
    }
};

module.exports = { signup, login, getMe, updateProfile, changePassword };
