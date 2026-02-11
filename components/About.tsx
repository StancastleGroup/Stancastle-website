import React from 'react';
import { Section } from './ui/Section';
import { motion } from 'framer-motion';
import { Target, Shield, Zap, TrendingUp } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <Section id="about" className="bg-brand-dark relative pt-12 pb-20">
      <div className="max-w-6xl mx-auto text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="mb-12 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="h-px w-8 bg-brand-accent/50" />
              <span className="text-brand-accent font-black tracking-[0.4em] uppercase text-[10px] block">The Stancastle Thesis</span>
              <div className="h-px w-8 bg-brand-accent/50" />
            </motion.div>
            
            <h2 className="font-serif text-5xl md:text-6xl font-bold text-white mb-6">Strategy as Engineering.</h2>
            <p className="text-xl text-brand-muted-light max-w-2xl font-light leading-relaxed">
              We apply first-principles thinking to the structural bottlenecks of high-growth British businesses.
            </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {[
            { icon: Target, title: "Precision Diagnosis", desc: "Finding the 20% that moves the 80%." },
            { icon: Shield, title: "Capital Protection", desc: "Stopping resource leak in inefficient systems." },
            { icon: Zap, title: "Velocity Injection", desc: "Removing friction from operational workflows." },
            { icon: TrendingUp, title: "EBITDA Focus", desc: "Pure profit optimization at every level." }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-brand-accent/20 transition-all flex flex-col items-center">
              <div className="p-3 bg-brand-accent/10 rounded-2xl mb-6">
                <item.icon className="w-6 h-6 text-brand-accent" />
              </div>
              <h4 className="text-white font-bold mb-3 uppercase tracking-widest text-xs">{item.title}</h4>
              <p className="text-brand-muted-light text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
