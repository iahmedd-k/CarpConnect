const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
        },
        tags: [String], // e.g. "Clean car", "On time"
    },
    { timestamps: true }
);

reviewSchema.index({ to: 1, createdAt: -1 });
reviewSchema.index({ from: 1, to: 1, booking: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
