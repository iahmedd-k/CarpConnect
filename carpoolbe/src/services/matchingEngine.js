const RideOffer = require('../models/RideOffer');
const RideRequest = require('../models/RideRequest');
const Match = require('../models/Match');
const {
    haversineDistance,
    nearestPointOnRoute,
    calculateDetour,
    buildLineString,
    routeOverlapScore,
} = require('../utils/geoUtils');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * matchingEngine.js — Core ride-matching algorithm
 *
 * Algorithm overview (MVP):
 *   1. Spatial pre-filter: find offers whose origin is within radiusKm of
 *      the rider's pickup using MongoDB $geoWithin / geospatial query.
 *   2. Time filter: driver must depart within the rider's time window.
 *   3. Seat availability check.
 *   4. Detour feasibility: extra km must be ≤ driver's maxDetourKm preference.
 *   5. Route overlap score: how much of the rider's journey lies on the
 *      driver's planned route.
 *   6. Composite score computation (weighted average of overlap, detour, time).
 *   7. Suggest pickup/dropoff points (nearest points on driver's route).
 *   8. Persist Match documents; return ranked list.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Scoring weights (must sum to 1) ──────────────────────────────────────────
const WEIGHTS = {
    overlap: 0.45,   // how well the rider's route lies within the driver's route
    detour: 0.30,    // penalise large detours for the driver
    time: 0.15,      // reward closer departure times
    price: 0.10,     // reward offers within rider's budget
};

const MAX_SEARCH_RADIUS_KM = 50; // widened to 50km to cover city-wide searches
const MAX_RESULTS = 10;

/**
 * Normalises a detour km value into a 0–1 penalty score.
 * 0 km detour → 1.0 (best);  maxAllowed km detour → 0.0 (worst)
 */
const detourScore = (detourKm, maxDetourKm) =>
    Math.max(0, 1 - detourKm / Math.max(maxDetourKm, 1));

/**
 * Normalises a time difference (in minutes) into a 0–1 score.
 * 0-min difference → 1.0; ≥ 60-min difference → 0.0
 */
const timeScore = (diffMinutes) => Math.max(0, 1 - diffMinutes / 60);

/**
 * Normalises price: if offer price ≤ rider's max, score is 1; else 0.
 */
const priceScore = (offerPrice, riderMaxPrice) => {
    if (!riderMaxPrice) return 1; // rider has no price preference
    return offerPrice <= riderMaxPrice ? 1 : 0;
};

/**
 * Main matching function.
 *
 * @param {string} requestId  RideRequest document ID
 * @returns {Match[]} Array of created Match documents sorted by score descending
 */
const findMatches = async (requestId) => {
    // ── 1. Load the ride request ───────────────────────────────────────────────
    const request = await RideRequest.findById(requestId).lean();
    if (!request) throw new Error('RideRequest not found');
    if (request.status !== 'open') throw new Error('RideRequest is not open');

    const { origin, destination, earliestDeparture, latestDeparture, seatsNeeded, maxPricePerSeat } =
        request;

    // ── 2. Spatial pre-filter ─────────────────────────────────────────────────
    // FIX: Include both 'scheduled' AND 'active' offers (default status is 'scheduled')
    let candidateOffers = [];

    // [0,0] is used as a dummy placeholder when geocoding fails (see createRequest)
    const isRealCoord = (c) => c && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]) &&
        !(c[0] === 0 && c[1] === 0);
    const hasCoords = isRealCoord(origin?.point?.coordinates) &&
        isRealCoord(destination?.point?.coordinates);

    if (hasCoords) {
        // Geospatial search when we have real coordinates
        candidateOffers = await RideOffer.find({
            status: { $in: ['scheduled', 'active', 'live'] }, // FIX: was only 'active'
            seatsAvailable: { $gte: seatsNeeded },
            departureTime: {
                $gte: earliestDeparture,
                $lte: latestDeparture
            },
            'origin.point': {
                $nearSphere: {
                    $geometry: { type: 'Point', coordinates: origin.point.coordinates },
                    $maxDistance: MAX_SEARCH_RADIUS_KM * 1000, // metres
                },
            },
        })
            .populate('driver', 'name avatar ratings vehicle')
            .lean();
    } else {
        // TEXT FALLBACK: When rider has no GPS coords, search by destination address text
        const destAddr = destination?.address || '';
        const textQuery = destAddr.trim();
        const origAddr = origin?.address?.trim() || '';
        // Skip placeholder origins like "Any Location", "Current Location", etc.
        const GENERIC_ORIGINS = ['any location', 'current location', 'my location', 'here', 'pickup', ''];
        const isGenericOrigin = GENERIC_ORIGINS.some(g => origAddr.toLowerCase() === g || origAddr.toLowerCase().includes('any') || origAddr.toLowerCase().includes('current'));
        
        if (textQuery.length >= 2) {
            const textFilter = {
                status: { $in: ['scheduled', 'active', 'live'] },
                seatsAvailable: { $gte: seatsNeeded },
                departureTime: { $gte: earliestDeparture, $lte: latestDeparture },
                'destination.address': new RegExp(textQuery, 'i'),
            };

            // Only add origin filter if it's a real address
            if (origAddr.length >= 2 && !isGenericOrigin) {
                textFilter['origin.address'] = new RegExp(origAddr, 'i');
            }

            candidateOffers = await RideOffer.find(textFilter)
                .populate('driver', 'name avatar ratings vehicle')
                .limit(MAX_RESULTS)
                .lean();
        }
    }

    if (!candidateOffers.length) return [];

    // ── 3–7. Score each candidate ─────────────────────────────────────────────
    const scoredMatches = [];

    // Check whether we have real rider coordinates for geo calculations
    const riderHasOriginCoords = isRealCoord(origin?.point?.coordinates);
    const riderHasDestCoords = isRealCoord(destination?.point?.coordinates);

    const requestMidTime = new Date(
        (new Date(earliestDeparture).getTime() + new Date(latestDeparture).getTime()) / 2
    );

    for (const offer of candidateOffers) {
        try {
            const { preferences = {} } = offer;
            const maxDetourKm = preferences.maxDetourKm ?? 5;

            // Time score — always available
            const timeDiffMin =
                Math.abs(new Date(offer.departureTime).getTime() - requestMidTime.getTime()) / 60000;
            const tScore = timeScore(timeDiffMin);

            // Price score — always available
            const pScore = priceScore(offer.pricePerSeat, maxPricePerSeat);

            let compositeScore;
            let metrics;

            if (riderHasOriginCoords && riderHasDestCoords) {
                // ── FULL GEO SCORING PATH ────────────────────────────────────────
                const driverRoute = buildLineString([
                    offer.origin.point.coordinates,
                    offer.destination.point.coordinates,
                ]);

                // Detour feasibility — skip if too much detour
                const detourKm = calculateDetour(
                    offer.origin.point.coordinates,
                    offer.destination.point.coordinates,
                    origin.point.coordinates,
                    destination.point.coordinates
                );
                if (detourKm > maxDetourKm * 3) continue; // relaxed: allow 3x maxDetour

                const overlap = routeOverlapScore(
                    origin.point.coordinates,
                    destination.point.coordinates,
                    driverRoute
                );

                compositeScore = Math.round(
                    (WEIGHTS.overlap * overlap +
                        WEIGHTS.detour * detourScore(detourKm, maxDetourKm) +
                        WEIGHTS.time * tScore +
                        WEIGHTS.price * pScore) * 100
                );

                const { point: suggestedPickup, distanceKm: pickupDevKm } = nearestPointOnRoute(
                    origin.point.coordinates, driverRoute
                );
                const { point: suggestedDropoff, distanceKm: dropoffDevKm } = nearestPointOnRoute(
                    destination.point.coordinates, driverRoute
                );

                metrics = {
                    detourKm: parseFloat(detourKm.toFixed(2)),
                    pickupDeviationM: Math.round(pickupDevKm * 1000),
                    dropoffDeviationM: Math.round(dropoffDevKm * 1000),
                    routeOverlapScore: parseFloat(overlap.toFixed(3)),
                    suggestedPickup: suggestedPickup.geometry,
                    suggestedDropoff: suggestedDropoff.geometry,
                    estimatedDistanceKm: offer.estimatedDistanceKm,
                    estimatedDurationMin: offer.estimatedDurationMin,
                };
            } else {
                // ── TEXT-ONLY FALLBACK SCORING ──────────────────────────────────
                // No rider coordinates — score purely on time + price (geo = 0.75 baseline)
                compositeScore = Math.round(
                    (0.75 + // baseline overlap score for text matches
                        WEIGHTS.time * tScore +
                        WEIGHTS.price * pScore) * 100
                );

                metrics = {
                    detourKm: 0,
                    pickupDeviationM: 0,
                    dropoffDeviationM: 0,
                    routeOverlapScore: 0.75,
                    estimatedDistanceKm: offer.estimatedDistanceKm,
                    estimatedDurationMin: offer.estimatedDurationMin,
                };
            }

            scoredMatches.push({ offer, score: Math.max(0, Math.min(100, compositeScore)), metrics });
        } catch (err) {
            // Never let a single offer crash the whole search
            console.warn(`⚠️ Skipped offer ${offer._id} due to scoring error: ${err.message}`);
        }
    }

    // ── 5. Sort by score descending; slice to top MAX_RESULTS ─────────────────
    scoredMatches.sort((a, b) => b.score - a.score);
    const topMatches = scoredMatches.slice(0, MAX_RESULTS);

    // ── 6. Persist Match documents ────────────────────────────────────────────
    const savedMatches = [];
    for (const { offer, score, metrics } of topMatches) {
        // Upsert to avoid duplicates if re-run
        const match = await Match.findOneAndUpdate(
            { request: request._id, offer: offer._id },
            {
                request: request._id,
                offer: offer._id,
                rider: request.rider,
                driver: offer.driver._id || offer.driver,
                metrics,
                score,
                status: 'pending',
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
            { upsert: true, new: true }
        );
        savedMatches.push(match);
    }

    return savedMatches;
};

module.exports = { findMatches };
