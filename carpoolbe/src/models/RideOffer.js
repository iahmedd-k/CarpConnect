const mongoose = require('mongoose');

const rideOfferSchema = new mongoose.Schema(
    {
        driver: {
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
        stops: [{
            type: { type: String, enum: ['pickup', 'dropoff'], required: true },
            bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
            location: {
                address: String,
                point: {
                    type: { type: String, enum: ["Point"], default: "Point" },
                    coordinates: { type: [Number] }, // [longitude, latitude]
                }
            },
            completed: { type: Boolean, default: false }
        }],
        currentStopIndex: { type: Number, default: 0 },
        routePolyline: {
            type: [[Number]],
        },
        estimatedDistanceKm: Number,
        estimatedDurationMin: Number,
        departureTime: {
            type: Date,
            required: true,
        },
        seatsTotal: {
            type: Number,
            required: true,
            min: 1,
        },
        seatsAvailable: {
            type: Number,
            required: true,
            min: 0,
        },
        pricePerSeat: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'PKR',
        },
        preferences: {
            smokingAllowed: { type: Boolean, default: false },
            petsAllowed: { type: Boolean, default: false },
            musicAllowed: { type: Boolean, default: true },
            maxDetourKm: { type: Number, default: 5 },
        },
        status: {
            type: String,
            enum: ['scheduled', 'active', 'live', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        startedAt: Date,
        completedAt: Date,
        liveLocation: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number] }, // [longitude, latitude]
        },
        emissionsSaved: {
            co2Kg: Number,
            treesEquivalent: Number
        }
    },
    { timestamps: true }
);

rideOfferSchema.index({ "origin.point": "2dsphere" });
rideOfferSchema.index({ "destination.point": "2dsphere" });
rideOfferSchema.index({ departureTime: 1 });
rideOfferSchema.index({ driver: 1, status: 1 });
rideOfferSchema.index({ status: 1, seatsAvailable: 1 }); // for seat-available queries
rideOfferSchema.index(
    { "destination.address": "text", "origin.address": "text" },
    { name: "address_text_search" }
);

module.exports = mongoose.model('RideOffer', rideOfferSchema);
