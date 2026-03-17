const Redis = require('ioredis');

let redisClient = null;

/**
 * Initialise Redis client.
 * If REDIS_URL is not set the app still runs — caching is simply skipped.
 */
const connectRedis = () => {
    const url = process.env.REDIS_URL;
    if (!url) {
        console.warn('⚠️  REDIS_URL not set — Redis caching disabled.');
        return null;
    }

    const client = new Redis(url, {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 5) return null; // stop retrying after 5 attempts
            return Math.min(times * 200, 2000);
        },
    });

    client.on('connect', () => console.log('✅  Redis connected.'));
    client.on('error', (err) => console.error('❌  Redis error:', err.message));
    client.on('close', () => console.warn('⚠️  Redis connection closed.'));

    redisClient = client;
    return client;
};

/** Retrieve the singleton Redis client (may be null). */
const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
