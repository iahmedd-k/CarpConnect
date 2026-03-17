const axios = require('axios');

/**
 * routingService.js — Calls Mapbox / Google Maps Directions API to get
 * accurate route distance, duration, and encoded polyline.
 *
 * Falls back to straight-line (haversine) estimation if no API key is set
 * so the server still works in development without an API key.
 */

const MAPBOX_KEY = process.env.MAPBOX_API_KEY;

/**
 * Fetches route info using Mapbox Directions API.
 * @param {[number,number]} origin      [lng, lat]
 * @param {[number,number]} destination [lng, lat]
 * @returns {{ distanceKm, durationMin, polyline }}
 */
const fetchMapboxRoute = async (origin, destination) => {
    const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${origin[0]},${origin[1]};${destination[0]},${destination[1]}` +
        `?overview=full&geometries=geojson&access_token=${MAPBOX_KEY}`;

    const { data } = await axios.get(url, { timeout: 8000 });
    const route = data.routes?.[0];
    if (!route) throw new Error('Mapbox returned no routes');

    return {
        distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
        durationMin: parseFloat((route.duration / 60).toFixed(1)),
        polyline: route.geometry.coordinates, // Array of [lng, lat]
    };
};


/**
 * Haversine fallback (no API required).
 */
const haversineFallback = (origin, destination) => {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(destination[1] - origin[1]);
    const dLon = toRad(destination[0] - origin[0]);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(origin[1])) * Math.cos(toRad(destination[1])) * Math.sin(dLon / 2) ** 2;
    const distanceKm = parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2)) || 1.2; // Min 1.2km fallback
    const durationMin = parseFloat(((distanceKm / 40) * 60).toFixed(1)); // assume 40 km/h avg in city

    return { distanceKm, durationMin, polyline: null };
};

/**
 * Main routing function — auto-selects provider based on available API keys.
 * @param {[number,number]} origin
 * @param {[number,number]} destination
 * @returns {{ distanceKm, durationMin, polyline }}
 */
const getRoute = async (origin, destination) => {
    try {
        if (MAPBOX_KEY) return await fetchMapboxRoute(origin, destination);
        console.warn('⚠️  No Mapbox API key set — using haversine fallback.');
        return haversineFallback(origin, destination);
    } catch (err) {
        console.error('Routing API error, falling back to haversine:', err.message);
        return haversineFallback(origin, destination);
    }
};

/**
 * Geocodes an address string to { lat, lng } using OpenStreetMap Nominatim.
 */
const geocodeAddressOSM = async (address) => {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

        // Nominatim requires a user-agent header to comply with their TOS
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'CarpConnect-App/1.0' },
            timeout: 8000
        });

        if (!data || data.length === 0) {
            throw new Error(`Geocoding failed for ${address}`);
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        return { lat, lng };
    } catch (error) {
        console.error(`Error in geocodeAddressOSM: ${error.message}`);
        throw new Error(`Geocoding failed for ${address}`);
    }
};

module.exports = { getRoute, geocodeAddressOSM };

