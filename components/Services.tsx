import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Section } from './ui/Section';
import { Button } from './ui/Button';

export const Services: React.FC<{ onOpenBooking: (type?: 'diagnostic' | 'partner') => void }> = ({ onOpenBooking }) => {
  return (
    <Section id="services" className="relative">
      <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 tracking-tight">Services</h2>
        <p className="text-lg md:text-xl text-brand-muted-light font-light leading-relaxed">
          No complex retainers. No vague scopes. Just two ways we provide immediate strategic clarity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
        {/* Diagnostic Card - compact on mobile */}
        <div className="glass-panel rounded-xl md:rounded-3xl p-4 md:p-10 border border-white/10 hover:border-brand-accent/30 transition-all duration-300 group relative">
          <div className="mb-4 md:mb-8">
            <h3 className="text-xl md:text-3xl font-serif font-bold mb-2 md:mb-4">Diagnostic Session</h3>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm text-brand-muted line-through font-medium">Was £266.65</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-bold text-white">£159.99</span>
                <span className="text-brand-accent font-bold text-xs md:text-sm uppercase tracking-widest">40% OFF</span>
              </div>
            </div>
            <p className="mt-3 md:mt-6 text-sm md:text-base text-brand-muted-light leading-relaxed">
              A 90-minute intensive strategic deep-dive. We diagnose your bottleneck and build an immediate 30-day action plan for you to execute.
            </p>
          </div>

          <ul className="space-y-2 md:space-y-4 mb-5 md:mb-10">
            {['Pre-session P&L analysis', '90-min intensive strategy call', 'Custom Action Plan', 'Decision Matrix tool', 'Money-back guarantee'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-brand-muted-light">
                <span className="shrink-0"><Check className="w-4 h-4 md:w-5 md:h-5 text-brand-accent" /></span>
                <span className="text-xs md:text-sm">{f}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" size="sm" className="w-full justify-between !py-3 md:!py-3.5" onClick={() => onOpenBooking('diagnostic')}>
            Book Now
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Partner Card - compact on mobile */}
        <div className="bg-gradient-to-b from-brand-card to-brand-dark rounded-xl md:rounded-3xl p-4 md:p-10 border border-brand-accent/40 shadow-[0_0_30px_rgba(217,70,239,0.08)] relative group">
          <div className="absolute -top-2.5 right-3 md:right-8 bg-brand-accent text-white text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2.5 md:px-3 py-0.5 md:py-1 rounded-full z-10">
            MOST IMPACTFUL
          </div>
          
          <div className="mb-4 md:mb-8">
            <h3 className="text-xl md:text-3xl font-serif font-bold mb-2 md:mb-4">Partner Programme</h3>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm text-brand-muted line-through font-medium">Was £1,249.98</span>
              <div className="flex items-baseline gap-2">
                <div className="flex flex-col">
                   <span className="text-3xl md:text-5xl font-bold text-brand-accent">£749.99</span>
                   <span className="text-[9px] md:text-[10px] text-brand-accent/80 font-black uppercase tracking-widest">Per Month</span>
                </div>
                <span className="text-white font-bold text-xs md:text-sm uppercase tracking-widest">40% OFF</span>
              </div>
            </div>
            <p className="mt-3 md:mt-6 text-sm md:text-base text-brand-muted-light leading-relaxed">
              For founders who need an acting Strategic Team. We work alongside you to restructure operations and negotiate growth.
            </p>
          </div>

          <ul className="space-y-2 md:space-y-4 mb-5 md:mb-10">
            {['Direct WhatsApp access to us', 'Vendor & contract negotiation', 'Operational restructuring', 'Weekly accountability calls', 'Hands-on execution support'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-white">
                <span className="shrink-0"><Check className="w-4 h-4 md:w-5 md:h-5 text-brand-accent" /></span>
                <span className="text-xs md:text-sm">{f}</span>
              </li>
            ))}
          </ul>

          <Button size="sm" className="w-full justify-between bg-brand-accent text-white !py-3 md:!py-3.5" onClick={() => onOpenBooking('partner')}>
            Join Programme
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Section>
  );
};