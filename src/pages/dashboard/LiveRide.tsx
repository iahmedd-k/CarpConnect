import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  Phone,
  MessageSquare,
  AlertTriangle,
  Play,
  Square,
  CheckCircle,
  Loader2,
  Users,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeafletMap from "@/components/LeafletMap";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

const LiveRide = () => {
  const [rideStatus, setRideStatus] = useState<
    "ready" | "in_progress" | "completed"
  >("ready");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [speed, setSpeed] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("carpconnect_user") || "{}");
    setMe(user);
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchActiveRide();

    // Initialize Socket
    const token = localStorage.getItem("carpconnect_token");
    if (token) {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => {
        console.log("LiveRide socket connected:", socketRef.current?.id);
      });

      // Listen for driver location updates as per PRD
      socketRef.current.on("driverLocationUpdate", (data: any) => {
        if (data.latitude !== undefined && data.longitude !== undefined) {
          setDriverLocation({
            lat: data.latitude,
            lng: data.longitude,
          });
          if (data.speed) setSpeed(data.speed);
          if (data.eta) setEta(data.eta);
        }
      });

      socketRef.current.on("ride_update", (data: any) => {
        console.log("Ride update:", data);
      });

      socketRef.current.on("rider_joined", (data: any) => {
        console.log("Rider joined:", data);
      });

      socketRef.current.on("rider_left", (data: any) => {
        console.log("Rider left:", data);
      });
    }

    return () => {
      clearInterval(interval);
      socketRef.current?.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchActiveRide = async () => {
    try {
      // Fetch live rides - if none, check if there's a ride to start
      const res = await api.get("/rides/offers?status=live");
      const liveOffers = res.data.data?.offers || [];

      if (liveOffers.length > 0) {
        const ride = liveOffers[0];
        setActiveRide(ride);
        setRideStatus("in_progress");

        if (ride.startedAt) {
          startLocationBroadcast();
        }

        const bookRes = await api.get(`/bookings?offer=${ride._id}`);
        const allBookings = bookRes.data.data?.bookings || [];
        // Include confirmed, picked_up, AND completed bookings to keep full itinerary
        const activeBookings = allBookings.filter((b: any) =>
          ["confirmed", "picked_up", "completed"].includes(b.status),
        );
        setBookings(activeBookings);

        // Join ride room
        socketRef.current?.emit("join:ride", { rideId: ride._id });
      } else {
        // Check if we have an "active" or "scheduled" ride that we can start
        // PRD: scheduled -> active -> live -> completed
        const scheduledRes = await api.get("/rides/offers?status=scheduled");
        let scheduledOffers = scheduledRes.data.data?.offers || [];

        if (scheduledOffers.length === 0) {
          const activeRes = await api.get("/rides/offers?status=active");
          scheduledOffers = activeRes.data.data?.offers || [];
        }

        if (scheduledOffers.length > 0) {
          setActiveRide(scheduledOffers[0]);
          setRideStatus("ready");
        }
      }
    } catch (err) {
      console.error("Failed to fetch live ride:", err);
    } finally {
      setLoading(false);
    }
  };

  // Start broadcasting driver location when ride starts
  const startLocationBroadcast = () => {
    if (!activeRide || !socketRef.current) return;

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setDriverLocation(coords);
          setSpeed(Math.round((position.coords.speed || 0) * 3.6)); // m/s → km/h

          // Broadcast as per PRD
          socketRef.current?.emit("driverLocationUpdate", {
            rideId: activeRide._id,
            latitude: coords.lat,
            longitude: coords.lng,
            timestamp: new Date().toISOString(),
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
      );
    }
  };

  const handleStartRide = async () => {
    try {
      await api.post(`/rides/offers/${activeRide._id}/start`);
      setRideStatus("in_progress");
      startLocationBroadcast();
      fetchActiveRide(); // Refresh data
    } catch (err) {
      console.error("Failed to start ride:", err);
    }
  };

  const simulateDrive = () => {
    const currentStop = itinerary[activeStep];
    if (!currentStop || !currentStop.coords || !driverLocation) return;

    toast.info("Simulating drive to next stop...");
    const targetLat = currentStop.coords[1];
    const targetLng = currentStop.coords[0];

    let simInterval = setInterval(() => {
      setDriverLocation((prev) => {
        if (!prev) return prev;
        const dLat = targetLat - prev.lat;
        const dLng = targetLng - prev.lng;

        // Stop if very close
        if (Math.abs(dLat) < 0.0001 && Math.abs(dLng) < 0.0001) {
          clearInterval(simInterval);
          setSpeed(0);
          return { lat: targetLat, lng: targetLng };
        }

        setSpeed(45);
        const nextLat = prev.lat + dLat * 0.1;
        const nextLng = prev.lng + dLng * 0.1;

        // Also broadcast mock location to sockets
        if (socketRef.current && activeRide) {
          socketRef.current.emit("driverLocationUpdate", {
            rideId: activeRide._id,
            latitude: nextLat,
            longitude: nextLng,
            timestamp: new Date().toISOString(),
          });
        }

        return { lat: nextLat, lng: nextLng };
      });
    }, 1000);
  };

  const handleNextStep = async () => {
    const currentStop = itinerary[activeStep];
    if (!currentStop) return;

    // Safely extract bookingId explicitly
    const bookingId = currentStop.bookingId || currentStop.id.split("_")[0];

    try {
      if (currentStop.type === "pickup") {
        await api.post(`/bookings/${bookingId}/pickup`);
      } else {
        await api.post(`/bookings/${bookingId}/dropoff`);
      }

      const totalSteps = itinerary.length;
      if (activeStep < totalSteps - 1) {
        setActiveStep(activeStep + 1);
      } else {
        // All steps done in itinerary
        // Driver can manually end ride or it auto-ends if we want
      }
      fetchActiveRide(); // Refresh booking statuses
    } catch (err) {
      console.error("Step confirm failed:", err);
    }
  };

  const handleEndRide = async () => {
    try {
      await api.post(`/rides/offers/${activeRide._id}/complete`);
      setRideStatus("completed");
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    } catch (err) {
      console.error("Failed to end ride:", err);
    }
  };

  // Build itinerary from backend stops array or fallback to bookings mapping
  const itinerary = useMemo(() => {
    if (activeRide?.stops && activeRide.stops.length > 0) {
      return activeRide.stops.map((s: any) => {
        const b = bookings.find((bk) => bk._id === s.bookingId);
        return {
          id: s.bookingId + "_" + s.type, // explicitly use bookingId to ensure stable split
          bookingId: s.bookingId,
          name: b?.rider?.name || "Rider",
          type: s.type,
          location:
            s.location?.address ||
            (s.type === "pickup"
              ? b?.request?.origin?.address
              : b?.request?.destination?.address),
          coords:
            s.location?.point?.coordinates ||
            (s.type === "pickup"
              ? b?.request?.origin?.point?.coordinates
              : b?.request?.destination?.point?.coordinates),
          isDone: s.completed,
        };
      });
    }
    return bookings.flatMap((b) => [
      {
        id: b._id + "_p",
        name: b.rider?.name || "Rider",
        type: "pickup",
        location: b.request?.origin?.address || "Pickup point",
        coords: b.request?.origin?.point?.coordinates,
        isDone: b.status === "picked_up" || b.status === "completed",
      },
      {
        id: b._id + "_d",
        name: b.rider?.name || "Rider",
        type: "dropoff",
        location: b.request?.destination?.address || "Dropoff point",
        coords: b.request?.destination?.point?.coordinates,
        isDone: b.status === "completed",
      },
    ]);
  }, [bookings, activeRide]);

  // Automatically set activeStep based on backend progress
  useEffect(() => {
    if (activeRide && typeof activeRide.currentStopIndex === "number") {
      setActiveStep(
        Math.min(
          activeRide.currentStopIndex,
          itinerary.length > 0 ? itinerary.length - 1 : 0,
        ),
      );
    } else {
      if (itinerary.length === 0) return;
      const nextStepIdx = itinerary.findIndex((step) => !step.isDone);
      if (nextStepIdx !== -1) {
        setActiveStep(nextStepIdx);
      } else {
        setActiveStep(itinerary.length - 1);
      }
    }
  }, [activeRide, itinerary]);

  // Calculate ETA...
  useEffect(() => {
    if (!driverLocation || !itinerary[activeStep]?.coords) return;
    const stopCoords = itinerary[activeStep].coords;
    if (!stopCoords) return;

    const R = 6371;
    const dLat = ((stopCoords[1] - driverLocation.lat) * Math.PI) / 180;
    const dLon = ((stopCoords[0] - driverLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((driverLocation.lat * Math.PI) / 180) *
        Math.cos((stopCoords[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const avgSpeed = speed > 5 ? speed : 30; // km/h, fallback 30
    const etaMin = Math.round((dist / avgSpeed) * 60);
    setEta(etaMin);
  }, [driverLocation, activeStep, speed]);

  // Memoize map markers to prevent blinking
  const mapMarkers = useMemo(
    () =>
      itinerary.map((step) => ({
        lat: step.coords ? step.coords[1] : 33.6844,
        lng: step.coords ? step.coords[0] : 73.0479,
        label: `${step.type === "pickup" ? "📍 Pickup" : "🏁 Dropoff"}: ${step.name}`,
        color: step.type === "pickup" ? "#10b981" : "#f59e0b",
      })),
    [itinerary],
  );

  const mapOrigin = useMemo(
    () =>
      activeRide?.origin?.point?.coordinates
        ? {
            lat: activeRide.origin.point.coordinates[1],
            lng: activeRide.origin.point.coordinates[0],
          }
        : undefined,
    [activeRide],
  );

  const mapDest = useMemo(
    () =>
      activeRide?.destination?.point?.coordinates
        ? {
            lat: activeRide.destination.point.coordinates[1],
            lng: activeRide.destination.point.coordinates[0],
          }
        : undefined,
    [activeRide],
  );

  const routeCoords: [number, number][] | undefined = useMemo(() => {
    if (activeRide?.routePolyline?.length) {
      return activeRide.routePolyline.map((coord: number[]) => [
        coord[1],
        coord[0],
      ]);
    }
    if (mapOrigin && mapDest) {
      return [
        [mapOrigin.lat, mapOrigin.lng],
        [mapDest.lat, mapDest.lng],
      ];
    }
    return undefined;
  }, [activeRide, mapOrigin, mapDest]);

  const currentStop = useMemo(
    () => itinerary[activeStep],
    [itinerary, activeStep],
  );

  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const fetchSummaryStats = async () => {
    try {
      // Summary is usually for the last completed ride
      const res = await api.get("/emissions/me");
      setSummaryData(res.data.data);
      setShowSummary(true);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setShowSummary(true); // show modal even if stats fail
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (!activeRide && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-[40px] bg-muted/10 border border-border/50 flex items-center justify-center mb-8 shadow-inner">
          <Navigation className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-3xl font-display font-black text-foreground mb-3">
          No Active Ride
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto font-medium">
          You don't have any live or scheduled rides right now. Once you start a
          ride, it will appear here for real-time tracking.
        </p>
        <div className="flex gap-4 mt-10">
          <Button
            variant="outline"
            className="rounded-2xl px-8 h-12 font-bold"
            onClick={fetchActiveRide}
          >
            Refresh
          </Button>
          <Link to="/driver-dashboard?tab=offer">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-8 h-12 font-bold shadow-glow">
              Offer a Ride
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-[40px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-primary" />

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-display font-black text-foreground">
                  Ride Summary
                </h2>
                <p className="text-muted-foreground font-medium">
                  Amazing job! Here's the impact you made.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-muted/30 rounded-3xl p-6 border border-border/50 text-center">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Distance
                  </div>
                  <div className="text-2xl font-display font-black text-foreground">
                    {activeRide.estimatedDistanceKm || 0} km
                  </div>
                </div>
                <div className="bg-muted/30 rounded-3xl p-6 border border-border/50 text-center">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Earnings
                  </div>
                  <div className="text-2xl font-display font-black text-emerald">
                    PKR{" "}
                    {(
                      bookings.reduce(
                        (s, b) => s + (b.fare?.totalAmount || 0),
                        0,
                      ) * 0.9
                    ).toFixed(0)}
                  </div>
                </div>
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/20 text-center col-span-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-primary" />
                    <div className="text-xs font-bold text-primary uppercase tracking-wider">
                      CO₂ Saved
                    </div>
                  </div>
                  <div className="text-3xl font-display font-black text-foreground">
                    {(
                      activeRide.estimatedDistanceKm *
                      0.12 *
                      bookings.length
                    ).toFixed(2)}{" "}
                    Kg
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-bold">
                    EQUIVALENT TO PLANTING ~
                    {(
                      (activeRide.estimatedDistanceKm *
                        0.12 *
                        bookings.length) /
                      21
                    ).toFixed(3)}{" "}
                    TREES
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowSummary(false);
                  setActiveRide(null); // Clear active ride to show "No Active Ride" state
                  setRideStatus("ready");
                }}
                className="w-full py-7 rounded-2xl bg-gradient-primary text-white font-bold text-lg shadow-glow"
              >
                Done & Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 bg-muted/30 rounded-3xl border border-border/50 relative overflow-hidden flex flex-col justify-end min-h-[400px]"
      >
        <LeafletMap
          origin={mapOrigin}
          destination={mapDest}
          routeCoords={routeCoords}
          driverLocation={driverLocation}
          markers={mapMarkers}
        />

        {/* Speed + ETA Overlays */}
        <div className="absolute top-6 left-6 z-[1000] flex gap-3">
          <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-border shadow-lg">
            <Navigation className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-bold font-display tracking-wider">
              {speed || 0} km/h
            </span>
          </div>
          {eta !== null && (
            <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-border shadow-lg">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-bold font-display">ETA: {eta} min</span>
            </div>
          )}
          <div className="bg-card/90 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-border shadow-lg">
            <Users className="w-4 h-4 text-emerald" />
            <span className="font-bold font-display">
              {bookings.length} riders
            </span>
          </div>
        </div>

        {activeRide?.status === "live" &&
          currentStop &&
          !itinerary.every((s) => s.isDone) && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-6 left-6 right-6 z-[1000] bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-display font-bold">
                  Next:{" "}
                  {currentStop.type === "pickup" ? "📍 Pickup" : "🏁 Dropoff"}
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                  ● LIVE
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium mb-4">
                {currentStop.name} @ {currentStop.location}
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleNextStep}
                  className="flex-1 py-6 bg-gradient-primary text-white text-lg font-bold shadow-glow"
                >
                  Confirm {currentStop.type === "pickup" ? "Pickup" : "Dropoff"}{" "}
                  <CheckCircle className="ml-2 w-5 h-5" />
                </Button>
                {driverLocation && (
                  <Button
                    onClick={simulateDrive}
                    variant="outline"
                    className="py-6 border-primary/50 text-primary bg-primary/5"
                    title="Simulate driving to stop"
                  >
                    <Navigation className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

        {activeRide?.status === "live" &&
          itinerary.length > 0 &&
          itinerary.every((s) => s.isDone) && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-6 left-6 right-6 z-[1000] bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-2xl text-center"
            >
              <h3 className="text-xl font-display font-bold text-emerald mb-2">
                All Passengers Dropped Off! 🎉
              </h3>
              <p className="text-muted-foreground text-sm mb-4 font-medium">
                You have successfully completed all steps in your itinerary.
              </p>
              <Button
                onClick={handleEndRide}
                className="w-full py-6 bg-emerald text-white font-bold shadow-glow-emerald"
              >
                Finish Ride & Save Impact
              </Button>
            </motion.div>
          )}

        {rideStatus === "completed" && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-emerald flex items-center justify-center mb-6 shadow-glow-emerald">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-display font-black mb-2 text-foreground">
              Ride Completed!
            </h2>
            <p className="text-muted-foreground text-lg text-center max-w-sm">
              You reached your destination. Earnings will be updated in your
              wallet shortly.
            </p>
            <Button
              onClick={fetchSummaryStats}
              className="mt-8 bg-card text-foreground border border-border"
              variant="outline"
            >
              View Summary
            </Button>
          </div>
        )}
      </motion.div>

      {/* Sidebar Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-96 flex flex-col gap-6"
      >
        {/* Ride Info */}
        <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col gap-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-display font-bold">
              {activeRide?.origin?.address?.split(",")[0] || "Origin"} to{" "}
              {activeRide?.destination?.address?.split(",")[0] || "Destination"}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              Confirmed Riders: {bookings.length}
            </p>
          </div>

          {(activeRide?.status === "scheduled" ||
            activeRide?.status === "active" ||
            rideStatus === "ready") && (
            <Button
              onClick={handleStartRide}
              className="w-full py-8 text-lg font-bold bg-emerald text-white hover:bg-emerald/90 shadow-glow-emerald"
            >
              <Play className="w-6 h-6 mr-2 fill-current" /> Start Ride
            </Button>
          )}
        </div>

        {/* Itinerary */}
        <div className="flex-1 bg-card rounded-2xl p-6 border border-border/50 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center justify-between">
            Live Itinerary
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
              {itinerary.length > 0 ? activeStep + 1 : 0} / {itinerary.length}
            </span>
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative">
            {itinerary.length > 0 ? (
              <>
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border/50 z-0" />
                {itinerary.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`relative z-10 flex gap-4 transition-all duration-300 ${idx < activeStep ? "opacity-40 grayscale" : idx === activeStep && rideStatus === "in_progress" ? "bg-primary/5 p-3 rounded-xl border border-primary/20 -ml-3" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full border-4 border-card flex items-center justify-center shrink-0 mt-1 ${
                        idx < activeStep
                          ? "bg-emerald text-white"
                          : idx === activeStep && rideStatus === "in_progress"
                            ? "bg-primary shadow-glow"
                            : "bg-muted-foreground/30 text-transparent"
                      }`}
                    >
                      {idx < activeStep && <CheckCircle className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        {step.type === "pickup" ? "📍 PICKUP" : "🏁 DROPOFF"}
                      </div>
                      <div className="text-sm font-semibold mb-1">
                        {step.name}
                      </div>
                      <div className="text-xs font-medium text-foreground/70 line-clamp-2">
                        <MapPin className="w-3 h-3 inline mr-1" />{" "}
                        {step.location}
                      </div>
                      {idx === activeStep &&
                        eta !== null &&
                        rideStatus === "in_progress" && (
                          <div className="text-xs text-primary font-bold mt-1">
                            <Clock className="w-3 h-3 inline mr-1" /> ~{eta} min
                            away
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-muted-foreground text-sm mt-10">
                No confirmed bookings yet.
              </p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs font-semibold text-emerald hover:bg-emerald/10 hover:text-emerald"
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Share Live Trip
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-500"
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Emergency SOS
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LiveRide;
