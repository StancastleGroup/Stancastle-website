import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

// Lazy load all below-the-fold components for better initial load performance
const Hero = lazy(() => import('./components/Hero').then((m) => ({ default: m.Hero })));
const ProblemSection = lazy(() => import('./components/ProblemSection').then((m) => ({ default: m.ProblemSection })));
const Comparison = lazy(() => import('./components/Comparison').then((m) => ({ default: m.Comparison })));
const Services = lazy(() => import('./components/Services').then((m) => ({ default: m.Services })));
const WhyUs = lazy(() => import('./components/WhyUs').then((m) => ({ default: m.WhyUs })));
const Testimonials = lazy(() => import('./components/Testimonials').then((m) => ({ default: m.Testimonials })));
const FAQ = lazy(() => import('./components/FAQ').then((m) => ({ default: m.FAQ })));
const About = lazy(() => import('./components/About').then((m) => ({ default: m.About })));
const ContactForm = lazy(() => import('./components/ContactForm').then((m) => ({ default: m.ContactForm })));
const Footer = lazy(() => import('./components/Footer').then((m) => ({ default: m.Footer })));
const BookingFlow = lazy(() => import('./components/BookingFlow').then((m) => ({ default: m.BookingFlow })));

// Simple loading placeholder
const SectionLoader = () => <div className="min-h-[400px] bg-brand-dark" />;

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

  // Optimized scroll progress bar - only on desktop (mobile: off for performance)
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    const timer = setTimeout(() => setShowProgressBar(!mq.matches), 1000);
    return () => {
      mq.removeEventListener('change', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleOpenBooking = (type?: 'diagnostic' | 'partner') => {
    setInitialServiceType(type);
    setIsBookingOpen(true);
  };

  return (
    <AuthProvider>
      <main className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased selection:bg-brand-accent/40 selection:text-white">
        {/* Optimized Progress Bar - only on desktop after load */}
        {showProgressBar && typeof window !== 'undefined' && window.innerWidth >= 768 && (
          <ScrollProgressBar />
        )}

        <Navigation onOpenBooking={() => handleOpenBooking()} />
        
        <AnimatePresence mode="wait">
          {isBookingOpen && (
            <Suspense fallback={null}>
              <BookingFlow 
                isOpen={isBookingOpen} 
                onClose={() => setIsBookingOpen(false)} 
                initialService={initialServiceType ?? 'diagnostic'}
              />
            </Suspense>
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
        
        <Suspense fallback={<SectionLoader />}>
          <Hero onOpenBooking={() => handleOpenBooking()} />
        </Suspense>

        <div className="relative">
          {/* Centralizing flow line - only on desktop for performance */}
          <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-brand-accent/20 via-transparent to-brand-accent/5 pointer-events-none opacity-10" />
          
          <Suspense fallback={<SectionLoader />}>
            <ProblemSection />
          </Suspense>
          
          <div className="space-y-4 md:space-y-8">
            <Suspense fallback={<SectionLoader />}>
              <Comparison />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <Services onOpenBooking={handleOpenBooking} />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <WhyUs />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <Testimonials />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <FAQ />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <About />
            </Suspense>
            <Suspense fallback={<SectionLoader />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
        
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        
        {/* Sticky Sale Indicator - static on mobile for performance */}
        {isMobile ? (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none px-4">
            <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3 shadow-3xl border border-brand-accent/30">
              <span className="h-2 w-2 rounded-full bg-brand-accent shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap">
                Diagnostic Intake: <span className="text-brand-accent">2 Slots Left</span>
              </span>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] pointer-events-none px-4"
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
        )}
      </main>
    </AuthProvider>
  );
}

// Optimized scroll progress bar component
const ScrollProgressBar: React.FC = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let rafId: number;
    let ticking = false;
    
    const updateProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const newProgress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setProgress(newProgress);
      ticking = false;
    };
    
    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[2px] bg-brand-accent/20 z-[110] origin-left"
      style={{ 
        transform: `scaleX(${progress})`,
        willChange: 'transform'
      }}
    />
  );
};

export default App;
