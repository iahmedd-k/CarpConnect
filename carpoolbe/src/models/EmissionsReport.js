const mongoose = require('mongoose');

const emissionsReportSchema = new mongoose.Schema(
    {
        // Legacy field — kept for backward compatibility
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // New structured fields (used by emissionsService)
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        riders: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        distanceKm: {
            type: Number,
            required: true,
            min: 0,
        },
        riderCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        // Legacy field — kept for backward compat
        co2SavedKg: {
            type: Number,
            min: 0,
            default: 0,
        },
        // Detailed breakdown from emissionsService
        emissionFactorGPerKm: {
            type: Number,
            min: 0,
        },
        soloEmissionsG: {
            type: Number,
            min: 0,
        },
        sharedEmissionsG: {
            type: Number,
            min: 0,
        },
        savedEmissionsG: {
            type: Number,
            min: 0,
        },
        savedEmissionsKg: {
            type: Number,
            min: 0,
        },
        treesEquivalent: {
            type: Number,
            min: 0,
        },
    },
    { timestamps: true }
);

emissionsReportSchema.index({ user: 1 });
emissionsReportSchema.index({ driver: 1 });
emissionsReportSchema.index({ riders: 1 });
emissionsReportSchema.index({ booking: 1 }, { unique: true });

module.exports = mongoose.model('EmissionsReport', emissionsReportSchema);
