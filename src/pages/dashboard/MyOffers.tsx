import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, MapPin, Clock, Users, ArrowRight, Loader2, Trash2, AlertCircle } from "lucide-react";
import api from "../../lib/api";

const MyOffers = () => {
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");

    const fetchOffers = async () => {
        try {
            const res = await api.get("/rides/offers");
            if (res.data.success) {
                setOffers(res.data.data.offers || []);
            }
        } catch (err) {
            console.error("Failed to fetch offers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const filtered = offers.filter(o => {
        if (timeFilter === "all") return true;
        
        const offerDate = new Date(o.departureTime || o.createdAt);
        const now = new Date();
        
        if (timeFilter === "today") {
            return offerDate.toDateString() === now.toDateString();
        } else if (timeFilter === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return offerDate >= weekAgo;
        } else if (timeFilter === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return offerDate >= monthAgo;
        }
        return true;
    });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this ride offer?")) return;
        try {
            await api.patch(`/rides/offers/${id}/status`, { status: "cancelled" });
            fetchOffers();
        } catch (err) {
            console.error("Failed to cancel offer:", err);
            alert("Failed to cancel ride offer.");
        }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">My Published Rides</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage the rides you have offered to others</p>
                </div>
                <div className="flex gap-1 p-1 bg-muted/20 rounded-xl border border-border/50">
                    {(["all", "today", "week", "month"] as const).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFilter(tf)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${timeFilter === tf
                                ? "bg-card text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-3xl border border-border/50">
                        <div className="text-4xl mb-3">🚗</div>
                        <h3 className="font-display font-bold text-foreground mb-1">No rides found</h3>
                        <p className="text-muted-foreground text-sm">Try changing the filters or publishing a new ride.</p>
                    </div>
                ) : (
                    filtered.map((offer, i) => (
                        <motion.div
                            key={offer._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-card transition-all duration-300"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                                        <Car className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                                            <span>{offer.origin?.address.split(',')[0]}</span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <span>{offer.destination?.address.split(',')[0]}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(offer.departureTime).toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {offer.seatsAvailable}/{offer.seatsTotal} Seats Available</span>
                                            <span className="text-emerald font-semibold">{offer.currency} {offer.pricePerSeat} / set</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end md:self-center">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        offer.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {offer.status}
                                    </div>
                                    {offer.status === 'active' && (
                                        <button 
                                            onClick={() => handleDelete(offer._id)}
                                            className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                            title="Cancel Offer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyOffers;
