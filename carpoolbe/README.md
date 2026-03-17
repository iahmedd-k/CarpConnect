# CarpConnect Backend API

This is the production-ready Node.js/Express backend for the CarpConnect peer-to-peer carpooling platform.

## Features
- **Clean Architecture:** Separated models, controllers, services, routes, and config.
- **Geospatial Matching:** Powered by Turf.js and MongoDB 2dsphere indexes.
- **Real-Time:** Socket.io integrated with JWT authentication.
- **Security First:** Helmet, rate-limiting, and Joi/Zod parameter validation.
- **Payments Ready:** Stripe integration for splitting fares and platform fees.
- **Emissions Tracker:** Calculates CO₂ savings per ride.

## Getting Started

1. Check out the `.env.example` file and create a `.env` file from it.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

## API Modules

- **Auth:** JWT and Role-based access logic
- **Rides Engine:** Offers, Requests, and Geospatial proximity matching
- **Bookings:** Fare calculation and Ride Lifecycle
- **Real-time Chat:** Socket.io with persistent DB backup
- **Emissions:** Sustainability calculations
