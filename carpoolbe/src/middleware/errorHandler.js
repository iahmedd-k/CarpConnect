/**
 * Global error handler middleware.
 * Must be registered LAST in app.js (after all routes).
 *
 * Formats errors consistently:
 * {
 *   success: false,
 *   message: string,
 *   errors?: string[],   // validation errors
 *   stack?: string       // only in development
 * }
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors;

    // ── Mongoose validation error ─────────────────────────────────────────────
    if (err.name === 'ValidationError') {
        statusCode = 422;
        message = 'Validation failed';
        errors = Object.values(err.errors).map((e) => e.message);
    }

    // ── Mongoose duplicate key ────────────────────────────────────────────────
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }

    // ── Mongoose cast error (invalid ObjectId) ────────────────────────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // ── JWT errors ────────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired.';
    }

    // ── Log in development ────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== 'production') {
        console.error('[ErrorHandler]', err);
    }

    const response = { success: false, message };
    if (errors) response.errors = errors;
    if (process.env.NODE_ENV === 'development') response.stack = err.stack;

    res.status(statusCode).json(response);
};

/**
 * Convenience factory for creating operational errors.
 * Usage: next(createError(404, 'Ride not found'))
 */
const createError = (statusCode, message) => {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
};

module.exports = { errorHandler, createError };
