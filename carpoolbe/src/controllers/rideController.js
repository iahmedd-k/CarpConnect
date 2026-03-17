const RideOffer = require("../models/RideOffer");
const RideRequest = require("../models/RideRequest");
const Match = require("../models/Match");
const Booking = require("../models/Booking");
const { findMatches } = require("../services/matchingEngine");
const { getRoute, geocodeAddressOSM } = require("../services/routingService");
const { calculateRecommendedPrice } = require("../services/pricingService");

/**
 * @desc    Publish a new ride offer (Driver)
 * @route   POST /api/rides/offers
 */
const createOffer = async (req, res, next) => {
  try {
    console.log(
      "🚀 Incoming Ride Offer Payload:",
      JSON.stringify(req.body, null, 2),
    );

    let {
      origin,
      destination,
      departureTime,
      seatsTotal,
      preferences,
      currency,
    } = req.body;
    let { pricePerSeat } = req.body;

    // Transformation: Wrap coordinates into GeoJSON point if needed
    if (origin.coordinates && !origin.point) {
      origin.point = { type: "Point", coordinates: origin.coordinates };
    }
    if (destination.coordinates && !destination.point) {
      destination.point = {
        type: "Point",
        coordinates: destination.coordinates,
      };
    }

    // If point/coordinates are missing, geocode from address
    if (!origin.point || !origin.point.coordinates) {
      console.log("🌍 Geocoding origin address...");
      try {
        const coords = await geocodeAddressOSM(origin.address);
        origin.point = { type: "Point", coordinates: [coords.lng, coords.lat] };
      } catch (err) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Geocoding failed for origin: ${origin.address}`,
          });
      }
    }
    if (!destination.point || !destination.point.coordinates) {
      console.log("🌍 Geocoding destination address...");
      try {
        const coords = await geocodeAddressOSM(destination.address);
        destination.point = {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        };
      } catch (err) {
        return res
          .status(400)
          .json({
            success: false,
            message: `Geocoding failed for destination: ${destination.address}`,
          });
      }
    }

    // Use routing service for real distance/polyline
    const { distanceKm, durationMin, polyline } = await getRoute(
      origin.point.coordinates,
      destination.point.coordinates,
    );

    // Auto-calculate price if not provided
    if (
      pricePerSeat === undefined ||
      pricePerSeat === null ||
      pricePerSeat === 0
    ) {
      pricePerSeat = calculateRecommendedPrice({
        distanceKm,
        seatsTotal: seatsTotal || 1,
        fuelType: req.user.vehicle?.fuelType || "petrol",
      });
    }

    const offer = await RideOffer.create({
      driver: req.user._id,
      origin: {
        address: origin.address,
        point: origin.point,
      },
      destination: {
        address: destination.address,
        point: destination.point,
      },
      routePolyline: polyline,
      estimatedDistanceKm: distanceKm,
      estimatedDurationMin: durationMin,
      departureTime,
      seatsTotal,
      seatsAvailable: seatsTotal,
      pricePerSeat,
      currency,
      preferences,
    });

    console.log("✅ Ride Offer created successfully:", offer._id);
    res.status(201).json({ success: true, data: { offer } });
  } catch (error) {
    console.error("❌ Create Offer Error:", error.message);
    if (error.errors) {
      const errorDetails = Object.values(error.errors).map((e) => e.message);
      console.error("🔍 Validation Details:", errorDetails);
    }
    next(error);
  }
};

/**
 * @desc    Create a new ride request (Rider)
 * @route   POST /api/rides/requests
 */
const createRequest = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      earliestDeparture,
      latestDeparture,
      seatsNeeded,
      maxPricePerSeat,
      preferences,
    } = req.body;

    // Transformation: If origin/destination have a 'coordinates' field but no 'point', wrap them
    if (origin.coordinates && !origin.point) {
      origin.point = { type: "Point", coordinates: origin.coordinates };
    }
    if (destination.coordinates && !destination.point) {
      destination.point = {
        type: "Point",
        coordinates: destination.coordinates,
      };
    }

    // Best-effort geocoding — do NOT fail the request if geocoding fails.
    // The matching engine has a text-fallback path for when coords are missing.
    const GENERIC_PLACEHOLDERS = [
      "current location",
      "my location",
      "here",
      "pickup",
    ];

    const isGenericAddress = (addr) =>
      !addr || GENERIC_PLACEHOLDERS.some((p) => addr.toLowerCase().includes(p));

    if (!origin.point?.coordinates) {
      if (!isGenericAddress(origin.address)) {
        try {
          console.log("🌍 Geocoding origin address...");
          const coords = await geocodeAddressOSM(origin.address);
          origin.point = {
            type: "Point",
            coordinates: [coords.lng, coords.lat],
          };
        } catch (err) {
          console.warn(
            `⚠️  Origin geocoding failed for "${origin.address}" — continuing without coords`,
          );
          // Set a placeholder point so schema validation passes
          // Will be caught by text-fallback in matching engine
          origin.point = null;
        }
      }
    }

    if (!destination.point?.coordinates) {
      try {
        console.log("🌍 Geocoding destination address...");
        const coords = await geocodeAddressOSM(destination.address);
        destination.point = {
          type: "Point",
          coordinates: [coords.lng, coords.lat],
        };
      } catch (err) {
        console.warn(
          `⚠️  Destination geocoding failed for "${destination.address}" — continuing without coords`,
        );
        destination.point = null;
      }
    }

    // Build the document — handle null points gracefully
    const requestData = {
      rider: req.user._id,
      origin: {
        address: origin.address,
        ...(origin.point ? { point: origin.point } : {}),
      },
      destination: {
        address: destination.address,
        ...(destination.point ? { point: destination.point } : {}),
      },
      earliestDeparture,
      latestDeparture,
      seatsNeeded: seatsNeeded || 1,
      maxPricePerSeat,
      preferences,
    };

    // If we don't have point coordinates we need to supply dummy ones
    // (MongoDB 2dsphere index requires valid GeoJSON) — use [0,0] as impossible coords
    // The matching engine recognises hasCoords=false for these and uses text-search instead
    if (!requestData.origin.point) {
      requestData.origin.point = { type: "Point", coordinates: [0, 0] };
    }
    if (!requestData.destination.point) {
      requestData.destination.point = { type: "Point", coordinates: [0, 0] };
    }

    const request = await RideRequest.create(requestData);

    console.log("✅ Ride Request created:", request._id);
    res.status(201).json({ success: true, data: { request } });
  } catch (error) {
    console.error("❌ Create Request Error:", error.message);
    if (error.errors) {
      const errorDetails = Object.values(error.errors).map((e) => e.message);
      console.error("🔍 Validation Details:", errorDetails);
    }
    next(error);
  }
};

/**
 * @desc    Get matches for a given RideRequest
 * @route   GET /api/rides/requests/:requestId/matches
 */
const getMatches = async (req, res, next) => {
  try {
    const requestId = req.params.requestId;

    // Verify ownership
    const request = await RideRequest.findById(requestId);
    if (!request || request.rider.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorised." });
    }

    // Clear stale pending matches, then regenerate
    await Match.deleteMany({ request: requestId, status: "pending" });

    try {
      await findMatches(requestId);
    } catch (matchErr) {
      // Non-fatal — log but continue to return whatever matches were seeded
      console.warn(
        `⚠️ findMatches warning for request ${requestId}: ${matchErr.message}`,
      );
    }

    // Fetch from DB with deep population
    const matches = await Match.find({ request: requestId })
      .populate({
        path: "offer",
        populate: { path: "driver", select: "name avatar ratings vehicle" },
      })
      .populate("driver", "name avatar ratings vehicle")
      .sort("-score")
      .lean();

    // Safety: filter out any matches with missing offers
    const validMatches = matches.filter(
      (m) => m.offer && typeof m.offer === "object",
    );

    console.log(
      `✅ Returned ${validMatches.length} valid matches for request ${requestId}`,
    );

    res.status(200).json({
      success: true,
      results: validMatches.length,
      data: { matches: validMatches },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all ride offers
 * @route   GET /api/rides/offers
 */
const getOffers = async (req, res, next) => {
  try {
    const filter = {};

    // If status is provided, use it. Else default to active/live if not a self-filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // If driver role, filter by driver ID
    if (req.user.role === "driver" || req.user.role === "both") {
      filter.driver = req.user._id;
    }

    const offers = await RideOffer.find(filter)
      .sort("-createdAt")
      .populate("driver", "name avatar ratings");

    res.status(200).json({
      success: true,
      results: offers.length,
      data: { offers },
    });
  } catch (error) {
    next(error);
  }
};

const { getIO } = require("../config/socket");

/**
 * @desc    Start a ride (Driver)
 * @route   POST /api/rides/:id/start
 */
const startRide = async (req, res, next) => {
  try {
    const ride = await RideOffer.findById(req.params.id);
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    ride.status = "live";
    ride.startedAt = new Date();

    // Fetch all confirmed bookings to build smart itinerary (stops)
    const bookings = await Booking.find({
      offer: ride._id,
      status: "confirmed",
    }).populate("request");

    const pickups = [];
    const dropoffs = [];

    bookings.forEach((b) => {
      pickups.push({
        type: "pickup",
        bookingId: b._id,
        location: {
          address: b.request?.origin?.address,
          point: b.request?.origin?.point,
        },
        completed: false,
      });
      dropoffs.push({
        type: "dropoff",
        bookingId: b._id,
        location: {
          address: b.request?.destination?.address,
          point: b.request?.destination?.point,
        },
        completed: false,
      });
    });

    // Smart execution: all pickups first, then dropoffs (simple approximation)
    ride.stops = [...pickups, ...dropoffs];
    ride.currentStopIndex = 0;

    await ride.save();

    // Notify all participants
    try {
      const io = getIO();
      io.to(`ride:${ride._id}`).emit("rideStarted", {
        rideId: ride._id,
        driverId: ride.driver,
        startTime: ride.startedAt,
      });
    } catch (err) {
      console.error("Socket notification failed:", err.message);
    }

    res.status(200).json({ success: true, data: { ride } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete a ride (Driver)
 * @route   POST /api/rides/:id/complete
 */
const completeRide = async (req, res, next) => {
  try {
    const ride = await RideOffer.findById(req.params.id);
    if (!ride)
      return res
        .status(404)
        .json({ success: false, message: "Ride not found" });

    if (ride.driver.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    ride.status = "completed";
    ride.completedAt = new Date();
    ride.liveLocation = undefined;
    await ride.save();

    // Emit rideCompleted event
    try {
      const io = getIO();
      io.to(`ride:${ride._id}`).emit("rideCompleted", {
        rideId: ride._id,
        completedAt: ride.completedAt,
      });
    } catch (err) {
      console.error("Socket notification failed:", err.message);
    }

    res.status(200).json({ success: true, data: { ride } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get ride history
 * @route   GET /api/rides/history
 */
const getHistory = async (req, res, next) => {
  try {
    const filter = {
      driver: req.user._id,
      status: { $in: ["completed", "cancelled"] },
    };

    const offers = await RideOffer.find(filter).sort("-createdAt");

    res.status(200).json({
      success: true,
      results: offers.length,
      data: { offers },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Predictive search for addresses (Used in FindRide autocomplete)
 * @route   GET /api/rides/search?q=...
 */
const searchRides = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: { results: [] } });
    }

    const regex = new RegExp(q.trim(), "i");

    const offers = await RideOffer.find({
      $or: [{ "origin.address": regex }, { "destination.address": regex }],
      status: { $in: ["scheduled", "active", "live"] },
    })
      .limit(20)
      .select(
        "origin.address origin.point destination.address destination.point",
      )
      .lean(); // use .lean() for safety

    const addressMap = new Map();
    offers.forEach((o) => {
      // Guard against null point — some old records may have missing coordinates
      if (
        o.origin?.address?.match(regex) &&
        !addressMap.has(o.origin.address)
      ) {
        addressMap.set(o.origin.address, o.origin?.point?.coordinates || null);
      }
      if (
        o.destination?.address?.match(regex) &&
        !addressMap.has(o.destination.address)
      ) {
        addressMap.set(
          o.destination.address,
          o.destination?.point?.coordinates || null,
        );
      }
    });

    const results = Array.from(addressMap.entries())
      .slice(0, 8)
      .map(([address, coordinates]) => ({
        address,
        coordinates,
      }));

    res.status(200).json({ success: true, data: { results } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Public ride search by destination (homepage + dashboard)
 * @route   GET /api/rides/search-dest
 * @query   destination* | origin? | date? | seats?
 * @access  Public (no auth needed for browsing)
 */
const searchRidesPublic = async (req, res, next) => {
  try {
    const { destination, origin, date, seats } = req.query;

    if (!destination || destination.trim().length < 2) {
      return res
        .status(200)
        .json({ success: true, results: 0, data: { rides: [] } });
    }

    const destRaw = destination.trim();
    const seatsNeeded = parseInt(seats) || 1;

    // ── Smart fuzzy regex ────────────────────────────────────────────────────
    // Normalise spaces and build a regex that is tolerant of minor variations.
    // e.g. "DHA Phase 2" also matches "DHA phase 2", "DHA-Phase-2", etc.
    const normalized = destRaw.replace(/[-_]/g, " ").replace(/\s+/g, " ");
    const terms = normalized.split(" ").filter((t) => t.length > 0);
    // Build a pattern that requires all tokens to appear (in any order) within the address
    const allTermsPattern = terms.map((t) => `(?=.*${t})`).join("");
    const primaryRegex = new RegExp(allTermsPattern, "i");
    // Fallback: simple prefix match for the full string
    const fallbackRegex = new RegExp(
      destRaw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );

    // Base query conditions — NO seat filter here so full rides still show
    // Frontend will display 'Seats Full' badge and disable the book button
    const baseConditions = {
      status: { $in: ["scheduled", "live"] },
      seatsAvailable: { $gte: 0 }, // include full rides (seatsAvailable === 0)
    };

    // ── Date filter ──────────────────────────────────────────────────────────
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        // FIX: clone the date before mutating to avoid the setHours bug
        const dayStart = new Date(parsed);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(parsed); // fresh clone, not a re-use of dayStart
        dayEnd.setHours(23, 59, 59, 999);
        baseConditions.departureTime = { $gte: dayStart, $lte: dayEnd };
      }
    } else {
      // No date filter — only exclude rides that have already departed
      baseConditions.departureTime = { $gte: new Date() };
    }

    // ── Optional origin filter ───────────────────────────────────────────────
    if (origin && origin.trim().length >= 2) {
      baseConditions["origin.address"] = new RegExp(
        origin.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
    }

    // ── Try smart regex first, fall back to simple ───────────────────────────
    let offers = await RideOffer.find({
      ...baseConditions,
      "destination.address": primaryRegex,
    })
      .populate("driver", "name avatar ratings vehicle")
      .sort({ departureTime: 1 })
      .limit(20)
      .lean();

    // If multi-term regex matches nothing, try the simpler fallback
    if (offers.length === 0 && terms.length > 1) {
      offers = await RideOffer.find({
        ...baseConditions,
        "destination.address": fallbackRegex,
      })
        .populate("driver", "name avatar ratings vehicle")
        .sort({ departureTime: 1 })
        .limit(20)
        .lean();
    }

    console.log(
      `🔍 Search "${destRaw}" → ${offers.length} rides (seated ≥ 0, showing full rides too)`,
    );

    const rides = offers.map((o) => ({
      _id: o._id,
      id: o._id,
      origin: o.origin?.address || "",
      originAddress: o.origin?.address || "",
      destination: o.destination?.address || "",
      destinationAddress: o.destination?.address || "",
      originCoords: o.origin?.point?.coordinates || null,
      destinationCoords: o.destination?.point?.coordinates || null,
      departureTime: o.departureTime,
      pricePerSeat: o.pricePerSeat,
      currency: o.currency || "PKR",
      seatsAvailable: o.seatsAvailable,
      seatsTotal: o.seatsTotal, // total capacity
      isFull: o.seatsAvailable === 0, // convenience flag
      estimatedDistanceKm: o.estimatedDistanceKm,
      estimatedDurationMin: o.estimatedDurationMin,
      status: o.status,
      driver: {
        _id: o.driver?._id,
        id: o.driver?._id,
        name: o.driver?.name || "Driver",
        avatar: o.driver?.avatar || null,
        ratings: o.driver?.ratings || { average: 0, count: 0 },
        vehicle: o.driver?.vehicle || {},
      },
    }));

    res
      .status(200)
      .json({ success: true, results: rides.length, data: { rides } });
  } catch (error) {
    console.error("❌ searchRidesPublic error:", error.message);
    next(error);
  }
};

/**
 * @desc    Book a ride directly by offerId (no pre-created match needed)
 * @route   POST /api/rides/book-direct
 * @body    { offerId, seatsNeeded? }
 * @access  Private (rider)
 */
const bookDirect = async (req, res, next) => {
  try {
    const { offerId, seatsNeeded: seatsRaw = 1 } = req.body;
    const seatsNeeded = Math.max(1, Math.min(8, parseInt(seatsRaw) || 1));

    if (!offerId) {
      return res
        .status(400)
        .json({ success: false, message: "offerId is required." });
    }

    const offer = await RideOffer.findById(offerId).populate("driver", "name");
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Ride not found." });
    }
    if (!["scheduled", "active", "live"].includes(offer.status)) {
      return res
        .status(409)
        .json({ success: false, message: "This ride is no longer available." });
    }
    if (offer.seatsAvailable < seatsNeeded) {
      return res.status(409).json({
        success: false,
        message:
          offer.seatsAvailable === 0
            ? "This ride is fully booked. No seats available."
            : `Only ${offer.seatsAvailable} seat(s) available — you requested ${seatsNeeded}.`,
      });
    }
    if (offer.driver._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot book your own ride." });
    }

    // Allow rebook: cancel any pre-existing cancelled/rejected booking for this offer+rider
    // then allow creating a fresh one
    const existingActive = await Booking.findOne({
      rider: req.user._id,
      offer: offerId,
      status: { $nin: ["cancelled", "cancelled_partial", "rejected"] },
    });
    if (existingActive) {
      return res
        .status(409)
        .json({
          success: false,
          message: "You already have an active booking for this ride.",
        });
    }

    // Create a minimal RideRequest
    const rideRequest = await RideRequest.create({
      rider: req.user._id,
      origin: offer.origin,
      destination: offer.destination,
      earliestDeparture: offer.departureTime,
      latestDeparture: offer.departureTime,
      seatsNeeded,
      status: "matched",
    });

    // Seats will ONLY be locked atomically when the Driver clicks "Accept".

    // Upsert a Match document
    const match = await Match.findOneAndUpdate(
      { offer: offerId, rider: req.user._id },
      {
        request: rideRequest._id,
        offer: offerId,
        rider: req.user._id,
        driver: offer.driver._id,
        metrics: {
          detourKm: 0,
          pickupDeviationM: 0,
          dropoffDeviationM: 0,
          routeOverlapScore: 1,
          estimatedDistanceKm: offer.estimatedDistanceKm,
          estimatedDurationMin: offer.estimatedDurationMin,
        },
        score: 100,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
      { upsert: true, new: true },
    );

    // Create the booking
    const {
      getStripeClient,
      createPaymentIntent,
    } = require("../services/paymentService");
    const { createNotification } = require("./notificationController");

    const totalFare = offer.pricePerSeat * seatsNeeded;
    const newBooking = await Booking.create({
      match: match._id,
      rider: req.user._id,
      driver: offer.driver._id,
      offer: offerId,
      request: rideRequest._id,
      seatsRequested: seatsNeeded,
      fare: {
        totalAmount: totalFare,
        currency: offer.currency || "PKR",
        platformFeePercent: 10,
      },
      status: "pending",
    });

    await createNotification({
      userId: offer.driver._id,
      type: "newBookingRequest",
      title: "New Ride Request!",
      body: `${req.user.name || "A rider"} wants ${seatsNeeded} seat(s) on your ride.`,
      link: "/driver-dashboard",
      metadata: { bookingId: newBooking._id, seatsRequested: seatsNeeded },
    });

    // Stripe payment if configured
    if (process.env.STRIPE_SECRET_KEY && getStripeClient()) {
      try {
        const { clientSecret } = await createPaymentIntent({
          booking: newBooking,
          rider: req.user,
        });
        return res.status(201).json({
          success: true,
          message: "Booking created. Complete payment to confirm.",
          data: {
            booking: newBooking,
            clientSecret,
            totalFare,
            seatsBooked: seatsNeeded,
          },
        });
      } catch (stripeErr) {
        console.warn(
          "Stripe failed, continuing without it:",
          stripeErr.message,
        );
      }
    }

    res.status(201).json({
      success: true,
      message: `Booking request sent for ${seatsNeeded} seat(s)! Awaiting driver approval.`,
      data: { booking: newBooking, totalFare, seatsBooked: seatsNeeded },
    });
  } catch (error) {
    console.error("❌ bookDirect error:", error.message);
    next(error);
  }
};

/**
 * @desc Get all ride offers created by the logged in driver
 * @route GET /api/rides/offers
 */
const getMyOffers = async (req, res, next) => {
  try {
    const offers = await RideOffer.find({ driver: req.user._id }).sort({
      departureTime: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: { offers },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Update the status of a specific ride offer
 * @route PATCH /api/rides/offers/:id/status
 */
const updateOfferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'cancelled', 'completed', etc.

    const offer = await RideOffer.findOne({ _id: id, driver: req.user._id });
    if (!offer) {
      return res
        .status(404)
        .json({ success: false, message: "Offer not found or unauthorized" });
    }

    offer.status = status;
    await offer.save();

    // If cancelled, maybe auto-cancel pending bookings? That could be handled via webhooks or extra logic later.

    res.status(200).json({
      success: true,
      data: { offer },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOffer,
  createRequest,
  getMatches,
  searchRides,
  searchRidesPublic,
  bookDirect,
  getMyOffers,
  getOffers,
  updateOfferStatus,
  startRide,
  completeRide,
};
