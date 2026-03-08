import { useState } from "react";
import { motion } from "framer-motion";
import { Car, Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<"rider" | "driver" | "">("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigate("/dashboard");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                            <Car className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-display text-2xl font-bold text-primary-foreground">
                            Carp<span className="text-gradient-primary">Connect</span>
                        </span>
                    </Link>
                    <p className="text-primary-foreground/50 text-sm mt-3">Join thousands of smart commuters</p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-6">
                    {[1, 2].map((s) => (
                        <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-500 ${s <= step ? "bg-gradient-primary" : "bg-white/10"}`} />
                    ))}
                </div>
                <p className="text-xs text-primary-foreground/40 text-center mb-6">Step {step} of 2</p>

                <div className="glass-dark rounded-3xl p-8 border border-white/10 shadow-xl">
                    <h1 className="text-2xl font-display font-bold text-primary-foreground mb-2">
                        {step === 1 ? "Create Account" : "Choose Your Role"}
                    </h1>
                    <p className="text-primary-foreground/50 text-sm mb-8">
                        {step === 1 ? "Fill in your details to get started" : "How will you mainly use CarpConnect?"}
                    </p>

                    <form onSubmit={handleSignup} className="space-y-5">
                        {step === 1 ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-2">First Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/30" />
                                            <input type="text" defaultValue="Alex" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="Alex" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-2">Last Name</label>
                                        <input type="text" defaultValue="Smith" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="Smith" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/30" />
                                        <input type="email" defaultValue="alex@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="you@email.com" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-2">Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/30" />
                                        <input type="tel" defaultValue="+1 555-0100" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/30" />
                                        <input type={showPassword ? "text" : "password"} defaultValue="password123" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all" placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors">
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: "rider", label: "I'm a Rider", desc: "Find rides to share on my daily commute", emoji: "🚀" },
                                    { id: "driver", label: "I'm a Driver", desc: "Offer seats in my car and share the cost", emoji: "🚗" },
                                ].map((r) => (
                                    <motion.button
                                        key={r.id}
                                        type="button"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setRole(r.id as "rider" | "driver")}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${role === r.id
                                                ? "border-primary bg-primary/10"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                            }`}
                                    >
                                        <div className="text-2xl mb-3">{r.emoji}</div>
                                        <div className="text-sm font-bold text-primary-foreground mb-1">{r.label}</div>
                                        <div className="text-xs text-primary-foreground/50 leading-relaxed">{r.desc}</div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || (step === 2 && !role)}
                            className="w-full bg-gradient-primary text-white py-6 rounded-xl text-sm font-semibold shadow-glow hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    {step === 1 ? "Continue" : "Get Started"} <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-primary-foreground/40">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-primary-foreground/20 mt-6">
                    By signing up, you agree to our Terms & Privacy Policy
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
