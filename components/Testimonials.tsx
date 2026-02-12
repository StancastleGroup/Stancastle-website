import React from 'react';
import { motion } from 'framer-motion';
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

const TestimonialCard: React.FC<{ t: typeof testimonials[0] }> = ({ t }) => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  return (
    <motion.div 
      whileHover={isMobile ? {} : { y: -4, scale: 1.02 }}
      className="w-[320px] sm:w-[360px] md:w-[380px] shrink-0 bg-[#11111a]/90 backdrop-blur-xl p-6 md:p-8 rounded-2xl md:rounded-[28px] border border-white/10 hover:border-brand-accent/40 transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[260px] md:min-h-[280px]"
    >
    {/* Inner Glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10 flex-1 flex flex-col">
      <div className="flex justify-between items-start gap-3 mb-4 md:mb-6">
        <div className="p-2.5 md:p-3 bg-brand-accent/10 rounded-xl md:rounded-2xl shrink-0">
          <Quote className="w-5 h-5 md:w-6 md:h-6 text-brand-accent" />
        </div>
        <div className="flex flex-col items-end gap-0.5 min-w-0">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-2.5 h-2.5 md:w-3 md:h-3 fill-brand-accent text-brand-accent shrink-0" />
            ))}
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] text-brand-accent/90 truncate max-w-full">
            {t.tag}
          </span>
        </div>
      </div>

      <p className="text-brand-muted-light text-sm md:text-base leading-relaxed flex-1 font-medium min-h-[4.5rem] md:min-h-[5rem]">
        "{t.quote}"
      </p>
    </div>

    <div className="mt-4 md:mt-6 flex items-center gap-3 md:gap-4 border-t border-white/10 pt-4 md:pt-6 relative z-10 shrink-0">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-accent to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
        {t.avatar}
      </div>
      <div>
        <h4 className="font-bold text-white text-base leading-none mb-1">{t.name}</h4>
        <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest">{t.title}</p>
      </div>
    </div>
  </motion.div>
  );
};

const MarqueeRow: React.FC<{ 
  items: typeof testimonials; 
  direction: 'left' | 'right'; 
  duration: number 
}> = ({ items, direction, duration }) => {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // One-third of content width = seamless loop (we have 3 identical segments)
  const xFrom = direction === 'left' ? '0%' : '-33.333%';
  const xTo = direction === 'left' ? '-33.333%' : '0%';
  
  // Reduce animation complexity on mobile
  const animationDuration = isMobile ? duration * 1.5 : duration;
  
  return (
    <div className="flex overflow-hidden py-4 w-full" aria-hidden="true">
      <motion.div 
        className="flex gap-6 md:gap-10 shrink-0"
        animate={{ x: [xFrom, xTo] }} 
        transition={{ 
          duration: animationDuration, 
          repeat: Infinity, 
          ease: 'linear'
        }}
        style={{ 
          willChange: 'transform',
          // Use CSS transform for better performance
          transform: 'translateZ(0)'
        }}
      >
        {[...items, ...items, ...items].map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  );
};

export const Testimonials: React.FC = () => {
  const row1 = testimonials.slice(0, 3);
  const row2 = testimonials.slice(3, 6);
  const row3 = testimonials.slice(6, 9);

  return (
    <section id="results" className="bg-[#050508] py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] left-[15%] w-[40vw] h-[40vw] bg-fuchsia-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[15%] w-[40vw] h-[40vw] bg-purple-600/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header - contained */}
      <div className="container mx-auto px-4 md:px-6 mb-12 md:mb-16 text-center relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-brand-accent font-bold tracking-[0.3em] uppercase text-xs mb-3 md:mb-4 block">Proof of Work</span>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 md:mb-8 tracking-tight">
            Our results are <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">indisputable.</span>
          </h2>
          <p className="text-brand-muted-light text-base md:text-lg lg:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            While others talk about growth frameworks, we deliver clinical structural impact. 
            Hear from founders who chose <span className="text-white font-semibold italic">clarity</span> over theater.
          </p>
        </motion.div>
      </div>

      {/* Marquee - full width, edge fades */}
      <div className="relative z-10 w-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-16 sm:w-24 md:w-40 bg-gradient-to-r from-[#050508] via-[#050508]/80 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-24 md:w-40 bg-gradient-to-l from-[#050508] via-[#050508]/80 to-transparent z-20 pointer-events-none" />
        <div className="space-y-4 md:space-y-6 py-2">
          <MarqueeRow items={row1} direction="left" duration={45} />
          <MarqueeRow items={row2} direction="right" duration={55} />
          <MarqueeRow items={row3} direction="left" duration={50} />
        </div>
      </div>

      {/* CTA - contained, centered */}
      <div className="container mx-auto px-4 md:px-6 mt-16 md:mt-24 relative z-20 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex justify-center"
        >
          <Button 
            size="lg" 
            className="!px-12 md:!px-16 !py-6 md:!py-8 text-xl md:text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-[0_0_50px_rgba(217,70,239,0.3)] hover:shadow-[0_0_70px_rgba(217,70,239,0.5)] transition-all duration-500"
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Book Your Session
          </Button>
        </motion.div>
      </div>
    </section>
  );
};