import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Users, DollarSign, Settings, ArrowRight, Car, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";

const OfferRide = () => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [departureTime, setDepartureTime] = useState("");
    const [seatsTotal, setSeatsTotal] = useState("4");
    const [pricePerSeat, setPricePerSeat] = useState("");
    const [preferences, setPreferences] = useState({
        smoking: false,
        pets: false,
        music: true
    });

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const handleCreateOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const token = localStorage.getItem("carpconnect_token");
            if (!token) throw new Error("Authentication required. Please log in.");

            const reqBody = {
                origin: {
                    address: origin,
                },
                destination: {
                    address: destination,
                },
                departureTime,
                seatsTotal: parseInt(seatsTotal),
                pricePerSeat: parseInt(pricePerSeat) || undefined,
                currency: "PKR",
                preferences: {
                    smokingAllowed: preferences.smoking,
                    petsAllowed: preferences.pets,
                    musicAllowed: preferences.music
                }
            };

            const response = await api.post("/rides/offers", reqBody, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setSuccessMsg("Ride Offer created successfully!");
                // Clear form
                setOrigin("");
                setDestination("");
                setDepartureTime("");
                setSeatsTotal("4");
                setPricePerSeat("");
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || "Failed to create ride offer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-card"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white">
                    <Car className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Offer a Ride</h2>
                    <p className="text-muted-foreground text-sm">Publish your upcoming trip to find passengers</p>
                </div>
            </div>

            {errorMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-500">{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <CheckCircle className="w-5 h-5 text-emerald flex-shrink-0" />
                    <span className="text-sm text-emerald">{successMsg}</span>
                </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-6">
                <div className="space-y-4 relative">
                    {/* Visual connecting line */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border/50" />

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Leaving from</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} required className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 focus:bg-background" placeholder="E.g. F-8 Markaz, Islamabad" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Going to</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald" />
                            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} required className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 focus:bg-background" placeholder="E.g. DHA Phase 1, Lahore" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Departure Date & Time</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all focus:bg-background" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seats Available</label>
                        <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select value={seatsTotal} onChange={(e) => setSeatsTotal(e.target.value)} className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer focus:bg-background">
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>{num} {num === 1 ? 'Seat' : 'Seats'}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Price per Seat (PKR)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="number" min="0" step="100" value={pricePerSeat} onChange={(e) => setPricePerSeat(e.target.value)} className="w-full bg-muted/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60 focus:bg-background" placeholder="E.g. 1500 (Leave blank for auto-calculation)" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">If left blank, price will be auto-calculated based on distance.</p>
                </div>

                <div className="pt-4 border-t border-border/50">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ride Preferences</label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'music', label: 'Music', icon: '🎵' },
                            { id: 'smoking', label: 'Smoking', icon: '🚭' },
                            { id: 'pets', label: 'Pets', icon: '🐾' }
                        ].map((pref) => (
                            <button
                                key={pref.id}
                                type="button"
                                onClick={() => setPreferences({ ...preferences, [pref.id]: !preferences[pref.id as keyof typeof preferences] })}
                                className={`p-4 rounded-xl border-2 text-center transition-all ${preferences[pref.id as keyof typeof preferences]
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                                    }`}
                            >
                                <div className="text-2xl mb-2">{pref.icon}</div>
                                <div className="text-xs font-semibold">{pref.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 mt-6 rounded-xl bg-gradient-primary text-white shadow-glow hover:opacity-90 font-semibold"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Publishing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">Publish Ride <ArrowRight className="w-4 h-4" /></span>
                    )}
                </Button>
            </form>
        </motion.div>
    );
};

export default OfferRide;
