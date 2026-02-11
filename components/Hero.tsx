import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { Trophy, ChevronRight, Sparkles } from 'lucide-react';

const companies = [
  { name: "Travelodge", domain: "travelodge.co.uk" },
  { name: "Amazon", domain: "amazon.co.uk" },
  { name: "1st Enable", domain: "1stenable.co.uk" },
  { name: "Zeno Ltd", domain: "zenoltd.co.uk" },
  { name: "Fourth", domain: "fourth.com" },
  { name: "Marks & Spencer", domain: "marksandspencer.com" },
  { name: "Drivora", domain: "drivora.app" },
  { name: "Oneshot Trials", domain: "oneshot.co.uk" }
];

const Logo: React.FC<{ company: typeof companies[0] }> = ({ company }) => (
  <div className="flex items-center justify-center h-8 md:h-12 w-auto min-w-[120px] px-6 grayscale brightness-[3] opacity-20 hover:opacity-100 transition-all duration-700 transform hover:scale-105">
    <img 
      src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=128`} 
      alt={company.name} 
      className="h-full w-auto object-contain max-w-[140px]"
    />
  </div>
);

const CrossingX: React.FC<{ delay: number }> = ({ delay }) => (
  <svg 
    className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" 
    viewBox="0 0 100 100" 
    preserveAspectRatio="none"
  >
    <motion.line 
      x1="0" y1="20" x2="100" y2="80" 
      stroke="#ef4444" 
      strokeWidth="3" 
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
    />
    <motion.line 
      x1="100" y1="20" x2="0" y2="80" 
      stroke="#ef4444" 
      strokeWidth="3" 
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.8 }}
      transition={{ duration: 0.5, delay: delay + 0.2, ease: "easeOut" }}
    />
  </svg>
);

const ShiningDot: React.FC<{ index: number }> = ({ index }) => {
  const size = useMemo(() => Math.random() * 2 + 1, []);
  const initialX = useMemo(() => Math.random() * 100, []);
  const initialY = useMemo(() => Math.random() * 100, []);
  const duration = useMemo(() => Math.random() * 15 + 15, []);

  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}%`,
        filter: 'blur(1px)',
        opacity: 0.1,
      }}
      animate={{
        opacity: [0.1, 0.4, 0.1],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

interface HeroProps {
  onOpenBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking }) => {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const dots = useMemo(() => Array.from({ length: 40 }), []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-brand-dark pt-32 pb-16">
      {/* Cinematic Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,rgba(217,70,239,0.06)_0%,rgba(5,5,8,0)_70%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[75vw] h-[75vw] bg-brand-glow/5 rounded-full blur-[140px]" />
        {dots.map((_, i) => <ShiningDot key={i} index={i} />)}
      </div>

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center max-w-[1400px]">
        
        {/* Illuminated Award Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8 relative group"
        >
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 rounded-full blur-lg opacity-25 group-hover:opacity-60 animate-pulse duration-[3000ms]"></div>
          <div className="relative inline-flex items-center gap-3 px-8 py-3 rounded-full border border-amber-500/40 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)]">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] md:text-xs text-amber-500 font-black uppercase tracking-[0.35em] whitespace-nowrap">
              Awarded best business plan of the year
            </span>
            <Sparkles className="w-3 h-3 text-amber-200/40" />
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="w-full">
          {/* High-Impact Headline */}
          <motion.h1 variants={item} className="font-serif text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.9] tracking-tighter text-white mb-6">
            The decisions you're <br />
            avoiding <br />
            <span className="text-brand-accent italic drop-shadow-[0_0_30px_rgba(217,70,239,0.4)]">are costing you</span> <br />
            <span className="text-brand-accent">more than you think.</span>
          </motion.h1>
          
          {/* Strike-through Section - Tighter and Cleaner */}
          <motion.div variants={item} className="flex flex-wrap justify-center gap-x-6 gap-y-4 mb-6">
            {["No frameworks.", "No motivation.", "No theory."].map((text, idx) => (
              <div key={text} className="relative inline-block px-1">
                <span className="text-lg md:text-2xl font-mono text-brand-muted tracking-[0.15em] uppercase italic">
                  {text}
                </span>
                <CrossingX delay={1.4 + (idx * 0.3)} />
              </div>
            ))}
          </motion.div>

          {/* Intake Bridge Badge */}
          <motion.div variants={item} className="mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-brand-accent/40 bg-brand-accent/10 backdrop-blur-2xl">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-brand-accent rounded-full" />
                <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-accent rounded-full animate-ping" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
                Diagnostic Intake: <span className="text-brand-accent">2 Slots Left</span>
              </span>
            </div>
          </motion.div>

          {/* Premium Copy with Highlights */}
          <motion.p variants={item} className="text-xl md:text-3xl text-brand-muted-light leading-relaxed font-light mb-12 max-w-4xl mx-auto">
            Just <motion.span className="text-white font-bold relative inline-block">
              clear thinking
              <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-brand-accent/60 w-full block origin-left" style={{ transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.8, duration: 0.6 }} />
            </motion.span> applied to your <motion.span className="text-white font-bold relative inline-block">
              actual business problems.
              <motion.span className="absolute -bottom-1 left-0 h-[2px] bg-brand-accent/60 w-full block origin-left" style={{ transformOrigin: 'left' }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 2.1, duration: 0.6 }} />
            </motion.span>
          </motion.p>
          
          {/* Refined & Smaller CTA Button */}
          <motion.div variants={item} className="flex justify-center pb-12">
            <button 
              onClick={onOpenBooking}
              className="group relative px-10 py-5 md:px-14 md:py-7 rounded-[1.75rem] overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-[0_20px_50px_rgba(217,70,239,0.15)] hover:shadow-[0_0_80px_rgba(217,70,239,0.5)] border border-white/5"
            >
              <div className="absolute inset-0 bg-brand-accent" />
              <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-brand-glow to-purple-600 animate-gradient" style={{ backgroundSize: '300% 100%' }} />
              <div className="absolute top-0 -left-[100%] w-[150%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[35deg] transition-all duration-1000 group-hover:left-[100%]" />
              
              <div className="relative z-10 flex items-center gap-6">
                <span className="text-xl md:text-3xl font-black text-white uppercase tracking-[0.25em] drop-shadow-xl">
                  Take a step today!
                </span>
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl backdrop-blur-md border border-white/30 group-hover:bg-white/40 group-hover:translate-x-3 transition-all duration-500">
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white stroke-[4px]" />
                </div>
              </div>
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Trust Ribbon */}
      <div className="w-full relative border-t border-white/5 bg-black/40 backdrop-blur-3xl py-12 overflow-hidden mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-8">
            <div className="relative flex items-center h-10 w-full max-w-7xl mx-auto overflow-hidden">
               <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-transparent z-10" />
               <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-brand-dark via-brand-dark/95 to-transparent z-10" />
               
               <motion.div 
                className="flex items-center gap-24 md:gap-44 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               >
                 {[...companies, ...companies].map((c, i) => (
                   <Logo key={`${c.name}-${i}`} company={c} />
                 ))}
               </motion.div>
            </div>
            
            <p className="text-[10px] text-brand-muted uppercase tracking-[0.45em] text-center font-black">
              Founder professional exposure includes leading UK organisations. No commercial partnership implied.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};