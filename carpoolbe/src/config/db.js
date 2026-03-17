const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas with retry logic.
 * Emits process exit on unrecoverable failure.
 */
const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌  MONGODB_URI is not defined in environment variables.');
        process.exit(1);
    }

    const options = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    };

    let retries = 5;
    while (retries > 0) {
        try {
            await mongoose.connect(uri, options);
            console.log('✅  MongoDB connected successfully.');
            break;
        } catch (err) {
            retries -= 1;
            console.error(`❌  MongoDB connection failed. Retries left: ${retries}. Error: ${err.message}`);
            if (retries === 0) process.exit(1);
            await new Promise((res) => setTimeout(res, 5000)); // wait 5s before retry
        }
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌  MongoDB error:', err.message);
    });
};

module.exports = connectDB;
