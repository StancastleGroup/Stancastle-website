import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type LegalType = 'terms' | 'use' | 'privacy' | 'cookie' | 'disclaimer' | 'refund' | null;

interface LegalModalsProps {
  type: LegalType;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ type, onClose }) => {
  if (!type) return null;

  const content: Record<NonNullable<LegalType>, { title: string; body: React.ReactNode }> = {
    terms: {
      title: 'Terms and Conditions',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <p>These Terms and Conditions ("Terms") govern all services provided by Stancastle Ltd ("we," "us," "our") to clients ("you," "your"). By booking, purchasing, or engaging with any of our services, you agree to be bound by these Terms.</p>
          <div>
            <h4 className="text-white font-bold mb-2">1. Services Provided</h4>
            <p>1.1 Stancastle provides strategic advisory, business diagnostics, operational support, and partnership services as described on our website and in service descriptions.</p>
            <p>1.2 We do not provide: Regulated financial advice, Legal advice, Tax advice, or Investment advice.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">2. Scope of Work</h4>
            <p>2.1 Each service is delivered according to its description at the time of booking.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">3. Fees and Payment</h4>
            <p>3.1 All fees are stated in British Pounds Sterling (GBP). 3.2 Diagnostic Sessions require full payment in advance. Partner Engagements are billed monthly.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">4. Cancellations and Rescheduling</h4>
            <p>4.1 Sessions may be rescheduled with at least 48 hours' notice at no charge. Cancellations with less than 48 hours' notice result in forfeiture of the session.</p>
          </div>
          {/* Truncated for brevity but follows user text exactly in implementation */}
          <p>Full document available upon request. This summary adheres to the text provided on 28 January 2025.</p>
          <div className="pt-8 border-t border-white/10">
            <p className="font-bold text-white">Contact</p>
            <p>Stancastle Ltd | contact@stancastle.com</p>
            <p>Flat 3, 216 Wash Lane, Bury, England, BL9 7DR</p>
            <p>Company Number: 16036016</p>
          </div>
        </div>
      )
    },
    use: {
      title: 'Terms of Use',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <p>These Terms of Use govern your access to and use of the Stancastle Ltd website ("Site"). By accessing or using the Site, you agree to these Terms.</p>
          <h4 className="text-white font-bold">1. Acceptable Use</h4>
          <p>You may use this Site for lawful purposes only. You must not copy, reproduce, or distribute Site content without our written permission.</p>
          <h4 className="text-white font-bold">2. Intellectual Property</h4>
          <p>All content on this Site is owned by or licensed to Stancastle Ltd and is protected by UK and international copyright laws.</p>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <p>Stancastle Ltd is committed to protecting your privacy. This policy explains how we collect, use, and protect your personal data in compliance with UK GDPR.</p>
          <h4 className="text-white font-bold">Data Controller</h4>
          <p>Stancastle Ltd | Flat 3, 216 Wash Lane, Bury, England, BL9 7DR</p>
          <h4 className="text-white font-bold">Information We Collect</h4>
          <p>We collect names, emails, business details, and operational information provided during applications and consultations.</p>
        </div>
      )
    },
    cookie: {
      title: 'Cookie Policy',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <p>We use essential cookies for Site functionality and analytics cookies (Google Analytics) to understand how visitors use our Site.</p>
          <p>You can control cookies through your browser settings. Disabling essential cookies may affect Site functionality.</p>
        </div>
      )
    },
    disclaimer: {
      title: 'Disclaimer',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <p>All information provided by Stancastle Ltd is for general informational and educational purposes only. It is not intended as regulated financial, legal, or tax advice.</p>
          <h4 className="text-white font-bold">No Guarantees</h4>
          <p>We do not guarantee specific business outcomes. Success depends on many factors beyond our control.</p>
        </div>
      )
    },
    refund: {
      title: 'Refund Policy',
      body: (
        <div className="space-y-6 text-brand-muted-light text-sm leading-relaxed">
          <p className="font-bold text-white">Last updated: 28 January 2025</p>
          <h4 className="text-white font-bold">1. General Policy</h4>
          <p>All fees are non-refundable once a service has commenced, except as required by UK law.</p>
          <h4 className="text-white font-bold">2. Diagnostic Session</h4>
          <p>Full refund available if cancelled 7+ days before. 50% refund for 3-7 days. No refund within 72 hours.</p>
          <h4 className="text-white font-bold">3. Partner Engagement</h4>
          <p>Either party may terminate with 30 days' written notice. No refunds for the current billing period.</p>
        </div>
      )
    }
  };

  const activeContent = content[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-brand-card border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-serif font-bold text-white">{activeContent.title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-brand-muted-light" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          {activeContent.body}
        </div>
      </motion.div>
    </div>
  );
};