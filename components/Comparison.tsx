import React from 'react';
import { Check, X } from 'lucide-react';
import { Section } from './ui/Section';
import { ComparisonPoint } from '../types';

const comparisonData: ComparisonPoint[] = [
  { feature: 'What they sell', generic: 'Strategy & Insights', stancastle: 'Problem Diagnosis & Solutions' },
  { feature: 'Deliverable', generic: 'PowerPoint Decks', stancastle: 'Action Plan & Execution' },
  { feature: 'Engagement', generic: 'Billable hours & scope creep', stancastle: 'Fixed pricing, clear outcomes' },
  { feature: 'Responsibility', generic: 'Recommendations you implement', stancastle: 'Partnership & Accountability' },
  { feature: 'Value Metric', generic: 'Hours Spent', stancastle: 'Problems Solved' },
];

export const Comparison: React.FC = () => {
  return (
    <Section id="theatre" background="subtle">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
        <div className="lg:sticky lg:top-32">
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Stop buying <br />
            <span className="text-brand-accent">theatre.</span>
          </h2>
          <p className="text-brand-muted-light text-lg mb-8 leading-relaxed">
            Most consultancy is performance art. It looks like work, sounds like progress, but leaves you with a massive bill and the same structural problems you started with. 
          </p>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 border border-brand-accent/20 shadow-xl">
            <h4 className="text-brand-accent font-bold mb-3 text-lg uppercase tracking-tight">The Stancastle Standard</h4>
            <p className="text-brand-muted-light leading-relaxed">
              We prepare for hours before our first call. No "discovery" sessions that waste your time. Our team starts at the solution level immediately.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="space-y-6">
            {comparisonData.map((point, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 group">
                {/* Generic Side */}
                <div className="p-6 rounded-l-xl bg-white/[0.02] border border-white/5 opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-red-400/80 uppercase tracking-widest">
                    <X className="w-3 h-3" /> Generic Consultants
                  </div>
                  <h3 className="text-brand-muted-light font-medium">{point.generic}</h3>
                </div>

                {/* Stancastle Side */}
                <div className="p-6 rounded-r-xl glass-panel border-l-4 border-l-brand-accent relative overflow-hidden group/item">
                  <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-accent uppercase tracking-widest relative z-10">
                    <Check className="w-3 h-3" /> Stancastle
                  </div>
                  <h3 className="text-white font-bold text-lg relative z-10">{point.stancastle}</h3>
                  <p className="text-xs text-brand-muted mt-2 uppercase tracking-widest relative z-10">{point.feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};