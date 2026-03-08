import { motion } from "framer-motion";
import { Users, Star, MapPin, MessageSquare, UserCheck, TrendingUp, Shield, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const drivers = [
    { name: "Marcus Johnson", avatar: "MJ", rating: 4.9, rides: 142, location: "Sunset District", tags: ["Quiet", "Punctual", "Clean car"], online: true },
    { name: "Priya Sharma", avatar: "PS", rating: 4.8, rides: 98, location: "Mission District", tags: ["Music ok", "Friendly"], online: true },
    { name: "Elena Rodriguez", avatar: "ER", rating: 5.0, rides: 311, location: "Downtown SF", tags: ["AC always on", "Top Driver"], online: false },
    { name: "James Kim", avatar: "JK", rating: 4.7, rides: 74, location: "Richmond District", tags: ["Electric car", "Quiet"], online: false },
    { name: "Sophie Laurent", avatar: "SL", rating: 4.9, rides: 203, location: "Noe Valley", tags: ["Pet friendly", "Podcasts"], online: true },
    { name: "David Chen", avatar: "DC", rating: 4.6, rides: 58, location: "Haight-Ashbury", tags: ["Budget friendly"], online: false },
];

const leaderboardData = [
    { name: "Elena R.", rides: 311, co2: 420 },
    { name: "Sophie L.", rides: 203, co2: 274 },
    { name: "Marcus J.", rides: 142, co2: 191 },
    { name: "Priya S.", rides: 98, co2: 132 },
    { name: "James K.", rides: 74, co2: 100 },
    { name: "David C.", rides: 58, co2: 78 },
];

const radarData = [
    { subject: "Punctuality", A: 88 },
    { subject: "Cleanliness", A: 76 },
    { subject: "Friendliness", A: 92 },
    { subject: "Safety", A: 95 },
    { subject: "Value", A: 85 },
    { subject: "Communication", A: 80 },
];

const Community = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Community</h2>
                <p className="text-sm text-muted-foreground mt-1">Your network of verified drivers and co-riders</p>
            </div>

            {/* Community stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Users, label: "Your Network", value: "23", color: "text-primary" },
                    { icon: UserCheck, label: "Trusted Drivers", value: "8", color: "text-emerald" },
                    { icon: Star, label: "Avg Rating Given", value: "4.8★", color: "text-amber" },
                    { icon: Shield, label: "Trust Score", value: "94%", color: "text-primary" },
                ].map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card rounded-2xl p-5 border border-border/50"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                            <s.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Community Leaderboard</h3>
                    <p className="text-xs text-muted-foreground mb-5">Rides completed by top members</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={leaderboardData} layout="vertical" barSize={14}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,90%)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} width={60} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="rides" radius={[0, 6, 6, 0]} fill="hsl(168,80%,36%)" name="Rides" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Your Rider Review Profile</h3>
                    <p className="text-xs text-muted-foreground mb-4">How drivers rate your attributes</p>
                    <ResponsiveContainer width="100%" height={210}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(150,15%,90%)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(200,10%,45%)" }} />
                            <Radar name="You" dataKey="A" stroke="hsl(168,80%,36%)" fill="hsl(168,80%,36%)" fillOpacity={0.25} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Drivers in your network */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-foreground">Drivers You've Ridden With</h3>
                    <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">Browse All</button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drivers.map((driver, i) => (
                        <motion.div
                            key={driver.name}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 + i * 0.07 }}
                            className="bg-card rounded-2xl p-5 border border-border/50 hover:shadow-card hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
                                        {driver.avatar}
                                    </div>
                                    {driver.online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald rounded-full border-2 border-card" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-foreground text-sm truncate">{driver.name}</div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <MapPin className="w-3 h-3" /> {driver.location}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-amber text-amber" />
                                    <span className="text-sm font-bold text-foreground">{driver.rating}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <TrendingUp className="w-3 h-3" /> {driver.rides} rides
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {driver.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-medium">{tag}</span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                                    <MessageSquare className="w-3.5 h-3.5" /> Message
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-primary text-white text-xs font-medium hover:opacity-90 transition-opacity shadow-glow">
                                    <Award className="w-3.5 h-3.5" /> Book Again
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Community;
