import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Navigation, Clock, Car, Search, Loader2, MapPin,
    ChevronDown, ChevronUp, MessageSquare, Star, AlertCircle,
    CheckCircle2, XCircle, Info, RefreshCw, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "../../lib/api";
import { toast } from "sonner";
import { RateRideModal } from "@/components/RateRideModal";

// ── Status configuration ────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    pending:    { label: "Pending",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    icon: Clock },
    confirmed:  { label: "Confirmed", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       icon: CheckCircle2 },
    rejected:   { label: "Declined", cls: "bg-red-500/10 text-red-400 border-red-500/20",           icon: XCircle },
    cancelled:  { label: "Cancelled", cls: "bg-muted/30 text-muted-foreground border-border",       icon: XCircle },
    picked_up:  { label: "En Route",  cls: "bg-primary/10 text-primary border-primary/20",          icon: Navigation },
    completed:  { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt = {
    date: (d: any) => d ? new Date(d).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) : "—",
    time: (d: any) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
    currency: (n: any) => {
        const v = Number(n);
        if (!v || isNaN(v)) return "—";
        return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(v);
    },
    addr: (s: string | undefined) => s?.split(",")[0] || "—",
    car: (offer: any) => {
        const v = offer?.vehicle || offer?.driver?.vehicle;
        if (!v) return "Not provided";
        if (typeof v === "string") return v;
        const parts = [v.make, v.model, v.year].filter(Boolean);
        return parts.length ? parts.join(" ") : "Not provided";
    },
    plate: (offer: any) => {
        const v = offer?.vehicle || offer?.driver?.vehicle;
        return v?.plateNumber || "Not provided";
    },
};

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS[status] || STATUS.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.cls}`}>
            <Icon className="w-2.5 h-2.5" />
            {cfg.label}
        </span>
    );
}

// ── Inline Chat Modal ────────────────────────────────────────────────────────
import { useRef } from "react";
import { Send, X, Trash2, CheckCheck, Check } from "lucide-react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";

function ChatModal({ booking, me, onClose }: { booking: any; me: any; onClose: () => void }) {
    const [msgs, setMsgs] = useState<any[]>([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<Socket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const partner = booking.driver?._id === me?._id ? booking.rider : booking.driver;

    useEffect(() => {
        fetchMsgs();
        const token = localStorage.getItem("carpconnect_token");
        if (token) {
            socketRef.current = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
            socketRef.current.emit("join:chat", { bookingId: booking._id });
            socketRef.current.on("chat:message", (msg: any) => {
                setMsgs(prev => prev.find(m => m._id === msg._id) ? prev : [
                    ...prev,
                    { _id: msg._id || Date.now(), content: msg.content, createdAt: msg.timestamp || new Date(), sender: { _id: msg.senderId } }
                ]);
            });
        }
        return () => {
            socketRef.current?.emit("leave:chat", { bookingId: booking._id });
            socketRef.current?.disconnect();
        };
    }, [booking._id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [msgs]);

    const fetchMsgs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/chat/${booking._id}`);
            setMsgs(res.data?.data?.messages || []);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const send = async () => {
        if (!text.trim()) return;
        const payload = text.trim();
        setText("");
        if (socketRef.current?.connected) {
            socketRef.current.emit("chat:send", { bookingId: booking._id, content: payload });
        } else {
            try {
                const res = await api.post("/chat", { bookingId: booking._id, content: payload });
                if (res.data?.data?.message) setMsgs(prev => [...prev, res.data.data.message]);
                else fetchMsgs();
            } catch { toast.error("Failed to send message."); }
        }
    };

    const del = async (id: string) => {
        await api.delete(`/chat/${id}`);
        setMsgs(prev => prev.filter(m => m._id !== id));
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
                className="w-full max-w-lg bg-card rounded-3xl border border-border/50 shadow-2xl flex flex-col overflow-hidden"
                style={{ height: "70vh", maxHeight: "600px" }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-card">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {partner?.avatar

                            ? <img src={partner.avatar} className="w-full h-full object-cover" />
                            : <span className="font-bold text-primary text-sm">{partner?.name?.[0] || "?"}</span>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{partner?.name || "Unknown"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                            {booking.offer?.origin?.address?.split(",")[0] || "Ride"} → {booking.offer?.destination?.address?.split(",")[0] || ""}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-muted/5">
                    {loading && (
                        <div className="flex justify-center pt-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                        </div>
                    )}
                    {!loading && msgs.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground pt-10">
                            No messages yet. Say hello! 👋
                        </div>
                    )}
                    {msgs.map(msg => {
                        const isMe = msg.sender?._id === me?._id;
                        return (
                            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                                <div className="flex items-center gap-2">
                                    {isMe && (
                                        <button onClick={() => del(msg._id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/10 rounded-full transition-all">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-white" : "bg-card border border-border text-foreground"}`}>
                                        <p>{msg.content}</p>
                                        <div className="text-[9px] mt-1 opacity-60 flex items-center gap-1 justify-end">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            {isMe && (msg.status === "seen" ? <CheckCheck className="w-2.5 h-2.5 text-blue-300" /> : <Check className="w-2.5 h-2.5" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-border bg-card flex items-center gap-2">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                        placeholder="Type a message…"
                        className="flex-1 bg-muted/30 rounded-xl px-4 py-2.5 text-sm outline-none border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Button onClick={send} className="h-10 w-10 p-0 bg-primary text-white rounded-xl shadow-glow shrink-0">
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ booking, onClose }: { booking: any; onClose: () => void }) {
    const offer = booking.offer;
    const fields = [
        { label: "Booking ID", value: `#${booking._id?.slice(-8).toUpperCase()}` },
        { label: "Date", value: `${fmt.date(offer?.departureTime)} at ${fmt.time(offer?.departureTime)}` },
        { label: "From", value: offer?.origin?.address || "—" },
        { label: "To", value: offer?.destination?.address || "—" },
        { label: "Driver", value: booking.driver?.name || "—" },
        { label: "Seats", value: booking.seatsRequested || 1 },
        { label: "Fare", value: fmt.currency(booking.fare?.totalAmount) },
        { label: "Vehicle", value: fmt.car(offer) },
        { label: "Plate No.", value: fmt.plate(offer) },
        { label: "Status", value: <StatusBadge status={booking.status} /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }}
                className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h3 className="font-display font-bold text-base">Booking Details</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                <div className="p-6 space-y-3">
                    {fields.map(f => (
                        <div key={f.label} className="flex items-start justify-between gap-4">
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider shrink-0">{f.label}</span>
                            <span className="text-xs text-foreground font-semibold text-right">{f.value}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const MyRides = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(1);
    const [chatBooking, setChatBooking] = useState<any>(null);
    const [detailBooking, setDetailBooking] = useState<any>(null);
    const [reviewBooking, setReviewBooking] = useState<any>(null);
    const [rebookOffer, setRebookOffer] = useState<any>(null);
    const [rebookingLoading, setRebookingLoading] = useState(false);
    const [me, setMe] = useState<any>(null);
    const PAGE_SIZE = 8;

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("carpconnect_user") || "{}");
        setMe(user);
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/bookings");
            if (res.data.success) {
                setBookings(res.data.data.bookings || []);
            }
        } catch (err) {
            toast.error("Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await api.patch(`/bookings/${id}/status`, { status: "cancelled" });
            toast.success("Booking cancelled.");
            fetchBookings();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to cancel booking.");
        }
    };

    const executeRebook = async (seatsNeeded: number) => {
        if (!rebookOffer) return;
        setRebookingLoading(true);
        try {
            await api.post("/rides/book-direct", {
                offerId: rebookOffer._id,
                seatsNeeded,
            });
            toast.success("Ride rebooked! 🎉", { description: "We've sent a new booking request to the driver." });
            setRebookOffer(null);
            fetchBookings();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Rebooking failed. The ride might be full or unavailable.");
        } finally {
            setRebookingLoading(false);
        }
    };

    // Filter + search + sort
    const filtered = bookings
        .filter(b => filter === "all" || b.status === filter)
        .filter(b => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                b.offer?.origin?.address?.toLowerCase().includes(q) ||
                b.offer?.destination?.address?.toLowerCase().includes(q) ||
                b.driver?.name?.toLowerCase().includes(q) ||
                b._id?.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const da = new Date(a.offer?.departureTime || a.createdAt).getTime();
            const db = new Date(b.offer?.departureTime || b.createdAt).getTime();
            return sortAsc ? da - db : db - da;
        });

    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled", "rejected"];

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-display font-bold">My Rides</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchBookings}
                    className="rounded-xl gap-2 h-10"
                    id="my-rides-refresh"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Search + filter */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by origin, destination, driver or booking ID…"
                        className="w-full bg-muted/20 border border-border rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        id="my-rides-search"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${filter === f
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-card border-border text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {f === "all" ? "All" : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {paged.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-card rounded-3xl border-2 border-dashed border-border/40"
                >
                    <AlertCircle className="w-14 h-14 mx-auto mb-4 opacity-15" />
                    <h3 className="font-bold text-lg mb-1">No bookings yet</h3>
                    <p className="text-sm text-muted-foreground">
                        {search || filter !== "all" ? "No bookings match your filters." : "Start exploring rides to book your first trip."}
                    </p>
                </motion.div>
            ) : (
                <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
                    {/* Table scroll container */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/20">
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Booking ID</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Driver</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Route</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                                        <button onClick={() => setSortAsc(p => !p)} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                            Date {sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Vehicle</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Seats</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fare</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Status</th>
                                    <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((b, i) => (
                                    <motion.tr
                                        key={b._id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors group"
                                    >
                                        {/* ID */}
                                        <td className="px-5 py-4">
                                            <span className="font-mono text-xs text-muted-foreground font-bold">
                                                #{b._id?.slice(-8).toUpperCase()}
                                            </span>
                                        </td>

                                        {/* Driver */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    {b.driver?.avatar
                                                        ? <img src={b.driver.avatar} className="w-full h-full object-cover" />
                                                        : <span className="text-xs font-bold text-primary">{b.driver?.name?.[0] || "?"}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-xs text-foreground">{b.driver?.name || "—"}</div>
                                                    <div className="flex items-center gap-0.5 text-[10px] text-amber-400">
                                                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                                                        {b.driver?.ratings?.average?.toFixed(1) || "N/A"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Route */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <MapPin className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                                <span className="truncate max-w-[100px] font-medium" title={b.offer?.origin?.address}>
                                                    {fmt.addr(b.offer?.origin?.address)}
                                                </span>
                                                <span className="text-muted-foreground">→</span>
                                                <span className="truncate max-w-[100px] font-medium text-primary" title={b.offer?.destination?.address}>
                                                    {fmt.addr(b.offer?.destination?.address)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="text-xs font-semibold text-foreground">{fmt.date(b.offer?.departureTime || b.createdAt)}</div>
                                            <div className="text-[10px] text-muted-foreground">{fmt.time(b.offer?.departureTime || b.createdAt)}</div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="px-5 py-4">
                                            <div className="text-xs font-semibold text-foreground">{fmt.car(b.offer)}</div>
                                            <div className="text-[10px] text-muted-foreground">{fmt.plate(b.offer)}</div>
                                        </td>

                                        {/* Seats */}
                                        <td className="px-5 py-4 text-xs font-semibold text-center">{b.seatsRequested || 1}</td>

                                        {/* Fare */}
                                        <td className="px-5 py-4 text-xs font-black text-emerald-400 whitespace-nowrap">
                                            {fmt.currency(b.fare?.totalAmount)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <StatusBadge status={b.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setDetailBooking(b)}
                                                    title="View Details"
                                                    className="p-2 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all"
                                                    id={`view-detail-${i}`}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setChatBooking(b)}
                                                    title="Message Driver"
                                                    className="p-2 rounded-xl bg-muted/30 hover:bg-primary/10 hover:text-primary transition-all"
                                                    id={`msg-btn-${i}`}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </button>
                                                {(b.status === "pending" || b.status === "confirmed") && (
                                                    <button
                                                        onClick={() => handleCancel(b._id)}
                                                        title="Cancel"
                                                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                                        id={`cancel-btn-${i}`}
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {b.status === "completed" && (
                                                    <button
                                                        onClick={() => setReviewBooking(b)}
                                                        title="Rate Journey"
                                                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all"
                                                        id={`rate-btn-${i}`}
                                                    >
                                                        <Star className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {(b.status === "cancelled" || b.status === "rejected") && b.offer && (
                                                    <button
                                                        onClick={() => setRebookOffer(b.offer)}
                                                        title="Rebook Ride"
                                                        className="p-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold tracking-wider text-[10px] uppercase flex items-center gap-1.5 transition-all"
                                                        id={`rebook-btn-${i}`}
                                                    >
                                                        <RefreshCw className="w-3 h-3" /> Rebook
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border/30 bg-muted/10">
                            <span className="text-xs text-muted-foreground">
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${p === page ? "bg-primary text-white" : "border border-border hover:bg-muted/30"}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {chatBooking && <ChatModal booking={chatBooking} me={me} onClose={() => setChatBooking(null)} />}
                {detailBooking && <DetailDrawer booking={detailBooking} onClose={() => setDetailBooking(null)} />}
                {rebookOffer && (
                    <RebookModal
                        offer={rebookOffer}
                        loading={rebookingLoading}
                        onClose={() => setRebookOffer(null)}
                        onConfirm={executeRebook}
                    />
                )}
                {reviewBooking && (
                    <RateRideModal
                        booking={reviewBooking}
                        onClose={() => setReviewBooking(null)}
                        onSuccess={() => { setReviewBooking(null); toast.success("Review submitted! ⭐"); fetchBookings(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Rebook Modal (duplicate of FindRide's seat picker for standalone usage) ──
function RebookModal({ offer, onConfirm, onClose, loading }: { offer: any, loading: boolean, onConfirm: (s: number) => void, onClose: () => void }) {
    const [seats, setSeats] = useState(1);
    const maxAvailable = offer.seatsAvailable || 8;
    const max = Math.min(maxAvailable, 8);
    const total = (offer.pricePerSeat || 0) * seats;

    const fmt2 = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 }).format(n);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }} className="w-full max-w-sm bg-card rounded-3xl border border-border/50 shadow-2xl overflow-hidden p-6" onClick={e => e.stopPropagation()}>
                <h3 className="font-display font-bold text-lg mb-4">Rebook this ride</h3>
                <div className="flex justify-between bg-muted/20 rounded-2xl p-4 mb-4">
                    <div>
                        <div className="text-xs text-muted-foreground font-bold">Price / Seat</div>
                        <div className="text-xl font-display font-black text-primary">{fmt2(offer.pricePerSeat || 0)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-muted-foreground font-bold">Available</div>
                        <div className="text-xl font-display font-black text-emerald-400">{maxAvailable}</div>
                    </div>
                </div>

                <label className="text-xs font-bold text-muted-foreground block mb-3">Number of seats</label>
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={seats <= 1} className="w-12 h-12 rounded-2xl bg-muted/20 border hover:bg-muted/40 font-bold text-xl transition-all disabled:opacity-30">−</button>
                    <div className="flex-1 text-center"><div className="text-4xl font-display font-black">{seats}</div></div>
                    <button onClick={() => setSeats(s => Math.min(max, s + 1))} disabled={seats >= max} className="w-12 h-12 rounded-2xl bg-muted/20 border hover:bg-muted/40 font-bold text-xl transition-all disabled:opacity-30">+</button>
                </div>

                <Button onClick={() => onConfirm(seats)} disabled={loading || max === 0} className="w-full py-6 bg-gradient-primary text-white rounded-2xl font-bold shadow-glow">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : max === 0 ? "Seats Full" : `Confirm ${seats} seat(s) · ${fmt2(total)}`}
                </Button>
            </motion.div>
        </motion.div>
    );
}

export default MyRides;
