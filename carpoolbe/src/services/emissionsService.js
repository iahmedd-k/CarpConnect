const mongoose = require('mongoose');
const EmissionsReport = require('../models/EmissionsReport');

/**
 * emissionsService.js — CO₂ savings calculation and reporting.
 *
 * Formula:
 *   soloEmissions  = distanceKm × emissionFactorGPerKm × (riderCount + 1)
 *                    └─ what riderCount+1 solo trips would have emitted
 *
 *   sharedEmissions = distanceKm × emissionFactorGPerKm
 *                     └─ one car (the driver) travelling the route
 *
 *   savedEmissionsG = soloEmissions - sharedEmissions
 *
 *  Reference emission values (g CO₂ / km):
 *    Petrol:   120
 *    Diesel:   110
 *    Hybrid:    80
 *    Electric:  50  (lifecycle)
 *    CNG:       90
 */

const EMISSION_FACTORS = {
    petrol: 120,
    diesel: 110,
    hybrid: 80,
    electric: 50,
    cng: 90,
};

const TREES_ABSORB_KG_PER_YEAR = 21; // approx. kg CO₂ per tree per year

/**
 * Calculate CO₂ savings for a completed shared trip.
 *
 * @param {object} params
 * @param {number} params.distanceKm
 * @param {string} params.fuelType             vehicle fuel type
 * @param {number} params.riderCount           number of riders (not including driver)
 * @param {number} [params.emissionFactorGPerKm] override if known
 * @returns {{
 *   emissionFactorGPerKm: number,
 *   soloEmissionsG: number,
 *   sharedEmissionsG: number,
 *   savedEmissionsG: number,
 *   savedEmissionsKg: number,
 *   treesEquivalent: number,
 * }}
 */
const calculateSavings = ({ distanceKm, fuelType = 'petrol', riderCount = 1, emissionFactorGPerKm }) => {
    const factor = emissionFactorGPerKm ?? EMISSION_FACTORS[fuelType] ?? EMISSION_FACTORS.petrol;

    // What all individual trips would have emitted (driver + each rider solo)
    const soloEmissionsG = distanceKm * factor * (riderCount + 1);

    // The shared trip only produces one car's worth of emissions
    const sharedEmissionsG = distanceKm * factor;

    const savedEmissionsG = Math.max(0, soloEmissionsG - sharedEmissionsG);
    const savedEmissionsKg = parseFloat((savedEmissionsG / 1000).toFixed(3));

    // Fraction of what a tree absorbs in a year
    const treesEquivalent = parseFloat(
        (savedEmissionsKg / TREES_ABSORB_KG_PER_YEAR).toFixed(4)
    );

    return {
        emissionFactorGPerKm: factor,
        soloEmissionsG: Math.round(soloEmissionsG),
        sharedEmissionsG: Math.round(sharedEmissionsG),
        savedEmissionsG: Math.round(savedEmissionsG),
        savedEmissionsKg,
        treesEquivalent,
    };
};

/**
 * Create and persist an EmissionsReport for a completed booking.
 *
 * @param {object} params
 * @param {string} params.bookingId
 * @param {string} params.driverId
 * @param {string[]} params.riderIds
 * @param {number} params.distanceKm
 * @param {string} params.fuelType
 * @returns {EmissionsReport}
 */
const createReport = async ({ bookingId, driverId, riderIds, distanceKm, fuelType }) => {
    const savings = calculateSavings({
        distanceKm,
        fuelType,
        riderCount: riderIds.length,
    });

    const report = await EmissionsReport.findOneAndUpdate(
        { booking: bookingId },
        {
            booking: bookingId,
            driver: driverId,
            riders: riderIds,
            distanceKm,
            riderCount: riderIds.length,
            ...savings,
        },
        { upsert: true, new: true }
    );

    return report;
};

/**
 * Aggregate lifetime CO₂ savings for a given user (as driver and rider).
 *
 * @param {string} userId
 * @returns {{ totalSavedKg: number, totalTrips: number, treesEquivalent: number }}
 */
const getUserLifetimeSavings = async (userId) => {
    const objectId = new mongoose.Types.ObjectId(userId);
    const result = await EmissionsReport.aggregate([
        {
            $match: {
                $or: [{ driver: objectId }, { riders: objectId }],
            },
        },
        {
            $group: {
                _id: null,
                totalSavedKg: { $sum: '$savedEmissionsKg' },
                totalTrips: { $sum: 1 },
                totalTreesEquivalent: { $sum: '$treesEquivalent' },
            },
        },
    ]);

    return result[0] ?? { totalSavedKg: 0, totalTrips: 0, treesEquivalent: 0 };
};

module.exports = { calculateSavings, createReport, getUserLifetimeSavings, EMISSION_FACTORS };
