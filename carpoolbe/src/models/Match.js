const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
    {
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
        score: {
            type: Number,
            min: 0,
            max: 100,
        },
        metrics: {
            detourKm: Number,
            pickupDeviationM: Number,
            dropoffDeviationM: Number,
            routeOverlapScore: Number,
            suggestedPickup: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: [Number],
            },
            suggestedDropoff: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: [Number],
            },
            estimatedDistanceKm: Number,
            estimatedDurationMin: Number,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'expired'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 }, // automatically delete when expired
        },
    },
    { timestamps: true }
);

// Compound index to prevent duplicate matches for same offer/req pair
matchSchema.index({ offer: 1, request: 1 }, { unique: true });
matchSchema.index({ driver: 1, status: 1 });
matchSchema.index({ rider: 1, status: 1 });

module.exports = mongoose.model('Match', matchSchema);
