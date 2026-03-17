const ChatMessage = require('../models/ChatMessage');
const Booking = require('../models/Booking');

/**
 * @desc    Send a chat message
 * @route   POST /api/chat
 */
const sendMessage = async (req, res, next) => {
    try {
        const { bookingId, content } = req.body;

        // Verify sender is a participant of this booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        const userId = req.user._id.toString();
        if (booking.driver.toString() !== userId && booking.rider.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorised to chat in this booking.' });
        }

        const message = await ChatMessage.create({
            booking: bookingId,
            sender: req.user._id,
            content
        });

        res.status(201).json({ success: true, data: { message } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get messages for a booking
 * @route   GET /api/chat/:bookingId
 */
const getMessages = async (req, res, next) => {
    try {
        const messages = await ChatMessage.find({ booking: req.params.bookingId, deletedAt: null })
            .populate('sender', 'name avatar')
            .sort('createdAt');

        res.status(200).json({ success: true, count: messages.length, data: { messages } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a message (sender only, soft delete)
 * @route   DELETE /api/chat/:messageId
 */
const deleteMessage = async (req, res, next) => {
    try {
        const message = await ChatMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found.' });
        }
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
        }

        message.deletedAt = new Date();
        await message.save();

        res.status(200).json({ success: true, message: 'Message deleted.' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark messages as seen in a booking chat
 * @route   PATCH /api/chat/:bookingId/seen
 */
const markSeen = async (req, res, next) => {
    try {
        await ChatMessage.updateMany(
            { booking: req.params.bookingId, sender: { $ne: req.user._id }, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );
        res.status(200).json({ success: true, message: 'Messages marked as seen.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendMessage, getMessages, deleteMessage, markSeen };
