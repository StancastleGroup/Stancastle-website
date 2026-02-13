import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogIn } from 'lucide-react';
import { Button } from './ui/Button';
import { NavItem } from '../types';
import { useAuth } from '../context/AuthContext';

const AuthModal = lazy(() => import('./AuthModal').then((m) => ({ default: m.AuthModal })));

const navItems: NavItem[] = [
  { label: 'About', href: '#about' },
  { label: 'Why Us', href: '#problem' },
  { label: 'Services', href: '#services' },
  { label: 'Results', href: '#results' },
];

export const Navigation: React.FC<{ onOpenBooking: () => void }> = ({ onOpenBooking }) => {
  const { session, profile, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    let ticking = false;
    let lastScrolled: boolean | null = null;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const next = window.scrollY > 30;
        // On mobile, only update when crossing threshold to reduce re-renders
        if (window.innerWidth < 768 && lastScrolled !== null && lastScrolled === next) {
          ticking = false;
          return;
        }
        lastScrolled = next;
        setIsScrolled(next);
        ticking = false;
      });
    };
    handleScroll(); // set initial
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  const openAuth = (view: 'signin' | 'signup') => {
    setAuthView(view);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Suspense fallback={null}>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          defaultView={authView} 
        />
      </Suspense>

      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
          isScrolled ? 'py-4' : 'py-10'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className={`flex items-center justify-between gap-4 xl:gap-6 px-4 sm:px-6 xl:px-10 py-4 xl:py-5 rounded-2xl xl:rounded-[2.5rem] transition-all duration-700 relative ${
            isScrolled ? 'glass-panel shadow-2xl border-white/10' : 'bg-transparent'
          }`}>
            {/* Logo - full STANCASTLE wordmark */}
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center group relative z-10 shrink-0 min-w-0">
              <img
                src="/favicon.jpeg"
                alt="Stancastle"
                width={96}
                height={64}
                decoding="async"
                className="h-16 sm:h-20 xl:h-24 w-auto object-contain object-left rounded-xl transition-all duration-500 group-hover:opacity-90"
              />
            </a>

            {/* Desktop: centered links only when enough width (xl = 1280px+) */}
            <div className="hidden xl:flex flex-1 justify-center items-center min-w-0 px-4">
              <div className="flex items-center gap-10 2xl:gap-14">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="nav-link text-sm xl:text-base font-bold uppercase tracking-[0.2em] xl:tracking-[0.25em] text-brand-muted-light hover:text-white transition-all relative group whitespace-nowrap"
                  >
                    {item.label}
                    <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-brand-accent transition-all duration-500 group-hover:w-full" />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop: right actions (sign in, button) */}
            <div className="hidden xl:flex items-center gap-6 2xl:gap-8 shrink-0">
              {session ? (
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white leading-none mb-1">{profile?.first_name}</p>
                    <span className="nav-link text-[10px] xl:text-xs text-brand-accent uppercase tracking-widest font-bold">Account Active</span>
                  </div>
                  <Button variant="outline" size="sm" className="!px-5 !py-3 text-xs rounded-xl" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-6 2xl:gap-8">
                  <button 
                    onClick={() => openAuth('signin')}
                    className="nav-link flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white hover:text-brand-accent transition-all group whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 group-hover:-translate-x-1 transition-transform shrink-0" />
                    Sign In
                  </button>
                  <Button variant="primary" size="sm" className="!px-8 !py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl shrink-0" onClick={onOpenBooking}>
                    Book Diagnostic
                  </Button>
                </div>
              )}
            </div>

            {/* Hamburger: show below xl so nav never overlaps */}
            <button 
              className="xl:hidden text-white p-3 hover:bg-white/10 rounded-2xl transition-all relative z-10 shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="xl:hidden absolute top-full left-4 right-4 mt-4 glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[110]"
            >
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-lg sm:text-xl font-bold text-white hover:text-brand-accent transition-colors uppercase tracking-[0.2em]"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="h-px bg-white/10 my-2" />
                {session ? (
                  <Button onClick={() => signOut()} size="lg" className="w-full justify-center">Sign Out</Button>
                ) : (
                  <div className="flex flex-col gap-4">
                    <button onClick={() => openAuth('signin')} className="flex items-center justify-center gap-3 py-3 text-base font-bold text-white uppercase tracking-widest hover:text-brand-accent transition-colors">
                      <LogIn className="w-5 h-5" /> Sign In
                    </button>
                    <Button onClick={onOpenBooking} size="lg" className="w-full justify-center">Book Diagnostic</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
