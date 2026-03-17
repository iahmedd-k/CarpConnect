const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['ride_update', 'booking', 'message', 'review', 'payment', 'system', 'newBookingRequest', 'bookingConfirmed', 'bookingRejected', 'bookingCanceled'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            trim: true,
        },
        link: {
            type: String, // e.g. '/dashboard/rides' or '/dashboard/messages'
        },
        read: {
            type: Boolean,
            default: false,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed, // Any extra data (bookingId, rideId, etc.)
        },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
