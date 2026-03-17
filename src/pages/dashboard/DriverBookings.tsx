import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, FileText, User, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";

const DriverBookings = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<"all" | "today" | "week" | "month">("all");

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("carpconnect_token");
            const response = await api.get("/bookings", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const user = JSON.parse(localStorage.getItem("carpconnect_user") || "{}");
                const driverBookings = response.data.data.bookings.filter((b: any) => b.driver?._id === user._id || b.driver === user._id);
                setBookings(driverBookings);
            }
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const filtered = bookings.filter(b => {
        if (timeFilter === "all") return true;
        
        const bookingDate = new Date(b.offer?.departureTime || b.createdAt);
        const now = new Date();
        
        if (timeFilter === "today") {
            return bookingDate.toDateString() === now.toDateString();
        } else if (timeFilter === "week") {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return bookingDate >= weekAgo;
        } else if (timeFilter === "month") {
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            return bookingDate >= monthAgo;
        }
        return true;
    });

    const handleStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const token = localStorage.getItem("carpconnect_token");
            const response = await api.patch(`/bookings/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBookings(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
            }
        } catch (err) {
            console.error("Failed to update status:", err);
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Manage Requests</h2>
                    <p className="text-sm text-muted-foreground mt-1">Review and manage rider requests for your rides</p>
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
            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-lg font-bold">No Bookings Found</h3>
                    <p className="text-muted-foreground text-sm">Try changing the filters or checking back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((booking) => (
                        <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-card rounded-2xl p-5 border shadow-sm transition-all relative overflow-hidden ${booking.status === "confirmed" ? "border-emerald/30" :
                                    booking.status === "cancelled" ? "border-red-500/30 opacity-70" :
                                        "border-amber-500/30"
                                }`}
                        >
                            {booking.status === "confirmed" && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald/10 rounded-bl-full" />}
                            {booking.status === "pending" && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full" />}

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                        {booking.rider?.avatar ? <img src={booking.rider.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{booking.rider?.name || "Rider"}</div>
                                        <div className="text-xs text-amber-500 font-medium">⭐ {booking.rider?.ratings?.average || "New"}</div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${booking.status === "confirmed" ? "bg-emerald/20 text-emerald" :
                                        booking.status === "cancelled" ? "bg-red-500/20 text-red-500" :
                                            "bg-amber-500/20 text-amber-500"
                                    }`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">From</span>
                                    <span className="font-medium text-right max-w-[140px] truncate">{booking.offer?.origin?.address || "Source"}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">To</span>
                                    <span className="font-medium text-right max-w-[140px] truncate">{booking.offer?.destination?.address || "Destination"}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-2 border-t border-border/50">
                                    <span className="font-medium text-foreground">Earnable Fare</span>
                                    <span className="font-bold text-emerald">{booking.fare?.currency || "PKR"} {booking.fare?.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>

                            {booking.status === "pending" && (
                                <div className="flex gap-3">
                                    <Button
                                        disabled={updatingId === booking._id}
                                        onClick={() => handleStatus(booking._id, "rejected")}
                                        variant="outline"
                                        className="flex-1 py-1 h-9 border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold"
                                    >
                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                    <Button
                                        disabled={updatingId === booking._id}
                                        onClick={() => handleStatus(booking._id, "confirmed")}
                                        className="flex-1 py-1 h-9 bg-emerald text-white hover:bg-emerald/90 text-xs font-semibold shadow-glow-emerald"
                                    >
                                        {updatingId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />} Accept
                                    </Button>
                                </div>
                            )}

                            {booking.status === "rejected" && (
                                <div className="text-center py-2 text-[10px] font-bold text-red-500 uppercase">You declined this request</div>
                            )}

                            {booking.status === "confirmed" && (
                                <Button
                                    className="w-full h-9 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold"
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" /> Message Rider
                                </Button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DriverBookings;
