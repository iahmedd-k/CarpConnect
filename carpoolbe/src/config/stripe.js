const Stripe = require('stripe');

let stripeClient = null;

/**
 * Returns a configured Stripe client.
 * Gracefully disabled when STRIPE_SECRET_KEY is absent.
 */
const getStripeClient = () => {
    if (stripeClient) return stripeClient;

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        console.warn('⚠️  STRIPE_SECRET_KEY not set — payment features disabled.');
        return null;
    }

    stripeClient = Stripe(key, { apiVersion: '2023-10-16' });
    console.log('✅  Stripe client ready.');
    return stripeClient;
};

module.exports = { getStripeClient };
