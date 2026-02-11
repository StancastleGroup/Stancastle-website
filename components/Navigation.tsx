import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Instagram, LogIn } from 'lucide-react';
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

const SocialLinks = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-6 ${className}`}>
    <a 
      href="https://www.instagram.com/stancastlegroup/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-brand-muted hover:text-brand-accent transition-all transform hover:scale-125"
      aria-label="Instagram"
    >
      <Instagram className="w-5 h-5" />
    </a>
    <a 
      href="https://tiktok.com/@Stancastlegroup" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-brand-muted hover:text-brand-accent transition-all transform hover:scale-125"
      aria-label="TikTok"
    >
      <TikTokIcon className="w-5 h-5" />
    </a>
  </div>
);

export const Navigation: React.FC<{ onOpenBooking: () => void }> = ({ onOpenBooking }) => {
  const { session, profile, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
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
                className="h-16 sm:h-20 xl:h-24 w-auto scale-x-[1.5] origin-left object-contain object-left rounded-xl transition-all duration-500 group-hover:opacity-90"
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
                    className="text-[12px] font-black uppercase tracking-[0.35em] text-brand-muted-light hover:text-white transition-all relative group whitespace-nowrap"
                  >
                    {item.label}
                    <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-brand-accent transition-all duration-500 group-hover:w-full" />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop: right actions (social, sign in, button) - same breakpoint */}
            <div className="hidden xl:flex items-center gap-6 2xl:gap-8 shrink-0">
              <SocialLinks />
              <div className="h-6 w-px bg-white/10 shrink-0" />
              
              {session ? (
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-sm font-black text-white leading-none mb-1">{profile?.first_name}</p>
                    <span className="text-[9px] text-brand-accent uppercase tracking-widest font-black">Account Active</span>
                  </div>
                  <Button variant="outline" size="sm" className="!px-5 !py-3 text-[10px] rounded-xl" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-6 2xl:gap-8">
                  <button 
                    onClick={() => openAuth('signin')}
                    className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.3em] text-white hover:text-brand-accent transition-all group whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4 group-hover:-translate-x-1 transition-transform shrink-0" />
                    Sign In
                  </button>
                  <Button variant="primary" size="sm" className="!px-8 !py-4 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl shrink-0" onClick={onOpenBooking}>
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
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="xl:hidden absolute top-full left-6 right-6 mt-6 glass-panel border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl z-[110]"
            >
              <div className="p-12 flex flex-col gap-8">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-3xl font-black text-white hover:text-brand-accent transition-colors uppercase tracking-widest"
                  >
                    {item.label}
                  </a>
                ))}
                
                <div className="h-px bg-white/10 my-4" />
                
                {session ? (
                  <Button onClick={() => signOut()} size="lg">Sign Out</Button>
                ) : (
                  <div className="flex flex-col gap-6">
                    <button onClick={() => openAuth('signin')} className="flex items-center gap-4 text-3xl font-black text-white uppercase tracking-widest">
                      <LogIn className="w-8 h-8" /> Sign In
                    </button>
                    <Button onClick={onOpenBooking} size="lg">Book Diagnostic</Button>
                  </div>
                )}

                <div className="flex justify-center pt-8">
                  <SocialLinks />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};
