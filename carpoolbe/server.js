require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { initSocket } = require('./src/config/socket');

process.on('uncaughtException', (err) => {
    console.error('❌  UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});

const startServer = async () => {
    // 1. Connect to database
    await connectDB();

    // 2. Connect to caching layer
    connectRedis();

    // 3. Create HTTP server & bind app
    const server = http.createServer(app);

    // 4. Initialise Socket.io
    initSocket(server);

    // 5. Start listening
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
        console.error('❌  UNHANDLED REJECTION! Shutting down...', err);
        server.close(() => process.exit(1));
    });
};

startServer();
