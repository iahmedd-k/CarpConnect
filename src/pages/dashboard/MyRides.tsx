import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, MapPin, Clock, Star, Filter, Search, Car, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const rides = [
    {
        id: 1,
        from: "Home — Sunset District",
        to: "Downtown Office",
        date: "Today",
        time: "8:30 AM",
        driver: "Marcus J.",
        driverAvatar: "MJ",
        rating: 4.9,
        seats: 2,
        fare: "$4.50",
        status: "upcoming",
        co2: "1.2 kg",
    },
    {
        id: 2,
        from: "Office",
        to: "Gym — Mission District",
        date: "Today",
        time: "6:00 PM",
        driver: "Priya S.",
        driverAvatar: "PS",
        rating: 4.8,
        seats: 3,
        fare: "$3.20",
        status: "upcoming",
        co2: "0.9 kg",
    },
    {
        id: 3,
        from: "Home",
        to: "Airport Terminal 2",
        date: "Mar 9",
        time: "10:15 AM",
        driver: "Elena R.",
        driverAvatar: "ER",
        rating: 5.0,
        seats: 1,
        fare: "$12.00",
        status: "upcoming",
        co2: "2.1 kg",
    },
    {
        id: 4,
        from: "Home",
        to: "Downtown Office",
        date: "Mar 7",
        time: "8:30 AM",
        driver: "James K.",
        driverAvatar: "JK",
        rating: 4.7,
        seats: 2,
        fare: "$4.50",
        status: "completed",
        co2: "1.2 kg",
    },
    {
        id: 5,
        from: "Caltrain Station",
        to: "Tech Campus",
        date: "Mar 6",
        time: "9:00 AM",
        driver: "Sophie L.",
        driverAvatar: "SL",
        rating: 5.0,
        seats: 1,
        fare: "$6.80",
        status: "completed",
        co2: "1.8 kg",
    },
    {
        id: 6,
        from: "Home",
        to: "University",
        date: "Mar 5",
        time: "7:45 AM",
        driver: "David C.",
        driverAvatar: "DC",
        rating: 4.6,
        seats: 2,
        fare: "$5.10",
        status: "cancelled",
        co2: "0 kg",
    },
];

const statusConfig = {
    upcoming: { label: "Upcoming", color: "bg-primary/10 text-primary", icon: AlertCircle },
    completed: { label: "Completed", color: "bg-emerald-light text-emerald", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const MyRides = () => {
    const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
    const [search, setSearch] = useState("");

    const filtered = rides.filter((r) => {
        const matchFilter = filter === "all" || r.status === filter;
        const matchSearch =
            r.from.toLowerCase().includes(search.toLowerCase()) ||
            r.to.toLowerCase().includes(search.toLowerCase()) ||
            r.driver.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">My Rides</h2>
                    <p className="text-sm text-muted-foreground mt-1">Track all your upcoming and past carpools</p>
                </div>
                <Button className="bg-gradient-primary text-white shadow-glow hover:opacity-90">
                    <Car className="w-4 h-4 mr-2" /> Book New Ride
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search rides, drivers, destinations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${filter === f
                                    ? "bg-gradient-primary text-white shadow-glow"
                                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rides List */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="font-display font-bold text-foreground mb-1">No rides found</h3>
                        <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    filtered.map((ride, i) => {
                        const sc = statusConfig[ride.status as keyof typeof statusConfig];
                        return (
                            <motion.div
                                key={ride.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-card rounded-2xl border border-border/50 p-5 hover:shadow-card transition-all duration-300 group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                                        <Navigation className="w-5 h-5 text-white" />
                                    </div>

                                    {/* Route */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1 flex-wrap">
                                            <span>{ride.from}</span>
                                            <span className="text-muted-foreground">→</span>
                                            <span>{ride.to}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ride.date} · {ride.time}</span>
                                            <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {ride.driver}</span>
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber text-amber" /> {ride.rating}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ride.seats} seat{ride.seats > 1 ? "s" : ""}</span>
                                            <span className="text-primary font-medium">🌿 {ride.co2} saved</span>
                                        </div>
                                    </div>

                                    {/* Right side */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                                        <span className="text-lg font-display font-bold text-foreground">{ride.fare}</span>
                                        {ride.status === "upcoming" && (
                                            <button className="text-xs text-destructive hover:text-destructive/80 transition-colors">Cancel</button>
                                        )}
                                        {ride.status === "completed" && (
                                            <button className="text-xs text-primary hover:text-primary/80 transition-colors">Rate Ride</button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MyRides;
