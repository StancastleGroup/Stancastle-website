import React, { useState } from 'react';
import { LegalModals, LegalType } from './LegalModals';
import { AnimatePresence } from 'framer-motion';
import { Instagram, Phone, Clock } from 'lucide-react';

// Custom TikTok Icon Component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.15v10.07c-.01 4.56-5.59 6.72-8.67 3.33-3.05-3.35-1.12-9.17 3.7-8.47v4.3c-1.55.15-2.58 1.95-1.63 3.26.96 1.34 3.3 1.05 3.32-.98V.03c-.3-.01-.6-.01-.9-.01z"/>
  </svg>
);

export const Footer: React.FC = () => {
  const [legalType, setLegalType] = useState<LegalType>(null);

  const legalLinks: { label: string; type: NonNullable<LegalType> }[] = [
    { label: 'Terms & Conditions', type: 'terms' },
    { label: 'Terms of Use', type: 'use' },
    { label: 'Privacy Policy', type: 'privacy' },
    { label: 'Cookie Policy', type: 'cookie' },
    { label: 'Disclaimer', type: 'disclaimer' },
    { label: 'Refund Policy', type: 'refund' },
  ];

  return (
    <footer className="border-t border-white/5 pt-20 pb-12 bg-[#050508] relative overflow-hidden">
      <AnimatePresence>
        {legalType && (
          <LegalModals type={legalType} onClose={() => setLegalType(null)} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-white">Stancastle</h3>
            <p className="text-sm text-brand-muted-light max-w-sm leading-relaxed">
              Fixing actual business problems with clear thinking. No corporate theatre, just structural impact for senior business owners.
            </p>
            
            <div className="space-y-4 pt-4 border-t border-white/5">
               <a href="tel:02080642496" className="flex items-center gap-3 text-white hover:text-brand-accent transition-colors group">
                 <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-accent/20 transition-colors">
                    <Phone className="w-4 h-4" />
                 </div>
                 <span className="font-bold tracking-wide">020 8064 2496</span>
               </a>
               <div className="flex items-start gap-3 text-brand-muted-light">
                 <div className="p-2 bg-white/5 rounded-lg shrink-0">
                    <Clock className="w-4 h-4" />
                 </div>
                 <div className="text-sm leading-relaxed">
                    <p>Mon - Sat: 8am - 6pm</p>
                    <p>Sun: Closed</p>
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
              <a 
                href="https://www.instagram.com/stancastlegroup/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-muted hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://tiktok.com/@Stancastlegroup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-brand-muted hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.type}>
                  <button 
                    onClick={() => setLegalType(link.type)}
                    className="text-sm text-brand-muted-light hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-500">Resources</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-brand-muted-light hover:text-white transition-colors"
                >
                  Strategic FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm text-brand-muted-light hover:text-white transition-colors"
                >
                  Client Results
                </button>
              </li>
              <li>
                <a href="mailto:contact@stancastle.com" className="text-sm text-brand-muted-light hover:text-white transition-colors">
                  contact@stancastle.com
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:text-right space-y-4">
             <div className="inline-block p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted mb-2">Registered Office</p>
                <p className="text-xs text-brand-muted-light leading-relaxed">
                  Flat 3, 216 Wash Lane<br />
                  Bury, England, BL9 7DR
                </p>
             </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-medium text-center md:text-left">
            © 2025 Stancastle Ltd. All rights reserved. <br className="md:hidden" />
            Company No. 16036016 | Registered in England and Wales
          </div>
          <div className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-medium">
            UK Registered Business
          </div>
        </div>
      </div>
    </footer>
  );
};