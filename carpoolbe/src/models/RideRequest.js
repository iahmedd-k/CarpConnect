const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema(
    {
        rider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        origin: {
            address: { type: String, required: true },
            point: {
                type: { type: String, enum: ["Point"], default: "Point", required: true },
                coordinates: { type: [Number], required: true }, // [longitude, latitude]
            },
        },
        destination: {
            address: { type: String, required: true },
            point: {
                type: { type: String, enum: ["Point"], default: "Point", required: true },
                coordinates: { type: [Number], required: true }, // [longitude, latitude]
            },
        },
        earliestDeparture: {
            type: Date,
            required: true,
        },
        latestDeparture: {
            type: Date,
            required: true,
        },
        seatsNeeded: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        maxPricePerSeat: {
            type: Number,
        },
        preferences: {
            smokingAllowed: { type: Boolean, default: false },
            petsAllowed: { type: Boolean, default: false },
        },
        status: {
            type: String,
            enum: ['open', 'matched', 'cancelled'],
            default: 'open',
        },
        matchedOffer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RideOffer',
        },
    },
    { timestamps: true }
);

rideRequestSchema.index({ "origin.point": "2dsphere" });
rideRequestSchema.index({ "destination.point": "2dsphere" });
rideRequestSchema.index({ earliestDeparture: 1 });
rideRequestSchema.index({ rider: 1, status: 1 });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
