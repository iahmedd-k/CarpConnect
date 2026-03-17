/**
 * fareSplit.js — Fare calculation and splitting utilities.
 *
 * Design decisions:
 *   - All monetary values are stored and calculated in the smallest currency
 *     unit (e.g., cents for USD, paise for INR) to avoid floating-point issues.
 *   - Platform fee is deducted from the total; remainder goes to the driver.
 */

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

/**
 * Calculates the per-seat price for a given route distance.
 *
 * Formula:
 *   baseRate × distanceKm  (capped at maxFare)
 *
 * @param {number} distanceKm
 * @param {object} opts
 * @param {number} opts.baseRateCentsPerKm  default 25 cents / km
 * @param {number} opts.minFareCents        default 100 cents ($1)
 * @param {number} opts.maxFareCents        default 5000 cents ($50)
 * @returns {number} price in cents
 */
const calculatePricePerSeat = (
    distanceKm,
    { baseRateCentsPerKm = 25, minFareCents = 100, maxFareCents = 5000 } = {}
) => {
    const raw = Math.round(distanceKm * baseRateCentsPerKm);
    return Math.min(Math.max(raw, minFareCents), maxFareCents);
};

/**
 * Splits a total fare among multiple riders, applying the platform fee.
 *
 * @param {number} pricePerSeatCents
 * @param {number} riderCount          number of riders sharing
 * @param {number} platformFeePercent  override platform fee if needed
 * @returns {{
 *   totalCollected: number,
 *   platformFee: number,
 *   driverEarnings: number,
 *   perRiderShare: number,
 * }}
 */
const splitFare = (pricePerSeatCents, riderCount = 1, platformFeePercent = PLATFORM_FEE_PERCENT) => {
    const totalCollected = pricePerSeatCents * riderCount;
    const platformFee = Math.round(totalCollected * (platformFeePercent / 100));
    const driverEarnings = totalCollected - platformFee;
    const perRiderShare = pricePerSeatCents; // each rider pays their seat price

    return {
        totalCollected,
        platformFee,
        driverEarnings,
        perRiderShare,
    };
};

/**
 * Formats cents into a human-readable amount.
 * @param {number} cents
 * @param {string} currency  ISO 4217 (e.g. 'USD')
 * @returns {string} e.g. "$12.50"
 */
const formatAmount = (cents, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
    }).format(cents / 100);
};

module.exports = { calculatePricePerSeat, splitFare, formatAmount };
