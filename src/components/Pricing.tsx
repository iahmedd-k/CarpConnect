import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
    {
        name: "Rider Free",
        price: "$0",
        period: "forever",
        desc: "Perfect for occasional commuters who want to get started.",
        features: [
            "5 rides per month",
            "Basic route matching",
            "In-app chat",
            "Standard support",
            "CO₂ tracking",
        ],
        cta: "Get Started",
        href: "/signup",
        accent: false,
    },
    {
        name: "Rider Pro",
        price: "$9",
        period: "per month",
        desc: "Built for daily commuters who want the best experience.",
        features: [
            "Unlimited rides",
            "AI priority matching",
            "Recurring route setup",
            "Priority support",
            "Detailed emissions reports",
            "Fare split automation",
            "Advanced trust signals",
        ],
        cta: "Start Free Trial",
        href: "/signup",
        accent: true,
        badge: "Most Popular",
    },
    {
        name: "Driver Plus",
        price: "$14",
        period: "per month",
        desc: "Maximize earnings and ride quality for active drivers.",
        features: [
            "Unlimited ride offers",
            "Multi-stop route planner",
            "Earnings dashboard",
            "Fuel & expense tracking",
            "Verified driver badge",
            "Priority listing in matches",
        ],
        cta: "Become a Driver",
        href: "/signup",
        accent: false,
    },
];

const Pricing = () => {
    return (
        <section id="pricing" className="py-24 md:py-32 bg-muted/30">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wider uppercase mb-4">
                        Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                        Simple, transparent <span className="text-gradient-primary">pricing</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        No hidden fees. Cancel anytime. Start free and upgrade when you need more.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 ${plan.accent
                                    ? "bg-gradient-primary border-primary/30 shadow-glow"
                                    : "bg-card border-border/50 hover:shadow-card"
                                }`}
                        >
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber text-white text-xs font-bold shadow-md">
                                    {plan.badge}
                                </div>
                            )}
                            <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${plan.accent ? "text-white/60" : "text-muted-foreground"}`}>
                                {plan.name}
                            </div>
                            <div className="flex items-end gap-1 mb-1">
                                <span className={`text-5xl font-display font-bold ${plan.accent ? "text-white" : "text-foreground"}`}>{plan.price}</span>
                                <span className={`text-sm mb-2 ${plan.accent ? "text-white/60" : "text-muted-foreground"}`}>/{plan.period}</span>
                            </div>
                            <p className={`text-sm mb-8 leading-relaxed ${plan.accent ? "text-white/70" : "text-muted-foreground"}`}>{plan.desc}</p>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f) => (
                                    <li key={f} className={`flex items-center gap-3 text-sm ${plan.accent ? "text-white/80" : "text-foreground"}`}>
                                        <CheckCircle className={`w-4 h-4 shrink-0 ${plan.accent ? "text-white" : "text-primary"}`} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Link to={plan.href}>
                                <Button
                                    className={`w-full py-6 rounded-xl font-semibold transition-all ${plan.accent
                                            ? "bg-white text-primary hover:bg-white/90"
                                            : "bg-gradient-primary text-white shadow-glow hover:opacity-90"
                                        }`}
                                >
                                    {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-sm text-muted-foreground mt-10"
                >
                    All plans include a 14-day free trial. No credit card required.
                </motion.p>
            </div>
        </section>
    );
};

export default Pricing;
