/**
 * pricingService.js — Logic for calculating ride prices based on distance,
 * seat count, and vehicle fuel type (cost per km).
 */

const COST_PER_KM = {
    petrol: 25,   // PKR
    diesel: 22,   // PKR
    hybrid: 18,   // PKR
    electric: 12, // PKR
    cng: 15,      // PKR
};

const MIN_PRICE = 50; // Minimum price per seat

/**
 * Calculates a recommended price per seat.
 * 
 * Formula: (distanceKm * costPerKm) / seatsTotal
 * 
 * @param {object} params
 * @param {number} params.distanceKm
 * @param {number} params.seatsTotal
 * @param {string} params.fuelType
 * @returns {number} recommendedPrice
 */
const calculateRecommendedPrice = ({ distanceKm, seatsTotal, fuelType = 'petrol' }) => {
    const costFactor = COST_PER_KM[fuelType] || COST_PER_KM.petrol;
    
    // Total cost of trip
    const totalCost = distanceKm * costFactor;
    
    // Price per seat (split cost between all seats)
    const pricePerSeat = totalCost / seatsTotal;
    
    // Round to nearest 10 for "clean" numbers
    const roundedPrice = Math.round(pricePerSeat / 10) * 10;
    
    return Math.max(roundedPrice, MIN_PRICE);
};

module.exports = { calculateRecommendedPrice, COST_PER_KM };
