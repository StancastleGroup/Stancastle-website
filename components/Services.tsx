import React from 'react';
import { Check, ArrowRight, Clock } from 'lucide-react';
import { Section } from './ui/Section';
import { Button } from './ui/Button';

export const Services: React.FC<{ onOpenBooking: (type?: 'diagnostic' | 'partner') => void }> = ({ onOpenBooking }) => {
  return (
    <Section id="services" className="relative">
      <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2 z-20">
         <div className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 animate-bounce shadow-xl">
            <Clock className="w-4 h-4" />
            40% SALE ENDING SOON
         </div>
      </div>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-serif text-5xl font-bold mb-6">Services</h2>
        <p className="text-xl text-brand-muted-light">
          No complex retainers. No vague scopes. Just two ways we provide immediate strategic clarity.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Diagnostic Card */}
        <div className="glass-panel rounded-3xl p-10 border border-white/10 hover:border-brand-accent/30 transition-all duration-500 group relative">
          <div className="mb-8">
            <h3 className="text-3xl font-serif font-bold mb-4">Diagnostic Session</h3>
            <div className="flex flex-col">
              <span className="text-sm text-brand-muted line-through font-medium">Was £266.65</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-white">£159.99</span>
                <span className="text-brand-accent font-bold text-sm uppercase tracking-widest">40% OFF</span>
              </div>
            </div>
            <p className="mt-6 text-brand-muted-light leading-relaxed">
              A 90-minute intensive strategic deep-dive. We diagnose your bottleneck and build an immediate 30-day action plan for you to execute.
            </p>
          </div>

          <ul className="space-y-4 mb-10">
            {['Pre-session P&L analysis', '90-min intensive strategy call', 'Custom Action Plan', 'Decision Matrix tool', 'Money-back guarantee'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-brand-muted-light">
                <span className="shrink-0"><Check className="w-5 h-5 text-brand-accent" /></span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="w-full justify-between" onClick={() => onOpenBooking('diagnostic')}>
            Book Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Partner Card */}
        <div className="bg-gradient-to-b from-brand-card to-brand-dark rounded-3xl p-10 border border-brand-accent/50 shadow-[0_0_40px_rgba(217,70,239,0.1)] relative group">
          <div className="absolute -top-4 right-8 bg-brand-accent text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10">
            MOST IMPACTFUL
          </div>
          
          <div className="mb-8">
            <h3 className="text-3xl font-serif font-bold mb-4">Partner Programme</h3>
            <div className="flex flex-col">
              <span className="text-sm text-brand-muted line-through font-medium">Was £1,249.98</span>
              <div className="flex items-baseline gap-2">
                <div className="flex flex-col">
                   <span className="text-5xl font-bold text-brand-accent">£749.99</span>
                   <span className="text-[10px] text-brand-accent/80 font-black uppercase tracking-widest">Per Month</span>
                </div>
                <span className="text-white font-bold text-sm uppercase tracking-widest">40% OFF</span>
              </div>
            </div>
            <p className="mt-6 text-brand-muted-light leading-relaxed">
              For founders who need an acting Strategic Team. We work alongside you to restructure operations and negotiate growth.
            </p>
          </div>

          <ul className="space-y-4 mb-10">
            {['Direct WhatsApp access to us', 'Vendor & contract negotiation', 'Operational restructuring', 'Weekly accountability calls', 'Hands-on execution support'].map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-white">
                <span className="shrink-0"><Check className="w-5 h-5 text-brand-accent" /></span>
                <span className="text-sm">{f}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full justify-between bg-brand-accent text-white" onClick={() => onOpenBooking('partner')}>
            Join Programme
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </Section>
  );
};