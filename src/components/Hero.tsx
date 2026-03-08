import { motion } from "framer-motion";
import { MapPin, ArrowRight, Shield, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-carpool.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="People carpooling in a modern city" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-6"
          >
            <Leaf className="w-4 h-4 text-emerald" />
            <span className="text-sm font-medium text-primary-foreground/90">Smarter rides, greener planet</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight mb-6"
          >
            <span className="text-primary-foreground">Share the ride.</span>
            <br />
            <span className="text-primary-foreground/60">Share the future.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mb-10 leading-relaxed"
          >
            Connect with drivers and riders on your route. Save money, reduce emissions, 
            and build a commuting community — all with smart matching technology.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl glass-dark max-w-xl"
          >
            <div className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl bg-foreground/10">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Where are you going?"
                className="bg-transparent border-none outline-none text-primary-foreground placeholder:text-primary-foreground/40 w-full text-sm"
              />
            </div>
            <Button className="bg-gradient-primary text-primary-foreground px-8 py-6 rounded-xl text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity whitespace-nowrap">
              Find Rides <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap items-center gap-6 mt-10"
          >
            {[
              { icon: Shield, text: "Verified Riders" },
              { icon: Leaf, text: "Carbon Tracked" },
              { icon: MapPin, text: "Smart Matching" },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2">
                <badge.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary-foreground/60">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Floating Stats */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="hidden lg:flex absolute right-12 bottom-24 flex-col gap-4"
      >
        {[
          { value: "50K+", label: "Active Riders" },
          { value: "2.1M", label: "kg CO₂ Saved" },
          { value: "4.9★", label: "Avg Rating" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 + i * 0.15 }}
            className="glass-dark rounded-2xl px-6 py-4 min-w-[160px]"
          >
            <div className="text-2xl font-display font-bold text-primary-foreground">{stat.value}</div>
            <div className="text-xs text-primary-foreground/50">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Hero;
