import React from 'react';
import { motion } from 'framer-motion';
import { Section } from './ui/Section';
import { ScanSearch, LineChart, ShieldCheck } from 'lucide-react';

const reasons = [
  {
    icon: ScanSearch,
    title: "Forensic Diagnosis",
    description: "We don't prescribe until we diagnose. Most agencies throw tactics at a wall. We spend the initial phase tearing apart your P&L and operations to find the *actual* bottleneck choking your growth."
  },
  {
    icon: LineChart,
    title: "Profit Over Pedigree",
    description: "We don't care about 'brand awareness' unless it converts. We aren't here to win design awards. Every strategy is reverse-engineered strictly from your cash flow and profitability targets."
  },
  {
    icon: ShieldCheck,
    title: "Radical Candor",
    description: "Your team is likely afraid to tell you the truth. We aren't. We provide the unfiltered, objective strategic clarity required to break through plateaus, even if it's uncomfortable."
  }
];

export const WhyUs: React.FC = () => {
  return (
    <Section id="methodology" className="relative">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest text-brand-accent uppercase bg-brand-accent/10 rounded-full"
          >
            The Methodology
          </motion.span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">Impact.</span>
          </h2>
          <p className="text-xl text-brand-muted max-w-2xl mx-auto">
            We operate at the intersection of financial rigor and creative strategy. This isn't coaching. It's business engineering.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="group relative p-8 rounded-2xl glass-panel border border-white/5 hover:border-brand-accent/30 transition-all duration-500 overflow-hidden"
            >
              {/* Hover Gradient Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 mb-8 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-brand-accent/20">
                  <item.icon className="w-7 h-7 text-brand-accent" />
                </div>
                
                <h3 className="font-serif text-2xl font-bold mb-4 text-white group-hover:text-fuchsia-200 transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-brand-muted leading-relaxed text-sm md:text-base">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
};