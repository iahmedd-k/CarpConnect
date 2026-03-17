const Booking = require('../models/Booking');
const Match = require('../models/Match');
const RideOffer = require('../models/RideOffer');
const RideRequest = require('../models/RideRequest');
const { getStripeClient, createPaymentIntent } = require('../services/paymentService');
const { createReport } = require('../services/emissionsService');
const { createNotification } = require('./notificationController');

const createBooking = async (req, res, next) => {
    try {
        const { matchId, paymentMethodId } = req.body;

        const match = await Match.findById(matchId).populate('offer request');
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found or expired.' });
        }

        if (match.rider.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        }

        // Prevent duplicate bookings
        const existingBooking = await Booking.findOne({ rider: req.user._id, match: matchId });
        if (existingBooking) {
            return res.status(409).json({ success: false, message: 'You have already booked this ride.' });
        }

        // Determine fare multiplier depending on req seats
        const totalFare = match.offer.pricePerSeat * match.request.seatsNeeded;
        const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT) || 10;

        // Initial status is pending as per PRD
        const newBooking = await Booking.create({
            match: match._id,
            rider: match.rider,
            driver: match.driver,
            offer: match.offer._id,
            request: match.request._id,
            seatsRequested: match.request.seatsNeeded,
            fare: {
                totalAmount: totalFare,
                currency: match.offer.currency,
                platformFeePercent,
            },
            status: 'pending'
        });

        // Notify Driver via Socket
        await createNotification({
            userId: match.driver,
            type: 'newBookingRequest',
            title: 'New Ride Request!',
            body: `${req.user.name || 'A rider'} wants to join your ride. View it in Manage Requests.`,
            link: '/driver-dashboard',
            metadata: { bookingId: newBooking._id, seatsRequested: newBooking.seatsRequested }
        });

        // Payment Processing (if applicable, though usually later in confirm flow)
        if (process.env.STRIPE_SECRET_KEY && getStripeClient()) {
            const { clientSecret, paymentIntentId } = await createPaymentIntent({
                booking: newBooking,
                rider: req.user,
                paymentMethodId
            });

            return res.status(201).json({
                success: true,
                message: 'Booking request sent. Awaiting driver approval.',
                data: { booking: newBooking, clientSecret, paymentIntentId }
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Booking request sent. Awaiting driver approval.',
            data: { booking: newBooking } 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all bookings for a user
 * @route   GET /api/bookings
 */
const getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({
            $or: [{ rider: req.user._id }, { driver: req.user._id }],
        })
            .populate('rider', 'name email avatar ratings')
            .populate('driver', 'name email avatar ratings vehicle')
            .populate({
                path: 'offer',
                select: 'origin destination departureTime pricePerSeat seatsTotal seatsAvailable estimatedDistanceKm estimatedDurationMin currency status vehicle',
                populate: { path: 'driver', select: 'name vehicle ratings' }
            })
            .sort({ createdAt: -1 })
            .lean();

        // Merge driver.vehicle into offer.vehicle if offer.vehicle is empty (fallback)
        const enriched = bookings.map(b => {
            if (b.offer && !b.offer.vehicle && b.driver?.vehicle) {
                b.offer.vehicle = b.driver.vehicle;
            }
            return b;
        });

        res.status(200).json({ success: true, count: enriched.length, data: { bookings: enriched } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update booking status (Driver Accept/Reject or Cancel)
 * @route   PATCH /api/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id).populate('offer rider driver');

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const isDriver = booking.driver._id.toString() === req.user._id.toString();
        const isRider = booking.rider._id.toString() === req.user._id.toString();

        if (!isDriver && !isRider) {
            return res.status(403).json({ success: false, message: 'Not authorised.' });
        }

        // Check for state transitions
        if (isDriver) {
            if (status === 'confirmed' && booking.status === 'pending') {
                // ATOMIC SEAT DECREMENT
                const updatedOffer = await RideOffer.findOneAndUpdate(
                    { _id: booking.offer._id, seatsAvailable: { $gte: booking.seatsRequested || 1 } },
                    { $inc: { seatsAvailable: -(booking.seatsRequested || 1) } },
                    { new: true }
                );

                if (!updatedOffer) {
                    return res.status(409).json({ success: false, message: 'No seats available for this ride.' });
                }

                booking.status = 'confirmed';
                
                await createNotification({
                    userId: booking.rider._id,
                    type: 'bookingConfirmed',
                    title: 'Booking Confirmed!',
                    body: `${booking.driver.name} accepted your ride request.`,
                    link: '/dashboard',
                    metadata: { bookingId: booking._id }
                });
            } 
            else if (status === 'rejected' && booking.status === 'pending') {
                booking.status = 'rejected';
                await createNotification({
                    userId: booking.rider._id,
                    type: 'bookingRejected',
                    title: 'Request Rejected',
                    body: `Sorry, ${booking.driver.name} declined your ride request.`,
                    link: '/dashboard',
                    metadata: { bookingId: booking._id }
                });
            }
            else if (status === 'completed' && booking.status === 'confirmed') {
                booking.status = 'completed';
            }
            else if (status === 'cancelled') {
                if (booking.status === 'confirmed') {
                    // Restore seats if it was confirmed (before pickup)
                    await RideOffer.findByIdAndUpdate(booking.offer._id, {
                        $inc: { seatsAvailable: booking.seatsRequested || 1 },
                    });
                    
                    // Remove stops if they exist
                    const offer = await RideOffer.findById(booking.offer._id);
                    if (offer && offer.stops) {
                        offer.stops = offer.stops.filter(s => s.bookingId.toString() !== booking._id.toString());
                        await offer.save();
                    }
                    booking.status = 'cancelled';
                } else if (booking.status === 'picked_up') {
                    // Do NOT free seat if already picked up
                    const offer = await RideOffer.findById(booking.offer._id);
                    if (offer && offer.stops) {
                        // Remove only dropoff
                        offer.stops = offer.stops.filter(s => !(s.bookingId.toString() === booking._id.toString() && s.type === 'dropoff'));
                        
                        // Check if all remaining stops are done -> completes ride
                        if (offer.stops.length > 0 && offer.stops.every(s => s.completed)) {
                            offer.status = 'completed';
                            offer.completedAt = new Date();
                        }
                        await offer.save();
                    }
                    booking.status = 'cancelled_partial';
                } else {
                    booking.status = 'cancelled';
                }
                await createNotification({
                    userId: booking.rider._id,
                    type: 'bookingCanceled',
                    title: 'Ride Cancelled',
                    body: `The driver has cancelled the ride.`,
                    link: '/dashboard'
                });
            }
            else {
                return res.status(400).json({ success: false, message: 'Invalid status transition.' });
            }
        } 
        else if (isRider) {
            if (status === 'cancelled') {
                // Same logic for rider
                if (booking.status === 'confirmed') {
                    await RideOffer.findByIdAndUpdate(booking.offer._id, {
                        $inc: { seatsAvailable: booking.seatsRequested || 1 },
                    });
                    const offer = await RideOffer.findById(booking.offer._id);
                    if (offer && offer.stops) {
                        offer.stops = offer.stops.filter(s => s.bookingId.toString() !== booking._id.toString());
                        await offer.save();
                    }
                    booking.status = 'cancelled';
                } else if (booking.status === 'picked_up') {
                    const offer = await RideOffer.findById(booking.offer._id);
                    if (offer && offer.stops) {
                        offer.stops = offer.stops.filter(s => !(s.bookingId.toString() === booking._id.toString() && s.type === 'dropoff'));
                        if (offer.stops.length > 0 && offer.stops.every(s => s.completed)) {
                            offer.status = 'completed';
                            offer.completedAt = new Date();
                        }
                        await offer.save();
                    }
                    booking.status = 'cancelled_partial';
                } else {
                    booking.status = 'cancelled';
                }
                await createNotification({
                    userId: booking.driver._id,
                    type: 'bookingCanceled',
                    title: 'Rider Cancelled',
                    body: `${booking.rider.name} has cancelled their booking.`,
                    link: '/driver-dashboard'
                });
            } else {
                return res.status(400).json({ success: false, message: 'Riders can only cancel bookings.' });
            }
        }

        await booking.save();

        // Auto-trigger emissions report on completion
        if (status === 'completed') {
            try {
                await createReport({
                    bookingId: booking._id,
                    driverId: booking.driver._id,
                    riderIds: [booking.rider._id],
                    distanceKm: booking.offer.estimatedDistanceKm || 10,
                    fuelType: 'petrol',
                });
            } catch (emErr) {
                console.error('Failed to auto-create emissions report:', emErr.message);
            }
        }

        res.status(200).json({ success: true, data: { booking } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get driver earnings summary
 * @route   GET /api/bookings/earnings
 */
const getEarnings = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {
            driver: req.user._id,
            status: 'completed'
        };

        if (startDate || endDate) {
            query.updatedAt = {};
            if (startDate) query.updatedAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.updatedAt.$lte = end;
            }
        }

        const completedBookings = await Booking.find(query).populate('rider', 'name').sort('-updatedAt');

        const totalEarnings = completedBookings.reduce((sum, b) => sum + b.fare.totalAmount, 0);
        const platformFees = completedBookings.reduce((sum, b) => sum + (b.fare.totalAmount * (b.fare.platformFeePercent / 100)), 0);
        const netEarnings = totalEarnings - platformFees;

        res.status(200).json({
            success: true,
            data: {
                totalBalance: netEarnings,
                totalRides: completedBookings.length,
                totalEarnings,
                platformFees,
                transactions: completedBookings.map(b => ({
                    id: b._id,
                    amount: b.fare.totalAmount,
                    date: b.updatedAt,
                    status: b.status,
                    riderName: b.rider?.name || 'Rider'
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get rider spending and savings summary
 * @route   GET /api/bookings/spending
 */
const getSpending = async (req, res, next) => {
    try {
        // Fetch bookings for the rider where status isn't cancelled/rejected
        const bookings = await Booking.find({
            rider: req.user._id,
            status: { $nin: ['cancelled', 'rejected'] }
        }).populate('offer', 'estimatedDistanceKm');

        let totalSpent = 0;
        let totalSavings = 0;
        let emissionsSaved = 0;
        
        const COST_PER_KM = 25;
        // assume an average car emits 0.192 kg CO2 per km
        const EMISSION_FACTOR = 0.192;

        bookings.forEach(b => {
            const amount = b.fare?.totalAmount || 0;
            totalSpent += amount;

            const dist = b.offer?.estimatedDistanceKm || 0;
            if (dist > 0) {
                // Solo cost
                const soloCost = dist * COST_PER_KM;
                const savings = soloCost - amount;
                if (savings > 0) {
                    totalSavings += savings;
                }

                // Emissions saved = dist * factor * passengers
                const passengers = b.seatsRequested || 1;
                emissionsSaved += (dist * EMISSION_FACTOR * passengers);
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalSpent,
                totalSavings,
                emissionsSaved: Math.round(emissionsSaved)
            }
        });
    } catch (error) {
        next(error);
    }
};

const { getIO } = require('../config/socket');

/**
 * @desc    Pickup a rider (Driver)
 * @route   POST /api/bookings/:id/pickup
 */
const pickupRider = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        booking.status = 'picked_up';
        await booking.save();

        const offer = await RideOffer.findById(booking.offer);
        if (offer && offer.stops && offer.stops.length > 0) {
            const stopIndex = offer.stops.findIndex(s => s.type === 'pickup' && s.bookingId.toString() === booking._id.toString() && !s.completed);
            if (stopIndex !== -1) {
                offer.stops[stopIndex].completed = true;
                
                if (offer.currentStopIndex === stopIndex) {
                    let nextIndex = offer.currentStopIndex + 1;
                    while (nextIndex < offer.stops.length && offer.stops[nextIndex].completed) {
                        nextIndex++;
                    }
                    offer.currentStopIndex = nextIndex;
                }
                // Check if all stops are done
                const allDone = offer.stops.every(s => s.completed);
                if (allDone) {
                    offer.status = 'completed';
                    offer.completedAt = new Date();
                }
                await offer.save();
            }
        }

        // Notify
        try {
            const io = getIO();
            io.to(`user:${booking.rider}`).emit('pickupSuccess', { bookingId: booking._id, message: 'You have been picked up!' });
            io.to(`ride:${booking.offer}`).emit('passengerPickedUp', { bookingId: booking._id, riderId: booking.rider });
        } catch (err) {}

        res.status(200).json({ success: true, data: { booking } });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Dropoff a rider (Driver)
 * @route   POST /api/bookings/:id/dropoff
 */
const dropoffRider = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('offer');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        booking.status = 'completed';
        await booking.save();

        const offer = await RideOffer.findById(booking.offer._id || booking.offer);
        if (offer && offer.stops && offer.stops.length > 0) {
            const stopIndex = offer.stops.findIndex(s => s.type === 'dropoff' && s.bookingId.toString() === booking._id.toString() && !s.completed);
            if (stopIndex !== -1) {
                offer.stops[stopIndex].completed = true;
                
                if (offer.currentStopIndex === stopIndex) {
                    let nextIndex = offer.currentStopIndex + 1;
                    while (nextIndex < offer.stops.length && offer.stops[nextIndex].completed) {
                        nextIndex++;
                    }
                    offer.currentStopIndex = nextIndex;
                }
                // Check if all stops are done
                const allDone = offer.stops.every(s => s.completed);
                if (allDone) {
                    offer.status = 'completed';
                    offer.completedAt = new Date();
                    
                    try {
                        const io = getIO();
                        io.to(`ride:${offer._id}`).emit('rideCompleted', {
                            rideId: offer._id,
                            completedAt: offer.completedAt
                        });
                    } catch (e) {}
                }
                await offer.save();
            }
        }

        // Notify
        try {
            const io = getIO();
            io.to(`user:${booking.rider}`).emit('dropoffSuccess', { bookingId: booking._id, message: 'You have arrived at your destination!' });
            io.to(`ride:${booking.offer._id}`).emit('passengerDroppedOff', { bookingId: booking._id, riderId: booking.rider });
        } catch (err) {}

        // Trigger emissions report
        const { createReport } = require('../services/emissionsService');
        try {
            await createReport({
                bookingId: booking._id,
                driverId: booking.driver,
                riderIds: [booking.rider],
                distanceKm: booking.offer.estimatedDistanceKm || 5,
                fuelType: 'petrol'
            });
        } catch (err) {
            console.error('Emissions report failed:', err.message);
        }

        res.status(200).json({ success: true, data: { booking } });
    } catch (error) {
        next(error);
    }
};

module.exports = { createBooking, getMyBookings, updateBookingStatus, getEarnings, getSpending, pickupRider, dropoffRider };
