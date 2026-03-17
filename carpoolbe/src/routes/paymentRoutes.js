const express = require('express');
const { getStripeClient } = require('../config/stripe');
const { handlePaymentSuccess, handlePaymentFailed } = require('../services/paymentService');

const router = express.Router();

/**
 * @desc    Stripe webhook endpoint
 * @route   POST /api/payments/webhook
 * @note    Must use express.raw() — added in app.js before JSON parser for this route
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const stripe = getStripeClient();
        if (!stripe) {
            return res.status(503).json({ success: false, message: 'Stripe not configured.' });
        }

        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!endpointSecret) {
            console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — webhook verification disabled.');
            return res.status(400).json({ success: false, message: 'Webhook secret not configured.' });
        }

        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error(`⚠️  Webhook signature verification failed:`, err.message);
            return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
        }

        // Handle the event
        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await handlePaymentFailed(event.data.object);
                    break;
                default:
                    console.log(`ℹ️  Unhandled Stripe event type: ${event.type}`);
            }
        } catch (err) {
            console.error('Error processing webhook event:', err.message);
            // Still return 200 to acknowledge receipt — Stripe retries on non-2xx
        }

        res.status(200).json({ received: true });
    }
);

module.exports = router;
