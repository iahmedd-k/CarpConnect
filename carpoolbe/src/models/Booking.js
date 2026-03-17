const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        match: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match',
            required: true,
        },
        rider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        offer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RideOffer',
            required: true,
        },
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RideRequest',
            required: true,
        },
        seatsRequested: {
            type: Number,
            required: true,
            default: 1,
        },
        fare: {
            totalAmount: { type: Number, required: true },
            currency: { type: String, default: 'PKR' },
            platformFeePercent: { type: Number, default: 10 },
            paymentIntentId: String,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'cancelled_partial', 'picked_up', 'completed'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

bookingSchema.index({ rider: 1, status: 1 });
bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ offer: 1 });
bookingSchema.index({ rider: 1, match: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
