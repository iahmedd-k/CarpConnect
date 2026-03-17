const Joi = require('joi');

/**
 * validators.js — Joi schemas for all request bodies.
 * Each schema is exported individually for use in route handlers.
 */

// ── Auth ─────────────────────────────────────────────────────────────────────

const signupSchema = Joi.object({
    name: Joi.string().min(2).max(80).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(7).max(20).optional(),
    password: Joi.string().min(8).max(64).required(),
    role: Joi.string().valid('rider', 'driver', 'both').default('rider'),
    vehicle: Joi.when('role', {
        is: Joi.valid('driver', 'both'),
        then: Joi.object({
            make: Joi.string().required(),
            model: Joi.string().required(),
            year: Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).required(),
            plateNumber: Joi.string().required(),
            seats: Joi.number().integer().min(2).max(9).default(4),
            fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid', 'cng').default('petrol'),
        }).optional(),
        otherwise: Joi.optional(),
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// ── Ride Offer ────────────────────────────────────────────────────────────────

const coordinatesSchema = Joi.array().items(Joi.number()).length(2);
const pointSchema = Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: coordinatesSchema.required(),
});

const rideOfferSchema = Joi.object({
    origin: Joi.object({
        address: Joi.string().required(),
        point: pointSchema.optional(),
    }).required(),
    destination: Joi.object({
        address: Joi.string().required(),
        point: pointSchema.optional(),
    }).required(),
    departureTime: Joi.date().required(),
    seatsTotal: Joi.number().integer().min(1).max(9).required(),
    pricePerSeat: Joi.number().min(0).optional(),
    currency: Joi.string().length(3).default('PKR'),
    preferences: Joi.object({
        smokingAllowed: Joi.boolean().default(false),
        petsAllowed: Joi.boolean().default(false),
        musicAllowed: Joi.boolean().default(true),
        maxDetourKm: Joi.number().min(0).max(50).default(5),
    }).optional(),
});

// ── Ride Request ──────────────────────────────────────────────────────────────

const rideRequestSchema = Joi.object({
    origin: Joi.object({
        address: Joi.string().required(),
        point: pointSchema.optional(),
    }).required(),
    destination: Joi.object({
        address: Joi.string().required(),
        point: pointSchema.optional(),
    }).required(),
    earliestDeparture: Joi.date().required(),
    latestDeparture: Joi.date().required(),
    seatsNeeded: Joi.number().integer().min(1).max(8).default(1),
    maxPricePerSeat: Joi.number().min(0).optional(),
    preferences: Joi.object({
        smokingAllowed: Joi.boolean().default(false),
        petsAllowed: Joi.boolean().default(false),
    }).optional(),
});

// ── Booking ───────────────────────────────────────────────────────────────────

const bookingSchema = Joi.object({
    matchId: Joi.string().required(),
    paymentMethodId: Joi.string().optional(),
});

// ── Chat ──────────────────────────────────────────────────────────────────────

const chatMessageSchema = Joi.object({
    bookingId: Joi.string().required(),
    content: Joi.string().min(1).max(1000).required(),
    type: Joi.string().valid('text', 'image').default('text'),
});

// ── Payment split ─────────────────────────────────────────────────────────────

const paymentSplitSchema = Joi.object({
    bookingId: Joi.string().required(),
    paymentMethodId: Joi.string().required(),
});

// ── Validation runner ─────────────────────────────────────────────────────────

/**
 * Validates request body against a Joi schema.
 * Returns formatted error on failure; calls next() on success.
 */
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        console.warn('❌ Validation Error:', error.details.map((d) => d.message));
        return res.status(422).json({
            success: false,
            message: 'Validation error',
            errors: error.details.map((d) => d.message),
        });
    }

    req.body = value; // replace body with sanitised value
    next();
};

module.exports = {
    validate,
    signupSchema,
    loginSchema,
    rideOfferSchema,
    rideRequestSchema,
    bookingSchema,
    chatMessageSchema,
    paymentSplitSchema,
};
