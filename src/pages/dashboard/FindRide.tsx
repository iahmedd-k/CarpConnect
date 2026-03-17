import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import {
    MapPin, Search, Star, Clock, Car, Navigation,
    Loader2, ChevronRight, X, Users, RefreshCw,
    AlertCircle, CheckCircle2, Calendar, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeafletMap from "@/components/LeafletMap";
import { StripeCheckoutModal } from "@/components/StripeCheckoutModal";
import api from "../../lib/api";
import { toast } from "sonner";

// ─────────────────────── Types ─────────────────────────────────────────────────
interface AddressSuggestion { address: string; coordinates?: number[] | null }

interface RideResult {
    _id: string;
    origin: string;
    destination: string;
    originCoords: number[] | null;
    destinationCoords: number[] | null;
    departureTime: string;
    pricePerSeat: number;
    currency: string;
    seatsAvailable: number;
    seatsTotal?: number;
    isFull?: boolean;
    estimatedDistanceKm?: number;
    estimatedDurationMin?: number;
    status: string;
    driver: {
        _id?: string;
        id?: string;
        name: string;
        avatar?: string | null;
        ratings?: { average?: number; count?: number };
        vehicle?: { make?: string; model?: string; year?: number; seats?: number } | string;
    };
}

// ─────────────────────── Seat Book Modal ────────────────────────────────────────
interface SeatBookModalProps {
    ride: RideResult;
    onConfirm: (seats: number) => void;
    onClose: () => void;
    loading: boolean;
}
function SeatBookModal({ ride, onConfirm, onClose, loading }: SeatBookModalProps) {
    const [seats, setSeats] = useState(1);
    const max = Math.min(ride.seatsAvailable, 8);
    const total = ride.pricePerSeat * seats;

    const fmt2 = (n: number) =>
        new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n);

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
                className="w-full max-w-sm bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
                    <div>
                        <h3 className="font-display font-bold text-lg">Book Your Seats</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {ride.origin.split(",")[0]} → {ride.destination.split(",")[0]}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Price per seat info */}
                    <div className="flex items-center justify-between bg-muted/20 rounded-2xl px-5 py-4">
                        <div>
                            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Price per seat</div>
                            <div className="text-2xl font-display font-black text-primary">{fmt2(ride.pricePerSeat)}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Available</div>
                            <div className="text-2xl font-display font-black text-emerald-400">{ride.seatsAvailable}</div>
                        </div>
                    </div>

                    {/* Seat selector */}
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                            Number of seats
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSeats(s => Math.max(1, s - 1))}
                                disabled={seats <= 1}
                                className="w-12 h-12 rounded-2xl border border-border bg-muted/20 flex items-center justify-center text-xl font-bold hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                id="seat-minus"
                            >−</button>

                            <div className="flex-1 text-center">
                                <div className="text-4xl font-display font-black text-foreground">{seats}</div>
                                <div className="text-xs text-muted-foreground">{seats === 1 ? 'seat' : 'seats'}</div>
                            </div>

                            <button
                                onClick={() => setSeats(s => Math.min(max, s + 1))}
                                disabled={seats >= max}
                                className="w-12 h-12 rounded-2xl border border-border bg-muted/20 flex items-center justify-center text-xl font-bold hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                id="seat-plus"
                            >+</button>
                        </div>

                        {/* Quick pick buttons */}
                        <div className="flex gap-2 mt-3 justify-center">
                            {Array.from({ length: max }, (_, i) => i + 1).map(n => (
                                <button
                                    key={n}
                                    onClick={() => setSeats(n)}
                                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border ${
                                        seats === n
                                            ? "bg-primary text-white border-primary shadow-glow"
                                            : "border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                                    }`}
                                >{n}</button>
                            ))}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Total fare</div>
                            <div className="text-xs text-muted-foreground">{seats} seat{seats > 1 ? 's' : ''} × {fmt2(ride.pricePerSeat)}</div>
                        </div>
                        <div className="text-3xl font-display font-black text-primary">{fmt2(total)}</div>
                    </div>

                    {/* CTA */}
                    <Button
                        onClick={() => onConfirm(seats)}
                        disabled={loading}
                        className="w-full h-13 py-4 bg-gradient-primary text-white rounded-2xl font-bold text-sm shadow-glow hover:opacity-90 transition-opacity"
                        id="confirm-book-btn"
                    >
                        {loading
                            ? <span className="flex items-center gap-2 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Booking…</span>
                            : <span className="flex items-center gap-2 justify-center"><Wallet className="w-4 h-4" /> Confirm {seats} seat{seats > 1 ? 's' : ''} · {fmt2(total)}</span>
                        }
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────── Helpers ───────────────────────────────────────────────
const fmt = {
    currency: (n: any) => {
        const v = Number(n);
        if (!v || isNaN(v)) return "Rs ---";
        return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(v);
    },
    time: (t: any) => {
        const d = new Date(t);
        return isNaN(d.getTime()) ? "---" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    dateShort: (t: any) => {
        const d = new Date(t);
        return isNaN(d.getTime()) ? "" : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    },
    distanceKm: (n: any) => (n ? `${Number(n).toFixed(1)} km` : "—"),
    durationMin: (n: any) => (n ? `${Math.round(Number(n))} min` : "—"),
    driverName: (r: RideResult) => r.driver?.name || "Driver",
    vehicleMake: (r: RideResult) => {
        const v = r.driver?.vehicle;
        if (!v) return "Car";
        if (typeof v === "string") return v;
        return v.make || "Car";
    },
    rating: (r: RideResult) => {
        const avg = r.driver?.ratings?.average;
        return avg ? Number(avg).toFixed(1) : "N/A";
    },
};

// ─────────────────────── Skeleton ──────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="p-5 rounded-3xl border border-border/30 bg-card animate-pulse">
        <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 shrink-0" />
            <div className="flex-1 space-y-2.5">
                <div className="h-4 bg-muted/40 rounded-xl w-3/4" />
                <div className="h-3 bg-muted/30 rounded-xl w-1/2" />
                <div className="flex gap-2 pt-1">
                    <div className="h-5 w-16 bg-muted/30 rounded-full" />
                    <div className="h-5 w-20 bg-muted/20 rounded-full" />
                </div>
            </div>
            <div className="h-6 w-16 bg-muted/30 rounded-xl shrink-0" />
        </div>
    </div>
);

// ─────────────────────── Address Input ─────────────────────────────────────────
interface AddressInputProps {
    id: string;
    value: string;
    placeholder: string;
    icon: React.ReactNode;
    suggestions: AddressSuggestion[];
    loading: boolean;
    onChange: (v: string) => void;
    onSelect: (s: AddressSuggestion) => void;
    onClear: () => void;
}
function AddressInput({ id, value, placeholder, icon, suggestions, loading, onChange, onSelect, onClear }: AddressInputProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">{icon}</div>
            <input
                id={id}
                value={value}
                autoComplete="off"
                placeholder={placeholder}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                className="w-full bg-muted/30 border border-border rounded-xl pl-11 pr-9 py-3.5 text-sm
                           focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all
                           placeholder:text-muted-foreground/50 text-foreground"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loading && <Loader2 className="w-4 h-4 text-primary/60 animate-spin" />}
                {value && !loading && (
                    <button type="button" onClick={onClear} tabIndex={-1}
                        className="p-0.5 rounded-full hover:bg-muted/60 transition-colors">
                        <X className="w-3.5 h-3.5 text-muted-foreground/60" />
                    </button>
                )}
            </div>
            <AnimatePresence>
                {open && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border
                                   rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {suggestions.map((s, i) => (
                            <button key={i} type="button"
                                onClick={() => { onSelect(s); setOpen(false); }}
                                className="w-full text-left px-4 py-3 text-sm flex items-center gap-3
                                           hover:bg-primary/5 transition-colors border-b border-border/30 last:border-0"
                            >
                                <MapPin className="w-3.5 h-3.5 text-primary/50 shrink-0" />
                                <span className="truncate">{s.address}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─────────────────────── Empty State ───────────────────────────────────────────
function EmptyState({ destination, date, onClearDate, onClearAll }: {
    destination: string; date: string;
    onClearDate: () => void; onClearAll: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-14 px-8 bg-card rounded-3xl border border-border/40"
        >
            <div className="w-20 h-20 rounded-3xl bg-muted/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h4 className="text-lg font-display font-bold mb-2 text-foreground">No rides found</h4>
            <p className="text-sm text-muted-foreground mb-1">
                No scheduled or live rides match{destination && (
                    <strong className="text-foreground"> "{destination}"</strong>
                )}.
            </p>
            <p className="text-xs text-muted-foreground/70 mb-6">
                Try checking spelling, removing the date filter, or searching a nearby area.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {date && (
                    <Button size="sm" variant="outline" onClick={onClearDate} className="rounded-xl text-xs gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Clear date &amp; retry
                    </Button>
                )}
                <Button size="sm" variant="outline" onClick={onClearAll} className="rounded-xl text-xs gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> Show all upcoming rides
                </Button>
            </div>
        </motion.div>
    );
}

// ─────────────────────── Main Component ────────────────────────────────────────
const FindRide = ({
    onViewProfile,
    initialQuery = "",
}: {
    onViewProfile?: (driverId: string) => void;
    initialQuery?: string;
}) => {
    const navigate = useNavigate();

    // ── Form state
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState(initialQuery || "");
    const [originCoords, setOriginCoords] = useState<number[] | null>(null);
    const [destCoords, setDestCoords] = useState<number[] | null>(null);
    const [date, setDate] = useState("");

    // ── Autocomplete
    const [originSugg, setOriginSugg] = useState<AddressSuggestion[]>([]);
    const [destSugg, setDestSugg] = useState<AddressSuggestion[]>([]);
    const [loadingOrigin, setLoadingOrigin] = useState(false);
    const [loadingDest, setLoadingDest] = useState(false);

    // ── Results
    const [searching, setSearching] = useState(false);
    const [rides, setRides] = useState<RideResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [selected, setSelected] = useState<RideResult | null>(null);
    const [bookedIds, setBookedIds] = useState<Record<string, boolean>>({});

    // ── Booking
    const [bookingId, setBookingId] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [bookingLoading, setBookingLoading] = useState(false);

    const resultsRef = useRef<HTMLDivElement>(null);
    const autoSearched = useRef(false);

    // ── Fetch address autocomplete suggestions ───────────────────────────────
    const fetchSuggestions = async (q: string, type: "origin" | "destination") => {
        if (q.trim().length < 2) {
            type === "origin" ? setOriginSugg([]) : setDestSugg([]);
            return;
        }
        type === "origin" ? setLoadingOrigin(true) : setLoadingDest(true);
        try {
            const res = await api.get(`/rides/search?q=${encodeURIComponent(q.trim())}`);
            const arr: AddressSuggestion[] = res.data?.data?.results || [];
            type === "origin" ? setOriginSugg(arr) : setDestSugg(arr);
        } catch { /* non-blocking */ } finally {
            type === "origin" ? setLoadingOrigin(false) : setLoadingDest(false);
        }
    };

    const debouncedOrigin = useCallback(debounce((q: string) => fetchSuggestions(q, "origin"), 350), []);
    const debouncedDest = useCallback(debounce((q: string) => fetchSuggestions(q, "destination"), 350), []);

    // ── Core search: uses /api/rides/search-dest ─────────────────────────────
    const executeSearch = useCallback(async (destOverride?: string, dateOverride?: string) => {
        const destVal = (destOverride ?? destination).trim();
        if (!destVal) {
            toast.error("Please enter a destination.");
            return;
        }

        setSearching(true);
        setHasSearched(true);
        setRides([]);
        setSelected(null);

        const params = new URLSearchParams({ destination: destVal });
        if (origin.trim()) params.append("origin", origin.trim());
        const usedDate = dateOverride !== undefined ? dateOverride : date;
        if (usedDate) params.append("date", usedDate);

        try {
            // Use the public search-dest endpoint — fast, no geocoding, no match engine
            const res = await api.get(`/rides/search-dest?${params.toString()}`);

            const found: RideResult[] = res.data?.data?.rides || [];
            console.log(`[FindRide] search-dest response: ${found.length} ride(s)`, res.data);

            setRides(found);
            if (found.length > 0) {
                setSelected(found[0]);
                toast.success(
                    `Found ${found.length} ride${found.length > 1 ? "s" : ""} to "${destVal}"!`,
                    { duration: 3000 }
                );
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
            } else {
                toast.info("No rides found. Try removing filters or checking spelling.", { duration: 4000 });
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Search failed. Please try again.";
            console.error("[FindRide] search error:", err);
            toast.error(msg);
        } finally {
            setSearching(false);
        }
    }, [destination, origin, date]);

    // ── Auto-search from homepage query param ────────────────────────────────
    useEffect(() => {
        if (initialQuery?.trim().length >= 2 && !autoSearched.current) {
            autoSearched.current = true;
            const timer = setTimeout(() => executeSearch(initialQuery.trim()), 400);
            return () => clearTimeout(timer);
        }
    }, [initialQuery]);

    // ── Book a ride directly by offerId ──────────────────────────────────────
    const [seatBookRide, setSeatBookRide] = useState<RideResult | null>(null);

    const executeBooking = async (seatsNeeded: number) => {
        if (!seatBookRide) return;
        setBookingLoading(true);
        setBookingId(seatBookRide._id);

        try {
            const res = await api.post("/rides/book-direct", {
                offerId: seatBookRide._id,
                seatsNeeded,
            });

            if (res.data.data?.clientSecret) {
                setClientSecret(res.data.data.clientSecret);
                setPaymentAmount(res.data.data.totalFare || seatBookRide.pricePerSeat * seatsNeeded);
            } else {
                toast.success("Booking request sent! 🎉", {
                    description: `Requested ${seatsNeeded} seat(s). Check My Rides for updates.`,
                    duration: 5000,
                });
                setBookedIds(prev => ({ ...prev, [seatBookRide._id]: true }));
                // Decrement seat count optimistically
                setRides(prev => prev.map(r =>
                    r._id === seatBookRide._id
                        ? { ...r, seatsAvailable: Math.max(0, r.seatsAvailable - seatsNeeded) }
                        : r
                ));
            }
            setSeatBookRide(null); // close modal on success or stripe start
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Booking failed. Please try again.");
        } finally {
            setBookingLoading(false);
            setBookingId(null);
        }
    };


    const bookBtnState = (ride: RideResult) => {
        if (bookedIds[ride._id]) return { label: "Requested ✓", disabled: true, cls: "bg-emerald-600 opacity-80" };
        if (ride.seatsAvailable <= 0) return { label: "Seats Full", disabled: true, cls: "bg-muted-foreground/60 text-white" };
        return { label: "Book Seats", disabled: false, cls: "bg-gradient-primary shadow-glow" };
    };

    const handlePaymentSuccess = () => {
        setClientSecret(null);
        toast.success("Payment successful! Ride booked. 🎉");
        setTimeout(() => navigate("/dashboard"), 1500);
    };

    // ─────────────────────── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6 pb-24">
            {/* ── Seat Modal ──────────────────────────────────────────────── */}
            <AnimatePresence>
                {seatBookRide && (
                    <SeatBookModal
                        ride={seatBookRide}
                        onClose={() => setSeatBookRide(null)}
                        onConfirm={executeBooking}
                        loading={bookingLoading}
                    />
                )}
            </AnimatePresence>


            {/* ── Homepage search banner ──────────────────────────────────── */}
            <AnimatePresence>
                {initialQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-primary/10 border border-primary/20"
                    >
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground/70">Showing rides to: </span>
                            <span className="text-sm font-bold text-primary">{initialQuery}</span>
                        </div>
                        {searching
                            ? <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                            : rides.length > 0 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
                                    {rides.length} found
                                </span>
                            )
                        }
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Search form ─────────────────────────────────────────────── */}
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-display font-bold">Find your ride</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Search live and scheduled rides across the network
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Search className="w-5 h-5 text-primary" />
                    </div>
                </div>

                <form
                    id="find-ride-form"
                    onSubmit={e => { e.preventDefault(); executeSearch(); }}
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-3"
                >
                    {/* Origin */}
                    <AddressInput
                        id="find-ride-origin"
                        value={origin}
                        placeholder="From (optional)"
                        icon={<MapPin className="w-4 h-4 text-muted-foreground/50" />}
                        suggestions={originSugg}
                        loading={loadingOrigin}
                        onChange={v => { setOrigin(v); setOriginCoords(null); debouncedOrigin(v); }}
                        onSelect={s => { setOrigin(s.address); setOriginCoords(s.coordinates || null); setOriginSugg([]); }}
                        onClear={() => { setOrigin(""); setOriginCoords(null); setOriginSugg([]); }}
                    />

                    {/* Destination */}
                    <AddressInput
                        id="find-ride-destination"
                        value={destination}
                        placeholder="Where to? *"
                        icon={<MapPin className="w-4 h-4 text-primary" />}
                        suggestions={destSugg}
                        loading={loadingDest}
                        onChange={v => { setDestination(v); setDestCoords(null); debouncedDest(v); }}
                        onSelect={s => { setDestination(s.address); setDestCoords(s.coordinates || null); setDestSugg([]); }}
                        onClear={() => { setDestination(""); setDestCoords(null); setDestSugg([]); }}
                    />

                    {/* Date */}
                    <div>
                        <input
                            id="find-ride-date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3.5 text-sm
                                       focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all
                                       text-foreground"
                        />
                    </div>

                    {/* Submit */}
                    <Button
                        id="find-ride-submit"
                        type="submit"
                        disabled={searching}
                        className="bg-gradient-primary text-white h-auto py-3.5 rounded-xl font-bold shadow-glow hover:opacity-90 transition-opacity"
                    >
                        {searching
                            ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching…</span>
                            : <span className="flex items-center gap-2"><Search className="w-4 h-4" /> Search Rides</span>
                        }
                    </Button>
                </form>
            </div>

            {/* ── Results + Map ───────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-2 gap-6" ref={resultsRef}>

                {/* ─── Results column ─── */}
                <div className="space-y-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between px-1">
                        <div>
                            <h3 className="text-base font-display font-bold">
                                {searching ? "Searching…" : hasSearched ? `${rides.length} Result${rides.length !== 1 ? "s" : ""}` : "Available Rides"}
                            </h3>
                            {hasSearched && !searching && destination && (
                                <p className="text-xs text-muted-foreground mt-0.5">for "{destination}"</p>
                            )}
                        </div>
                        {hasSearched && !searching && (
                            <button
                                onClick={() => executeSearch()}
                                id="find-ride-refresh"
                                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/70 transition-colors font-medium"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                        )}
                    </div>

                    {/* Skeletons while searching */}
                    {searching && (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {/* Empty state */}
                    {!searching && hasSearched && rides.length === 0 && (
                        <EmptyState
                            destination={destination}
                            date={date}
                            onClearDate={() => { setDate(""); executeSearch(undefined, ""); }}
                            onClearAll={() => {
                                setOrigin(""); setDestination(""); setDate("");
                                setHasSearched(false); setRides([]);
                            }}
                        />
                    )}

                    {/* Pre-search prompt */}
                    {!searching && !hasSearched && (
                        <div className="text-center py-16 bg-card rounded-3xl border-2 border-dashed border-border/40">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-10" />
                            <p className="text-sm text-muted-foreground">Enter a destination to search for rides</p>
                        </div>
                    )}

                    {/* Ride cards */}
                    {!searching && rides.length > 0 && (
                        <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1 custom-scrollbar">
                            {rides.map((ride, i) => {
                                const btn = bookBtnState(ride);
                                const isSelected = selected?._id === ride._id;
                                const isBookingThis = bookingLoading && bookingId === ride._id;

                                return (
                                    <motion.div
                                        key={ride._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        onClick={() => setSelected(ride)}
                                        id={`ride-card-${i}`}
                                        className={`p-4 rounded-3xl border cursor-pointer transition-all ${isSelected
                                            ? "bg-primary/5 border-primary shadow-md shadow-primary/10"
                                            : "bg-card border-border/40 hover:border-primary/30"
                                            }`}
                                    >
                                        <div className="flex gap-3.5">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {ride.driver?.avatar
                                                    ? <img src={ride.driver.avatar} className="w-full h-full object-cover" alt={fmt.driverName(ride)} />
                                                    : <span className="text-base font-bold text-primary">{fmt.driverName(ride)[0]}</span>
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                {/* Route */}
                                                <div className="flex items-center gap-1 mb-1 flex-wrap">
                                                    <span className="text-sm font-bold truncate max-w-[120px]">
                                                        {ride.origin.split(",")[0] || "—"}
                                                    </span>
                                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                                    <span className="text-sm font-bold text-primary truncate max-w-[140px]">
                                                        {ride.destination.split(",")[0] || "—"}
                                                    </span>
                                                </div>

                                                {/* Meta */}
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mb-2">
                                                    <span className="font-semibold">{fmt.driverName(ride)}</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                        {fmt.rating(ride)}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {fmt.time(ride.departureTime)} · {fmt.dateShort(ride.departureTime)}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Car className="w-2.5 h-2.5" />
                                                        {fmt.vehicleMake(ride)}
                                                    </span>
                                                    {ride.isFull || ride.seatsAvailable === 0 ? (
                                                        <span className="flex items-center gap-0.5 font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                                                            Seats Full
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-0.5 font-semibold text-emerald-400">
                                                            <Users className="w-2.5 h-2.5" />
                                                            {ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Chips + price */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15 uppercase">
                                                            {ride.status}
                                                        </span>
                                                        {ride.estimatedDistanceKm && (
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                                                <Navigation className="w-2.5 h-2.5" />
                                                                {fmt.distanceKm(ride.estimatedDistanceKm)}
                                                            </span>
                                                        )}
                                                        {bookedIds[ride._id] && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                                                <CheckCircle2 className="w-3 h-3" /> Requested
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-black text-emerald-400 shrink-0">
                                                        {fmt.currency(ride.pricePerSeat)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inline book button (shows on selected) */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-3 pt-3 border-t border-border/30 flex gap-2"
                                                >
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 rounded-2xl h-9 text-xs font-bold border-border hover:bg-muted/40"
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            const driverId = ride.driver?._id || ride.driver?.id;
                                                            if (driverId) {
                                                                onViewProfile ? onViewProfile(driverId) : navigate(`/dashboard`);
                                                            }
                                                        }}
                                                        id={`view-profile-${i}`}
                                                    >
                                                        Driver Profile
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        disabled={btn.disabled || bookingLoading}
                                                        onClick={e => { e.stopPropagation(); setSeatBookRide(ride); }}
                                                        className={`flex-[2] text-white rounded-2xl h-9 text-xs font-bold ${btn.cls}`}
                                                        id={`book-btn-${i}`}
                                                    >
                                                        {isBookingThis
                                                            ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Booking…</span>
                                                            : btn.label
                                                        }
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ─── Map / Detail column ─── */}
                <div className="sticky top-20">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected._id}
                                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}
                                className="bg-card rounded-3xl border border-border/50 overflow-hidden"
                            >
                                {/* Map */}
                                <div className="h-72 relative overflow-hidden">
                                    <LeafletMap
                                        origin={selected.originCoords
                                            ? { lat: selected.originCoords[1], lng: selected.originCoords[0] }
                                            : undefined}
                                        destination={selected.destinationCoords
                                            ? { lat: selected.destinationCoords[1], lng: selected.destinationCoords[0] }
                                            : undefined}
                                        routeCoords={
                                            selected.originCoords && selected.destinationCoords
                                                ? [[selected.originCoords[1], selected.originCoords[0]],
                                                [selected.destinationCoords[1], selected.destinationCoords[0]]]
                                                : undefined
                                        }
                                    />
                                    <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none">
                                        <span className="bg-background/80 backdrop-blur text-[11px] px-3 py-1.5 rounded-xl border border-border font-bold shadow">Route Map</span>
                                        <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shadow text-white uppercase ${selected.status === "live" ? "bg-red-500" : "bg-emerald-600"}`}>
                                            {selected.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Detail panel */}
                                <div className="p-5">
                                    {/* Route + price */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-display font-bold text-lg leading-tight">
                                                {selected.origin.split(",")[0]} → {selected.destination.split(",")[0]}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(selected.departureTime).toLocaleString([], {
                                                    weekday: "short", month: "short", day: "numeric",
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right ml-3 shrink-0">
                                            <div className="text-2xl font-black text-primary">{fmt.currency(selected.pricePerSeat)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">per seat</div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[
                                            { label: "Distance", value: fmt.distanceKm(selected.estimatedDistanceKm), icon: <Navigation className="w-3.5 h-3.5" /> },
                                            { label: "Duration", value: fmt.durationMin(selected.estimatedDurationMin), icon: <Clock className="w-3.5 h-3.5" /> },
                                            { label: "Seats", value: String(selected.seatsAvailable), icon: <Users className="w-3.5 h-3.5" /> },
                                        ].map(s => (
                                            <div key={s.label} className="bg-muted/20 rounded-2xl p-3 text-center">
                                                <div className="flex justify-center mb-1 text-muted-foreground/60">{s.icon}</div>
                                                <div className="text-sm font-bold">{s.value}</div>
                                                <div className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/60 mt-0.5">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Driver */}
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/20 border border-border/30 mb-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                                            {selected.driver?.avatar
                                                ? <img src={selected.driver.avatar} className="w-full h-full object-cover" />
                                                : <span className="font-bold text-primary">{fmt.driverName(selected)[0]}</span>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold truncate">{fmt.driverName(selected)}</div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                                <span className="flex items-center gap-0.5">
                                                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                    {fmt.rating(selected)}
                                                </span>
                                                <span>{fmt.vehicleMake(selected)}</span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                                            {selected.seatsAvailable} seats left
                                        </span>
                                    </div>

                                    {/* CTA buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const driverId = selected.driver?._id || selected.driver?.id;
                                                if (driverId) {
                                                    onViewProfile ? onViewProfile(driverId) : navigate("/dashboard");
                                                }
                                            }}
                                            className="flex-1 rounded-2xl h-11 font-bold text-sm"
                                            id="detail-view-profile"
                                        >
                                            View Profile
                                        </Button>
                                        <Button
                                            disabled={bookBtnState(selected).disabled || bookingLoading}
                                            onClick={() => setSeatBookRide(selected)}
                                            className={`flex-[2] text-white rounded-2xl h-11 font-bold text-sm ${bookBtnState(selected).cls}`}
                                            id="detail-book-btn"
                                        >
                                            {bookingLoading && bookingId === selected._id
                                                ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Booking…</span>
                                                : <>
                                                    <Wallet className="w-4 h-4 mr-1.5" />
                                                    {bookBtnState(selected).label}
                                                </>
                                            }
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-64 bg-muted/10 rounded-3xl border-2 border-dashed border-border/30
                                           flex flex-col items-center justify-center text-muted-foreground/40 gap-3"
                            >
                                <Navigation className="w-14 h-14" />
                                <p className="text-sm">Select a ride to view its route</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Stripe payment modal ─────────────────────────────────────── */}
            {clientSecret && (
                <StripeCheckoutModal
                    clientSecret={clientSecret}
                    amount={paymentAmount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onClose={() => setClientSecret(null)}
                />
            )}
        </div>
    );
};

export default FindRide;
