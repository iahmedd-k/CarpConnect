import { useState } from "react";
import { motion } from "framer-motion";
import {
    Car, Leaf, Wallet, Bell, Settings, LogOut,
    TrendingUp, Users, ArrowUp, MessageSquare, Navigation,
    CheckCircle, Calendar, Zap, Star, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

// Inner pages
import MyRides from "./dashboard/MyRides";
import Emissions from "./dashboard/Emissions";
import WalletPage from "./dashboard/WalletPage";
import Messages from "./dashboard/Messages";
import Community from "./dashboard/Community";

/* ──────────── static data ──────────── */
const rideHistory = [
    { month: "Jan", rides: 12, saved: 48 },
    { month: "Feb", rides: 18, saved: 72 },
    { month: "Mar", rides: 15, saved: 60 },
    { month: "Apr", rides: 22, saved: 88 },
    { month: "May", rides: 28, saved: 112 },
    { month: "Jun", rides: 24, saved: 96 },
    { month: "Jul", rides: 31, saved: 124 },
];

const emissionsData = [
    { name: "CO₂ Saved", value: 127, color: "#10b981" },
    { name: "Remaining", value: 73, color: "#1e3a3a" },
];

const weeklyData = [
    { day: "Mon", rides: 2 },
    { day: "Tue", rides: 3 },
    { day: "Wed", rides: 1 },
    { day: "Thu", rides: 4 },
    { day: "Fri", rides: 3 },
    { day: "Sat", rides: 1 },
    { day: "Sun", rides: 0 },
];

const upcomingRides = [
    { from: "Home", to: "Downtown Office", time: "8:30 AM", driver: "Marcus J.", rating: 4.9, seats: 2, date: "Today" },
    { from: "Office", to: "Gym District", time: "6:00 PM", driver: "Priya S.", rating: 4.8, seats: 3, date: "Today" },
    { from: "Home", to: "Airport T2", time: "10:15 AM", driver: "Elena R.", rating: 5.0, seats: 1, date: "Tomorrow" },
];

const achievements = [
    { icon: "🌿", title: "Eco Warrior", desc: "100kg CO₂ saved", earned: true },
    { icon: "⭐", title: "Top Rider", desc: "50 rides completed", earned: true },
    { icon: "💬", title: "Connector", desc: "10+ unique drivers", earned: true },
    { icon: "🏆", title: "VIP Member", desc: "6 months active", earned: false },
];

const navItems = [
    { id: "overview", icon: TrendingUp, label: "Overview" },
    { id: "rides", icon: Car, label: "My Rides" },
    { id: "community", icon: Users, label: "Community" },
    { id: "emissions", icon: Leaf, label: "Emissions" },
    { id: "wallet", icon: Wallet, label: "Wallet" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
];

/* ──────────── Overview component (inline) ──────────── */
const Overview = () => (
    <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { icon: Car, label: "Total Rides", value: "142", change: "+12%", color: "text-primary" },
                { icon: Wallet, label: "Money Saved", value: "$1,240", change: "+8%", color: "text-emerald" },
                { icon: Leaf, label: "CO₂ Saved", value: "312 kg", change: "+15%", color: "text-emerald" },
                { icon: Star, label: "Your Rating", value: "4.9★", change: "+0.1", color: "text-amber" },
            ].map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card rounded-2xl p-5 border border-border/50 hover:shadow-card transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <stat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald font-medium">
                            <ArrowUp className="w-3 h-3" /> {stat.change}
                        </div>
                    </div>
                    <div className={`text-2xl font-display font-bold ${stat.color} mb-1`}>{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
            ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border/50"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-display font-bold text-foreground">Rides & Savings</h3>
                        <p className="text-xs text-muted-foreground">Last 7 months overview</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">2026</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={rideHistory}>
                        <defs>
                            <linearGradient id="colorRides" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 90%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200, 10%, 45%)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(200, 10%, 45%)" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150, 15%, 90%)", borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="rides" stroke="hsl(168, 80%, 36%)" strokeWidth={2} fill="url(#colorRides)" name="Rides" />
                        <Area type="monotone" dataKey="saved" stroke="hsl(38, 92%, 55%)" strokeWidth={2} fill="url(#colorSaved)" name="$ Saved" />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
            >
                <h3 className="font-display font-bold text-foreground mb-1">Monthly CO₂</h3>
                <p className="text-xs text-muted-foreground mb-4">Goal: 200 kg saved</p>
                <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                        <Pie data={emissionsData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                            {emissionsData.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="text-center -mt-4">
                    <div className="text-2xl font-display font-bold text-foreground">127 kg</div>
                    <div className="text-xs text-muted-foreground">63.5% of monthly goal</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">CO₂ Saved this month</span>
                </div>
            </motion.div>
        </div>

        {/* Weekly Bars + Upcoming */}
        <div className="grid lg:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
            >
                <h3 className="font-display font-bold text-foreground mb-1">This Week</h3>
                <p className="text-xs text-muted-foreground mb-4">Daily ride count</p>
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={weeklyData} barSize={22}>
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(200, 10%, 45%)" }} axisLine={false} tickLine={false} />
                        <Bar dataKey="rides" radius={[6, 6, 0, 0]} fill="hsl(168, 80%, 36%)" />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border/50"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-foreground">Upcoming Rides</h3>
                    <Button size="sm" className="bg-gradient-primary text-white text-xs shadow-glow hover:opacity-90">+ Book Ride</Button>
                </div>
                <div className="space-y-3">
                    {upcomingRides.map((ride, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                                <Navigation className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    <span>{ride.from}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span>{ride.to}</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {ride.date} · {ride.time} · {ride.driver} · ⭐ {ride.rating}
                                </div>
                            </div>
                            <div className="text-xs text-primary font-medium shrink-0">{ride.seats} seat{ride.seats > 1 ? "s" : ""} left</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>

        {/* Achievements + Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
            >
                <h3 className="font-display font-bold text-foreground mb-5">Achievements</h3>
                <div className="grid grid-cols-2 gap-3">
                    {achievements.map((a, i) => (
                        <div key={i} className={`p-4 rounded-xl border transition-all ${a.earned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border opacity-50"}`}>
                            <div className="text-2xl mb-2">{a.icon}</div>
                            <div className="text-sm font-semibold text-foreground">{a.title}</div>
                            <div className="text-xs text-muted-foreground">{a.desc}</div>
                            {a.earned && <div className="mt-2 flex items-center gap-1 text-xs text-primary"><CheckCircle className="w-3 h-3" /> Earned</div>}
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
            >
                <h3 className="font-display font-bold text-foreground mb-5">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: MapPin, label: "Find a Ride", color: "bg-primary text-white" },
                        { icon: Car, label: "Offer a Ride", color: "bg-gradient-warm text-white" },
                        { icon: Calendar, label: "Schedule", color: "bg-secondary text-secondary-foreground" },
                        { icon: Zap, label: "Instant Match", color: "bg-emerald-light text-emerald" },
                    ].map((action, i) => (
                        <button key={i} className={`${action.color} rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 hover:scale-[1.02] transition-all`}>
                            <action.icon className="w-5 h-5" />
                            <span className="text-xs font-semibold">{action.label}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-5 p-4 rounded-xl bg-gradient-primary text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Leaf className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold">Your Impact Score</div>
                            <div className="text-xs text-white/70">Top 12% of all riders this month</div>
                        </div>
                        <div className="ml-auto text-2xl font-display font-bold">87</div>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
);

/* ──────────── Dashboard Shell ──────────── */
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("overview");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case "rides": return <MyRides />;
            case "emissions": return <Emissions />;
            case "wallet": return <WalletPage />;
            case "messages": return <Messages />;
            case "community": return <Community />;
            default: return <Overview />;
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-foreground flex-col z-40 hidden lg:flex">
                <div className="p-6 border-b border-white/10">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-display font-bold text-primary-foreground text-lg">CarpConnect</span>
                    </Link>
                </div>

                {/* User info */}
                <div className="px-4 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">AS</div>
                        <div>
                            <div className="text-sm font-semibold text-primary-foreground">Alex Smith</div>
                            <div className="text-xs text-primary-foreground/40">Rider Pro · ⭐ 4.9</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                    ? "bg-gradient-primary text-white shadow-glow"
                                    : "text-primary-foreground/50 hover:bg-white/5 hover:text-primary-foreground"
                                }`}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-foreground/50 hover:bg-white/5 hover:text-primary-foreground transition-all">
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-foreground/50 hover:bg-white/5 hover:text-primary-foreground transition-all">
                        <LogOut className="w-4 h-4" /> Log Out
                    </Link>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-foreground border-t border-white/10 px-2 py-2 flex items-center justify-around">
                {navItems.slice(0, 5).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${activeTab === item.id ? "bg-primary/20 text-primary" : "text-primary-foreground/40"
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[9px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Main */}
            <main className="lg:ml-64 min-h-screen pb-24 lg:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-display font-bold text-foreground">
                            {navItems.find((n) => n.id === activeTab)?.label ?? "Dashboard"}
                        </h1>
                        <p className="text-xs text-muted-foreground">Sunday, March 8, 2026 · Alex Smith</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:shadow-sm transition-shadow">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white text-sm font-bold">AS</div>
                    </div>
                </div>

                <div className="p-6">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
