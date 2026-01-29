import React from 'react';
import { Section } from './ui/Section';

export const ProblemSection: React.FC = () => {
  return (
    <Section id="problem" className="bg-[#050508] border-y border-white/5 pt-16 pb-16 md:pt-24 md:pb-24">
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
        <h2 className="font-serif text-4xl md:text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
          You're Not Lazy. You're Just <br />
          <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">Solving The Wrong Problem.</span>
        </h2>
        
        <div className="space-y-6 text-xl md:text-2xl text-brand-muted leading-relaxed font-light">
          <p>
            You wake up every day and execute. You market. You optimize. You feel like you're moving a mountain, but when you look at the EBITDA at the end of the quarter, the needle hasn't moved.
          </p>
          <p>
            You're stuck on the <span className="text-white font-semibold italic">"Founder's Treadmill"</span> — increasing velocity just to maintain a stationary position.
          </p>
          
          <div className="glass-panel p-10 rounded-2xl border-l-4 border-brand-accent text-left mx-auto max-w-2xl transform hover:scale-[1.01] transition-transform duration-300 my-8">
            <p className="text-white font-medium text-lg leading-relaxed">
              The constraint isn't your work ethic or your team. It's a fundamental failure in systems architecture that you are too buried within to see.
            </p>
          </div>
          
          <p className="opacity-60 text-lg">
            You've hired agencies that managed symptoms, not root causes. You don't need another tactic; you need a diagnosis.
          </p>
        </div>
      </div>
    </Section>
  );
};
