const turf = require('@turf/turf');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * geoUtils.js — Geospatial helper functions built on Turf.js
 * All coordinates follow GeoJSON order: [longitude, latitude]
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Converts a [lng, lat] coordinate pair into a GeoJSON Point Feature.
 * @param {[number, number]} coordinates
 * @returns {GeoJSON.Feature<GeoJSON.Point>}
 */
const toPoint = (coordinates) => turf.point(coordinates);

/**
 * Calculates straight-line (haversine) distance between two coordinate pairs.
 * @param {[number, number]} from  [lng, lat]
 * @param {[number, number]} to    [lng, lat]
 * @param {'kilometers'|'meters'|'miles'} units
 * @returns {number}
 */
const haversineDistance = (from, to, units = 'kilometers') => {
    return turf.distance(turf.point(from), turf.point(to), { units });
};

/**
 * Finds the nearest point on a route LineString to a given coordinate.
 * Used to determine the best pickup/dropoff point on the driver's route.
 *
 * @param {[number, number]} coord          [lng, lat] of the rider's location
 * @param {GeoJSON.Feature<GeoJSON.LineString>} routeLine  Driver's route as a LineString
 * @returns {{ point: GeoJSON.Feature<GeoJSON.Point>, distanceKm: number }}
 */
const nearestPointOnRoute = (coord, routeLine) => {
    const pt = turf.point(coord);
    const snapped = turf.nearestPointOnLine(routeLine, pt, { units: 'kilometers' });
    return {
        point: snapped,
        distanceKm: snapped.properties.dist,
    };
};

/**
 * Calculates extra distance (detour) a driver would travel to include a rider.
 *
 * Strategy:
 *   original route length  vs.
 *   driver → pickup → dropoff → driver destination
 *
 * @param {[number, number]} driverOrigin
 * @param {[number, number]} driverDest
 * @param {[number, number]} riderPickup
 * @param {[number, number]} riderDropoff
 * @returns {number} detour in km
 */
const calculateDetour = (driverOrigin, driverDest, riderPickup, riderDropoff) => {
    const originalDist = haversineDistance(driverOrigin, driverDest);
    const detourDist =
        haversineDistance(driverOrigin, riderPickup) +
        haversineDistance(riderPickup, riderDropoff) +
        haversineDistance(riderDropoff, driverDest);
    return Math.max(0, detourDist - originalDist);
};

/**
 * Builds a GeoJSON LineString from an array of coordinate pairs.
 * @param {[number, number][]} coordinates
 * @returns {GeoJSON.Feature<GeoJSON.LineString>}
 */
const buildLineString = (coordinates) => turf.lineString(coordinates);

/**
 * Checks whether a coordinate is within a given radius of another coordinate.
 * @param {[number, number]} center
 * @param {[number, number]} point
 * @param {number} radiusKm
 * @returns {boolean}
 */
const isWithinRadius = (center, point, radiusKm) => {
    return haversineDistance(center, point) <= radiusKm;
};

/**
 * Computes how much of the rider's route overlaps with the driver's route (0–1).
 * Approximated by sampling points along the rider segment and checking proximity.
 *
 * @param {[number, number]} riderPickup
 * @param {[number, number]} riderDropoff
 * @param {GeoJSON.Feature<GeoJSON.LineString>} driverRoute
 * @param {number} toleranceKm  points within this distance count as "on route"
 * @returns {number} score 0–1
 */
const routeOverlapScore = (riderPickup, riderDropoff, driverRoute, toleranceKm = 0.5) => {
    const riderLine = turf.lineString([riderPickup, riderDropoff]);
    // Sample 10 intermediate points
    const length = turf.length(riderLine, { units: 'kilometers' });
    const samples = 10;
    let onRoute = 0;

    for (let i = 0; i <= samples; i++) {
        const fraction = i / samples;
        const along = turf.along(riderLine, fraction * length, { units: 'kilometers' });
        const { distanceKm } = nearestPointOnRoute(along.geometry.coordinates, driverRoute);
        if (distanceKm <= toleranceKm) onRoute++;
    }

    return onRoute / (samples + 1);
};

module.exports = {
    toPoint,
    haversineDistance,
    nearestPointOnRoute,
    calculateDetour,
    buildLineString,
    isWithinRadius,
    routeOverlapScore,
};
