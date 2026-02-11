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
import { CheckCircle2 } from 'lucide-react';

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialServiceType, setInitialServiceType] = useState<'diagnostic' | 'partner' | undefined>();
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Show success message when returning from Stripe with ?booking=success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('booking') === 'success') {
      setShowBookingSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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
              initialService={initialServiceType ?? 'diagnostic'}
            />
          )}
        </AnimatePresence>

        {/* Post-payment success overlay */}
        <AnimatePresence>
          {showBookingSuccess && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100]"
                onClick={() => setShowBookingSuccess(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4 p-8 rounded-3xl bg-[#0f0f13] border border-white/10 shadow-2xl text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-brand-accent/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-brand-accent" />
                  </div>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Booking confirmed</h2>
                <p className="text-brand-muted-light mb-6">Thank you. We&apos;ve received your payment and reserved your slot.</p>
                <p className="text-white font-medium mb-1">Please check your email</p>
                <p className="text-brand-muted-light text-sm mb-8">(including your spam folder) for confirmation and meeting details.</p>
                <button
                  onClick={() => setShowBookingSuccess(false)}
                  className="px-8 py-3 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <Hero onOpenBooking={() => handleOpenBooking()} />

        <div className="relative">
          {/* Centralizing flow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-brand-accent/20 via-transparent to-brand-accent/5 pointer-events-none opacity-10" />
          
          <ProblemSection />
          
          <div className="space-y-4 md:space-y-8">
            <Comparison />
            <Services onOpenBooking={handleOpenBooking} />
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
