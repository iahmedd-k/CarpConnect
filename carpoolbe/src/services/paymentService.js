const { getStripeClient } = require('../config/stripe');
const { splitFare } = require('../utils/fareSplit');
const Booking = require('../models/Booking');

/**
 * paymentService.js — Stripe payment operations.
 *
 * Flow for rider seat payment:
 *   1. Create / retrieve Stripe Customer for the rider.
 *   2. Create a PaymentIntent for the total fare.
 *   3. On webhook `payment_intent.succeeded`:
 *      a. Update Booking.payment.status to 'paid'.
 *      b. Transfer driver earnings to their Stripe Connect account.
 *
 * All amounts in smallest currency unit (cents).
 */

/**
 * Creates or retrieves a Stripe Customer for a user.
 *
 * @param {object} user  Mongoose User document
 * @returns {string} Stripe customer ID
 */
const getOrCreateStripeCustomer = async (user) => {
    const stripe = getStripeClient();
    if (!stripe) throw new Error('Stripe is not configured.');

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() },
    });

    // Persist the Stripe customer ID on the user record
    await user.updateOne({ stripeCustomerId: customer.id });

    return customer.id;
};

/**
 * Creates a Stripe PaymentIntent for a booking.
 *
 * @param {object} params
 * @param {object} params.booking   Booking document (populated)
 * @param {object} params.rider     User document
 * @param {string} params.paymentMethodId   Stripe payment method ID from frontend
 * @returns {{ clientSecret: string, paymentIntentId: string }}
 */
const createPaymentIntent = async ({ booking, rider, paymentMethodId }) => {
    const stripe = getStripeClient();
    if (!stripe) throw new Error('Stripe is not configured.');

    const customerId = await getOrCreateStripeCustomer(rider);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    const { totalAmount, currency } = booking.fare;

    const intent = await stripe.paymentIntents.create({
        amount: totalAmount, // in cents
        currency: currency.toLowerCase(),
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: false, // frontend confirms with clientSecret
        metadata: {
            bookingId: booking._id.toString(),
            riderId: rider._id.toString(),
            driverId: booking.driver.toString(),
        },
        capture_method: 'automatic',
    });

    // Persist payment intent ID and method on booking
    await Booking.findByIdAndUpdate(booking._id, {
        'payment.paymentIntentId': intent.id,
        'payment.paymentMethodId': paymentMethodId,
    });

    return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};

/**
 * Handles `payment_intent.succeeded` Stripe webhook event.
 * Updates booking status and optionally transfers earnings to driver.
 *
 * @param {object} paymentIntent  Stripe PaymentIntent object from webhook
 */
const handlePaymentSuccess = async (paymentIntent) => {
    const { bookingId, driverId } = paymentIntent.metadata;
    if (!bookingId) return;

    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    const fareBreakdown = splitFare(
        booking.fare.totalAmount,
        1,
        booking.fare.platformFeePercent
    );

    await Booking.findByIdAndUpdate(bookingId, {
        status: 'confirmed',
        'payment.status': 'paid',
        'payment.paidAt': new Date(),
        'fare.platformFeeAmount': fareBreakdown.platformFee,
        'fare.driverEarnings': fareBreakdown.driverEarnings,
    });

    console.log(`✅  Payment confirmed for booking ${bookingId}`);

    // TODO: If driver has a Stripe Connect account, transfer earnings:
    // await stripe.transfers.create({ amount: fareBreakdown.driverEarnings, ... });
};

/**
 * Handles `payment_intent.payment_failed` Stripe webhook event.
 */
const handlePaymentFailed = async (paymentIntent) => {
    const { bookingId } = paymentIntent.metadata;
    if (!bookingId) return;

    await Booking.findByIdAndUpdate(bookingId, {
        'payment.status': 'failed',
    });

    console.warn(`⚠️  Payment failed for booking ${bookingId}`);
};

/**
 * Initiates a refund for a booking.
 *
 * @param {string} bookingId
 * @returns {object} Stripe Refund object
 */
const refundBooking = async (bookingId) => {
    const stripe = getStripeClient();
    if (!stripe) throw new Error('Stripe is not configured.');

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new Error('Booking not found.');
    if (booking.payment.status !== 'paid') throw new Error('Booking has not been paid.');

    const refund = await stripe.refunds.create({
        payment_intent: booking.payment.paymentIntentId,
    });

    await Booking.findByIdAndUpdate(bookingId, {
        'payment.status': 'refunded',
        status: 'cancelled',
    });

    return refund;
};

module.exports = {
    getOrCreateStripeCustomer,
    createPaymentIntent,
    handlePaymentSuccess,
    handlePaymentFailed,
    refundBooking,
};
