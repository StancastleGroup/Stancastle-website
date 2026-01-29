import React from 'react';
import { motion } from 'framer-motion';
import { Section } from './ui/Section';
import { Quote, Star } from 'lucide-react';
import { Button } from './ui/Button';

const testimonials = [
  {
    tag: "0 to Operational",
    quote: "I wanted to launch a care home but had no idea where to start. The 90-minute session gave us a clear roadmap—licensing, staffing, funding. We opened in 9 months.",
    name: "Sarah J.",
    title: "Supported Living Operator",
    avatar: "S"
  },
  {
    tag: "£10k/mo Revenue",
    quote: "In 90 minutes, Stancastle mapped out pricing strategy and market positioning. Six months later, we're clearing £10k monthly profit.",
    name: "David M.",
    title: "Private Catering Operator",
    avatar: "D"
  },
  {
    tag: "Problem Solved",
    quote: "Our restaurant was doing decent revenue but margins were terrible. They identified the issue within a week. Margins jumped 40% in 6 weeks.",
    name: "Marcus T.",
    title: "Restaurant Owner",
    avatar: "M"
  },
  {
    tag: "Local to National",
    quote: "The diagnostic session showed me I was thinking too small. Stancastle helped us restructure for UK-wide B2B SaaS infrastructure.",
    name: "Priya K.",
    title: "SaaS Founder",
    avatar: "P"
  },
  {
    tag: "First £50k Deal",
    quote: "I wanted to launch an import operation. They connected us with verified suppliers and walked us through customs. We just closed a £50k deal.",
    name: "James L.",
    title: "Import/Export Operator",
    avatar: "J"
  },
  {
    tag: "Clarity in 90 Min",
    quote: "I'd been stuck for 8 months deciding whether to scale or pivot. They built financial models for both. I made the decision the next day.",
    name: "Olivia R.",
    title: "Marketing Agency Owner",
    avatar: "O"
  },
  {
    tag: "90% Waste Reduction",
    quote: "We were stuck at £40k revenue. They identified 14 redundant steps in fulfillment. Three months later we're at £73k per month.",
    name: "Tom W.",
    title: "E-commerce Business Owner",
    avatar: "T"
  },
  {
    tag: "Validated Early",
    quote: "I was about to spend 6 months building an app. Stancastle designed a 2-week validation framework. We pivoted before writing a line of code.",
    name: "Aisha M.",
    title: "Fitness Tech Founder",
    avatar: "A"
  },
  {
    tag: "Exit Ready",
    quote: "I built a successful firm but had no exit strategy. They helped us structure for acquisition—documented processes and reduced founder dependency.",
    name: "Richard P.",
    title: "Professional Services Founder",
    avatar: "R"
  }
];

const TestimonialCard: React.FC<{ t: typeof testimonials[0] }> = ({ t }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="w-[380px] md:w-[450px] shrink-0 bg-[#11111a]/80 backdrop-blur-xl p-8 md:p-10 rounded-[32px] border border-white/5 hover:border-brand-accent/40 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between"
  >
    {/* Inner Glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-8">
        <div className="p-3 bg-brand-accent/10 rounded-2xl">
          <Quote className="w-6 h-6 text-brand-accent" />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-3 h-3 fill-brand-accent text-brand-accent" />
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent/80">
            {t.tag}
          </span>
        </div>
      </div>

      <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-10 font-medium">
        "{t.quote}"
      </p>
    </div>

    <div className="mt-auto flex items-center gap-4 border-t border-white/5 pt-6 relative z-10">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-accent to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {t.avatar}
      </div>
      <div>
        <h4 className="font-bold text-white text-base leading-none mb-1">{t.name}</h4>
        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{t.title}</p>
      </div>
    </div>
  </motion.div>
);

const MarqueeRow: React.FC<{ 
  items: typeof testimonials; 
  direction: 'left' | 'right'; 
  duration: number 
}> = ({ items, direction, duration }) => {
  const xValues = direction === 'left' ? [0, -100 + '%'] : [-100 + '%', 0];
  
  return (
    <div className="flex overflow-hidden group py-4">
      <motion.div 
        className="flex gap-6 md:gap-10 pr-6 md:pr-10"
        animate={{ x: xValues }} 
        transition={{ 
          duration: duration, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        style={{ willChange: 'transform' }}
      >
        {/* Triple clone for seamless infinite loop regardless of screen size */}
        {[...items, ...items, ...items].map((t, idx) => (
          <TestimonialCard key={idx} t={t} />
        ))}
      </motion.div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  // Splitting testimonials for the rows
  const row1 = testimonials.slice(0, 3);
  const row2 = testimonials.slice(3, 6);
  const row3 = testimonials.slice(6, 9);

  return (
    <Section id="results" className="bg-[#050508] py-32 md:py-48 relative overflow-hidden">
      {/* Background Atmosphere - Layers of deep color to prevent flat black/white gaps */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] bg-fuchsia-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[15%] w-[40vw] h-[40vw] bg-purple-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-6 mb-20 text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-brand-accent font-bold tracking-[0.3em] uppercase text-xs mb-4 block">Proof of Work</span>
          <h2 className="font-serif text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
            Our results are <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">indisputable.</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            While others talk about growth frameworks, we deliver clinical structural impact. 
            Hear from founders who chose <span className="text-white font-semibold italic">clarity</span> over theater.
          </p>
        </motion.div>
      </div>

      {/* Marquee Container with Portal Masking */}
      <div className="relative z-10 space-y-2 md:space-y-6">
        {/* Edge Shadows / Masking for the "Portal" effect */}
        <div className="absolute inset-y-0 left-0 w-20 md:w-64 bg-gradient-to-r from-[#050508] to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 md:w-64 bg-gradient-to-l from-[#050508] to-transparent z-20 pointer-events-none" />

        <MarqueeRow items={row1} direction="left" duration={40} />
        <MarqueeRow items={row2} direction="right" duration={50} />
        <MarqueeRow items={row3} direction="left" duration={45} />
      </div>

      <div className="mt-24 md:mt-32 text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            size="lg" 
            className="!px-16 !py-8 text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-[0_0_50px_rgba(217,70,239,0.3)] hover:shadow-[0_0_70px_rgba(217,70,239,0.5)] transition-all duration-500"
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Book Your Session
          </Button>
        </motion.div>
      </div>
    </Section>
  );
};