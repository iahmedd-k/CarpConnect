const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');

let io = null;

/**
 * Initialise Socket.io attached to an HTTP server.
 * Authenticates every connection via a JWT in the handshake auth object.
 *
 * Rooms strategy:
 *  - ride:<rideId>  — all participants of a specific ride
 *  - chat:<bookingId> — chat room per booking pair
 *  - user:<userId>  — private notifications channel
 */
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // ── JWT Auth Middleware ───────────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication error: no token provided'));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // attach user payload to socket
            next();
        } catch {
            next(new Error('Authentication error: invalid token'));
        }
    });

    // ── Connection Handler ────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const { id: userId } = socket.user;
        console.log(`🔌  Socket connected: ${socket.id} (user: ${userId})`);

        // Auto-join personal notification room
        socket.join(`user:${userId}`);

        // ── Room management ──────────────────────────────────────────────────────
        socket.on('join:ride', ({ rideId }) => {
            if (rideId) socket.join(`ride:${rideId}`);
        });

        socket.on('leave:ride', ({ rideId }) => {
            if (rideId) socket.leave(`ride:${rideId}`);
        });

        socket.on('join:chat', ({ bookingId }) => {
            if (bookingId) socket.join(`chat:${bookingId}`);
        });

        socket.on('leave:chat', ({ bookingId }) => {
            if (bookingId) socket.leave(`chat:${bookingId}`);
        });

        // ── Driver location broadcast (Product PRD) ──────────────────────────────────
        // Payload: { rideId, latitude, longitude, timestamp }
        socket.on('driverLocationUpdate', ({ rideId, latitude, longitude }) => {
            if (!rideId || latitude === undefined || longitude === undefined) return;
            
            socket.to(`ride:${rideId}`).emit('driverLocationUpdate', {
                rideId,
                latitude,
                longitude,
                timestamp: new Date().toISOString(),
            });
        });

        // ── Chat message relay + persistence ─────────────────────────────────────
        socket.on('chat:send', async ({ bookingId, content }) => {
            if (!bookingId || !content) return;

            try {
                // Persist to MongoDB before emitting
                const saved = await ChatMessage.create({
                    booking: bookingId,
                    sender: userId,
                    content,
                    type: 'text',
                });

                io.to(`chat:${bookingId}`).emit('chat:message', {
                    _id: saved._id,
                    senderId: userId,
                    content,
                    timestamp: saved.createdAt.toISOString(),
                });
            } catch (err) {
                console.error('Failed to persist chat message:', err.message);
                // Still emit for real-time UX even if persistence fails
                io.to(`chat:${bookingId}`).emit('chat:message', {
                    senderId: userId,
                    content,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌  Socket disconnected: ${socket.id}`);
        });
    });

    console.log('✅  Socket.io initialised.');
    return io;
};

/** Retrieve the singleton io instance. */
const getIO = () => {
    if (!io) throw new Error('Socket.io not initialised. Call initSocket(httpServer) first.');
    return io;
};

module.exports = { initSocket, getIO };
