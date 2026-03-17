require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const RideOffer = require('../models/RideOffer');
const RideRequest = require('../models/RideRequest');

/**
 * Script to drop all indexes on RideOffer and RideRequest collections
 * and recreate them based on the current schema definitions.
 * Fixes "Can't extract geo keys: unknown GeoJSON type" by ensuring
 * 2dsphere indexes only target valid GeoJSON fields.
 */
const syncIndexes = async () => {
    try {
        await connectDB();
        console.log('🔄 Connected to MongoDB for index synchronization...');

        // 1. Clean RideOffer Indexes
        console.log('📍 Processing RideOffer collection...');
        await RideOffer.collection.dropIndexes();
        console.log('✅ Dropped all indexes on RideOffer.');
        await RideOffer.createIndexes();
        console.log('✅ Recreated correct indexes on RideOffer.');

        // 2. Clean RideRequest Indexes
        console.log('📍 Processing RideRequest collection...');
        await RideRequest.collection.dropIndexes();
        console.log('✅ Dropped all indexes on RideRequest.');
        await RideRequest.createIndexes();
        console.log('✅ Recreated correct indexes on RideRequest.');

        console.log('🎉 Index synchronization complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error syncing indexes:', err);
        process.exit(1);
    }
};

syncIndexes();
