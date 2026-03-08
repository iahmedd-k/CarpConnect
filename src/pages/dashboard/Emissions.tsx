import { motion } from "framer-motion";
import { Leaf, TrendingDown, TreePine, Droplets, Award, Zap, ArrowUp } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

const monthlyData = [
    { month: "Sep", co2: 48, trees: 4, fuel: 18 },
    { month: "Oct", co2: 62, trees: 5, fuel: 22 },
    { month: "Nov", co2: 55, trees: 5, fuel: 20 },
    { month: "Dec", co2: 71, trees: 6, fuel: 26 },
    { month: "Jan", co2: 84, trees: 7, fuel: 31 },
    { month: "Feb", co2: 98, trees: 9, fuel: 36 },
    { month: "Mar", co2: 127, trees: 11, fuel: 47 },
];

const breakdownData = [
    { name: "Co-passengers", value: 60, color: "hsl(168, 80%, 36%)" },
    { name: "Route Optimization", value: 25, color: "hsl(180, 70%, 30%)" },
    { name: "Traffic Avoidance", value: 15, color: "hsl(38, 92%, 55%)" },
];

const weekComparison = [
    { week: "Wk1", solo: 14, shared: 4 },
    { week: "Wk2", solo: 16, shared: 5 },
    { week: "Wk3", solo: 12, shared: 3.5 },
    { week: "Wk4", solo: 18, shared: 5.5 },
];

const Emissions = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Emissions Tracker</h2>
                <p className="text-sm text-muted-foreground mt-1">Your personal environmental impact dashboard</p>
            </div>

            {/* Top KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: TrendingDown, label: "CO₂ Saved (Total)", value: "545 kg", change: "+127 this month", color: "text-emerald", bg: "bg-emerald-light" },
                    { icon: TreePine, label: "Trees Equivalent", value: "24", change: "+11 this month", color: "text-emerald", bg: "bg-emerald-light" },
                    { icon: Droplets, label: "Fuel Saved (Total)", value: "201 L", change: "+47L this month", color: "text-primary", bg: "bg-primary/10" },
                    { icon: Award, label: "Eco Score", value: "87 / 100", change: "Top 12% of riders", color: "text-amber", bg: "bg-amber-light" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card rounded-2xl p-5 border border-border/50"
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div className={`text-2xl font-display font-bold ${stat.color} mb-0.5`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                        <div className="flex items-center gap-1 text-xs text-emerald font-medium">
                            <ArrowUp className="w-3 h-3" />{stat.change}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Monthly CO₂ Savings</h3>
                    <p className="text-xs text-muted-foreground mb-5">Kilograms of CO₂ reduced each month</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 90%)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200, 10%, 45%)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(200, 10%, 45%)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v} kg`, "CO₂ Saved"]} />
                            <Area type="monotone" dataKey="co2" stroke="hsl(168, 80%, 36%)" strokeWidth={2.5} fill="url(#co2Grad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Savings Breakdown</h3>
                    <p className="text-xs text-muted-foreground mb-4">How you're reducing emissions</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                                {breakdownData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                        {breakdownData.map((d) => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                    <span className="text-muted-foreground">{d.name}</span>
                                </div>
                                <span className="font-medium text-foreground">{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Solo vs Shared Emissions (kg CO₂)</h3>
                    <p className="text-xs text-muted-foreground mb-5">Weekly comparison — what you would have emitted vs what you actually did</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weekComparison} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 90%)" />
                            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} />
                            <Legend iconType="circle" iconSize={8} />
                            <Bar dataKey="solo" name="Solo driving" radius={[6, 6, 0, 0]} fill="hsl(0,80%,75%)" barSize={18} />
                            <Bar dataKey="shared" name="With CarpConnect" radius={[6, 6, 0, 0]} fill="hsl(168,80%,36%)" barSize={18} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Fuel & Trees Trend</h3>
                    <p className="text-xs text-muted-foreground mb-5">Cumulative fuel saved (L) and tree equivalents</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,90%)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} />
                            <Legend iconType="circle" iconSize={8} />
                            <Line type="monotone" dataKey="fuel" stroke="hsl(38,92%,55%)" strokeWidth={2.5} dot={false} name="Fuel (L)" />
                            <Line type="monotone" dataKey="trees" stroke="hsl(168,80%,36%)" strokeWidth={2.5} dot={false} name="Trees" />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Milestone badges */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-card rounded-2xl p-6 border border-border/50"
            >
                <h3 className="font-display font-bold text-foreground mb-4">Eco Milestones</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { emoji: "🌱", label: "First Green Ride", desc: "1 kg CO₂ saved", earned: true },
                        { emoji: "🌿", label: "Growing Greener", desc: "50 kg CO₂ saved", earned: true },
                        { emoji: "🌳", label: "Eco Warrior", desc: "200 kg CO₂ saved", earned: true },
                        { emoji: "🏆", label: "Climate Champion", desc: "1,000 kg CO₂ saved", earned: false },
                    ].map((m, i) => (
                        <div key={i} className={`p-4 rounded-2xl text-center border transition-all ${m.earned ? "bg-emerald-light/50 border-emerald/20" : "bg-muted/30 border-border opacity-50"}`}>
                            <div className="text-3xl mb-2">{m.emoji}</div>
                            <div className="text-sm font-bold text-foreground mb-1">{m.label}</div>
                            <div className="text-xs text-muted-foreground">{m.desc}</div>
                            {m.earned && <div className="mt-2 text-xs text-emerald font-medium flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Earned!</div>}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Emissions;
