import { motion } from "framer-motion";
import { Wallet, ArrowUp, ArrowDown, CreditCard, TrendingUp, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";

const transactions = [
    { id: 1, type: "ride", label: "Home → Downtown", date: "Mar 8, 2026", amount: -4.50, status: "completed", from: "Marcus J." },
    { id: 2, type: "ride", label: "Office → Gym", date: "Mar 7, 2026", amount: -3.20, status: "completed", from: "Priya S." },
    { id: 3, type: "refund", label: "Cancelled ride refund", date: "Mar 5, 2026", amount: +5.10, status: "refunded", from: "CarpConnect" },
    { id: 4, type: "topup", label: "Wallet top-up", date: "Mar 4, 2026", amount: +50.00, status: "topup", from: "Visa •••• 4242" },
    { id: 5, type: "ride", label: "Caltrain → Tech Campus", date: "Mar 3, 2026", amount: -6.80, status: "completed", from: "Sophie L." },
    { id: 6, type: "ride", label: "Home → University", date: "Mar 2, 2026", amount: -5.10, status: "completed", from: "David C." },
    { id: 7, type: "topup", label: "Wallet top-up", date: "Feb 28, 2026", amount: +100.00, status: "topup", from: "Visa •••• 4242" },
    { id: 8, type: "ride", label: "Downtown → Airport T1", date: "Feb 26, 2026", amount: -11.20, status: "completed", from: "James K." },
];

const savingsData = [
    { month: "Oct", saved: 32, spent: 18 },
    { month: "Nov", saved: 28, spent: 22 },
    { month: "Dec", saved: 40, spent: 16 },
    { month: "Jan", saved: 45, spent: 20 },
    { month: "Feb", saved: 55, spent: 24 },
    { month: "Mar", saved: 62, spent: 28 },
];

const spendByWeek = [
    { week: "W1", amount: 12.5 },
    { week: "W2", amount: 8.3 },
    { week: "W3", amount: 15.2 },
    { week: "W4", amount: 9.8 },
];

const typeColors: Record<string, string> = {
    ride: "bg-primary/10 text-primary",
    refund: "bg-emerald-light text-emerald",
    topup: "bg-amber-light text-amber",
};

const WalletPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">Wallet</h2>
                    <p className="text-sm text-muted-foreground mt-1">Manage your balance, spending, and savings</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
                    <Button className="bg-gradient-primary text-white shadow-glow hover:opacity-90 gap-2"><Plus className="w-4 h-4" /> Add Funds</Button>
                </div>
            </div>

            {/* Balance card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-primary rounded-3xl p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-white/60 text-sm mb-1">Available Balance</p>
                            <div className="text-5xl font-display font-bold text-white">$84.10</div>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                            <Wallet className="w-7 h-7 text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total Spent", value: "$156.30", icon: ArrowDown },
                            { label: "Total Saved", value: "$1,240", icon: TrendingUp },
                            { label: "This Month", value: "$28.70", icon: CreditCard },
                        ].map((item) => (
                            <div key={item.label} className="bg-white/10 rounded-2xl p-4">
                                <item.icon className="w-4 h-4 text-white/60 mb-2" />
                                <div className="text-lg font-display font-bold text-white">{item.value}</div>
                                <div className="text-xs text-white/50">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Savings vs Spend</h3>
                    <p className="text-xs text-muted-foreground mb-5">Monthly comparison (USD)</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={savingsData}>
                            <defs>
                                <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(168,80%,36%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(168,80%,36%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="spentGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(38,92%,55%)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(38,92%,55%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,90%)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} />
                            <Area type="monotone" dataKey="saved" stroke="hsl(168,80%,36%)" strokeWidth={2} fill="url(#savedGrad)" name="Saved" />
                            <Area type="monotone" dataKey="spent" stroke="hsl(38,92%,55%)" strokeWidth={2} fill="url(#spentGrad)" name="Spent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                >
                    <h3 className="font-display font-bold text-foreground mb-1">Weekly Spend</h3>
                    <p className="text-xs text-muted-foreground mb-5">This month by week (USD)</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={spendByWeek} barSize={36}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(150,15%,90%)" />
                            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(200,10%,45%)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid hsl(150,15%,90%)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`$${v}`, "Spent"]} />
                            <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="hsl(38,92%,55%)" name="Spent" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Transaction History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-border">
                    <h3 className="font-display font-bold text-foreground">Transaction History</h3>
                </div>
                <div className="divide-y divide-border">
                    {transactions.map((tx, i) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[tx.type]}`}>
                                {tx.type === "topup" ? <ArrowUp className="w-4 h-4" /> : tx.type === "refund" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-foreground">{tx.label}</div>
                                <div className="text-xs text-muted-foreground">{tx.date} · {tx.from}</div>
                            </div>
                            <div className={`text-base font-display font-bold ${tx.amount > 0 ? "text-emerald" : "text-foreground"}`}>
                                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default WalletPage;
