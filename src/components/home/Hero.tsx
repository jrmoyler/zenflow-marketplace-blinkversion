import { motion } from 'framer-motion';
import { Sparkles, Play, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-20">
      {/* Background Animation - WebGL-like using CSS and Framer Motion */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-primary/30 mb-8 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Next-Gen AI Marketplace</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-[1.1]">
            Automate Your <br />
            <span className="text-gradient glow-text">Digital Universe</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
            Discover, deploy, and scale with over 1,000+ premade AI Agents, Workflows, and Automations. 
            The future of efficiency starts here.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-lg shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 group transition-all"
            >
              Start Exploring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl glass border border-border/50 text-foreground font-semibold text-lg flex items-center gap-2 hover:bg-white/5 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              Watch Demo
            </motion.button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Agents", value: "2,500+" },
              { label: "Daily Deployments", value: "12k+" },
              { label: "Average Efficiency", value: "300%" },
              { label: "Trusted Partners", value: "500+" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 font-display">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 z-[-1] opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
    </section>
  );
}