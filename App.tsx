import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { About } from './components/About';
import { Comparison } from './components/Comparison';
import { WhyUs } from './components/WhyUs';
import { Services } from './components/Services';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { BookingFlow } from './components/BookingFlow';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialServiceType, setInitialServiceType] = useState<'diagnostic' | 'partner' | undefined>();
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleOpenBooking = (type?: 'diagnostic' | 'partner') => {
    setInitialServiceType(type);
    setIsBookingOpen(true);
  };

  return (
    <AuthProvider>
      <main className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased selection:bg-brand-accent/40 selection:text-white">
        {/* Cinematic Progress Bar */}
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] bg-brand-accent z-[110] origin-left"
          style={{ scaleX }}
        />

        <Navigation onOpenBooking={() => handleOpenBooking()} />
        
        <AnimatePresence>
          {isBookingOpen && (
            <BookingFlow 
              isOpen={isBookingOpen} 
              onClose={() => setIsBookingOpen(false)} 
              initialService={initialServiceType}
            />
          )}
        </AnimatePresence>
        
        <Hero onOpenBooking={() => handleOpenBooking()} />

        <div className="relative">
          {/* Centralizing flow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-brand-accent/20 via-transparent to-brand-accent/5 pointer-events-none opacity-10" />
          
          <ProblemSection />
          
          <div className="space-y-4 md:space-y-8">
            <Comparison />
            <Services />
            <WhyUs />
            <Testimonials />
            <FAQ />
            <About />
            <ContactForm />
          </div>
        </div>
        
        <Footer />
        
        {/* Sticky Sale Indicator */}
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 2, type: 'spring' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div className="glass-panel px-10 py-4 rounded-full flex items-center gap-5 shadow-3xl border border-brand-accent/30 backdrop-blur-3xl">
            <div className="relative">
              <span className="flex h-3 w-3 rounded-full bg-brand-accent" />
              <span className="absolute inset-0 flex h-3 w-3 rounded-full bg-brand-accent animate-ping" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">
              Diagnostic Intake: <span className="text-brand-accent">2 Slots Left</span>
            </span>
          </div>
        </motion.div>
      </main>
    </AuthProvider>
  );
}

export default App;
