const Notification = require('../models/Notification');

/**
 * @desc    Get notifications for the current user
 * @route   GET /api/notifications
 */
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

        res.status(200).json({
            success: true,
            data: { notifications, unreadCount },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark a notification as read
 * @route   PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        res.status(200).json({ success: true, data: { notification } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Create a notification and push via Socket.IO if available
 */
const createNotification = async ({ userId, type, title, body, link, metadata }) => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            body,
            link,
            metadata,
        });

        // Push real-time via Socket.IO
        try {
            const { getIO } = require('../config/socket');
            const io = getIO();
            io.to(`user:${userId}`).emit('notification', {
                _id: notification._id,
                type,
                title,
                body,
                link,
                createdAt: notification.createdAt,
            });
        } catch {
            // Socket not initialized, skip
        }

        return notification;
    } catch (err) {
        console.error('Failed to create notification:', err.message);
        return null;
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
