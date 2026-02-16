import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, UserPlus, User } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { getBookableDates, getTimeSlotsForDate, formatDateLabel } from '../lib/availability';
import { validateEmail as validateEmailFormat, validatePhone as validatePhoneFormat, validateUrl as validateUrlFormat } from '../lib/validation';

/** Format "10:00" -> "10:00am", "17:00" -> "5:00pm" */
function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h === 0) return `12:${String(m).padStart(2, '0')}am`;
  if (h < 12) return `${h}:${String(m).padStart(2, '0')}am`;
  if (h === 12) return `12:${String(m).padStart(2, '0')}pm`;
  return `${h - 12}:${String(m).padStart(2, '0')}pm`;
}

const SERVICES = {
  diagnostic: {
    title: 'Diagnostic Session',
    description: 'A deep dive into your business to identify gaps and opportunities.',
    price: '£159.99',
    duration: '90 MINS'
  },
  partner: {
    title: 'Partner Programme',
    description: 'Ongoing strategic partnership to scale your business.',
    price: '£749.99',
    duration: 'MONTHLY'
  }
};

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: 'diagnostic' | 'partner';
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ 
  isOpen, 
  onClose, 
  initialService = 'diagnostic',
}) => {
  const { session, profile } = useAuth();
  const [step, setStep] = useState<'service' | 'calendar' | 'details' | 'success'>('service');
  const [selectedService, setSelectedService] = useState(initialService);
  const fallbackDates = useMemo(() => getBookableDates(90), []);
  const [selectedDate, setSelectedDate] = useState<Date>(() => fallbackDates[0] ?? new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [checkoutChoice, setCheckoutChoice] = useState<'account' | 'guest' | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    companyWebsite: '',
    noCompany: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Real availability: fetched per month when user views that month (current month on open, then on prev/next)
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, string[]>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const fetchingRef = useRef<string>(''); // Track which month is currently being fetched
  const redirectUrlRef = useRef<string | null>(null); // Store redirect URL for mobile compatibility
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const h = () => setIsMobile(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  // Calendar UI: which month is shown in the month picker (for prev/next)
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // Note: We always fetch fresh availability to ensure booked slots don't appear
  // Removed fetchedMonths cache to prevent stale data

  const monthKey = useMemo(
    () => `${calendarViewMonth.getFullYear()}-${String(calendarViewMonth.getMonth() + 1).padStart(2, '0')}`,
    [calendarViewMonth]
  );

  const fetchAvailabilityForMonth = useCallback(
    (viewMonth: Date) => {
      const y = viewMonth.getFullYear();
      const m = viewMonth.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      
      // Prevent duplicate fetches for the same month
      if (fetchingRef.current === monthKey) return;
      fetchingRef.current = monthKey;
      
      const from = new Date(y, m, 1);
      const to = new Date(y, m + 1, 0);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      setAvailabilityLoading(true);
      fetch(`${supabaseUrl}/functions/v1/get-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ from_date: fromStr, to_date: toStr }),
      })
        .then((r) => r.json())
        .then((data) => {
          const byDate: Record<string, string[]> = {};
          (data.dates ?? []).forEach((d: { date: string; slots: string[] }) => {
            byDate[d.date] = d.slots ?? [];
          });
          // Replace (not merge) availability for this month to ensure booked slots don't appear
          // Optimized: create new object instead of mutating
          setAvailabilityByDate((prev) => {
            const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
            const monthEnd = `${y}-${String(m + 1).padStart(2, '0')}-31`;
            const updated: Record<string, string[]> = {};
            // Copy dates from other months
            Object.keys(prev).forEach((dateStr) => {
              if (dateStr < monthStart || dateStr > monthEnd) {
                updated[dateStr] = prev[dateStr];
              }
            });
            // Add fresh availability for this month
            Object.assign(updated, byDate);
            return updated;
          });
          // Always fetch fresh - no caching
        })
        .catch(() => {
          const byDate: Record<string, string[]> = {};
          const d = new Date(from);
          while (d.getTime() <= to.getTime()) {
            const dateStr = d.toISOString().split('T')[0];
            byDate[dateStr] = getTimeSlotsForDate(new Date(d));
            d.setDate(d.getDate() + 1);
          }
          setAvailabilityByDate((prev) => ({ ...prev, ...byDate }));
          // Don't track fetchedMonths anymore - we always fetch fresh
          // setFetchedMonths((prev) => new Set(prev).add(`${y}-${String(m + 1).padStart(2, '0')}`));
        })
        .finally(() => {
          setAvailabilityLoading(false);
          fetchingRef.current = ''; // Clear fetching flag
        });
    },
    []
  );

  // Track which month we've fetched to avoid duplicate fetches
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string>('');

  // When calendar step is active, fetch availability for the current month (only if changed)
  useEffect(() => {
    if (!isOpen || step !== 'calendar') return;
    // Only fetch if we haven't fetched this month yet, or if it's been more than 30 seconds
    if (lastFetchedMonth !== monthKey) {
      fetchAvailabilityForMonth(calendarViewMonth);
      setLastFetchedMonth(monthKey);
    }
  }, [isOpen, step, monthKey, calendarViewMonth, fetchAvailabilityForMonth, lastFetchedMonth]);

  // When modal closes, clear availability cache and reset fetched month
  useEffect(() => {
    if (!isOpen) {
      setAvailabilityByDate({});
      setLastFetchedMonth('');
    }
  }, [isOpen]);


  // Pre-fill from profile when signed in (only update if values changed)
  useEffect(() => {
    if (!profile) return;
    setFormData((f) => {
      const updates: Partial<typeof f> = {};
      if (profile.email && profile.email !== f.email) updates.email = profile.email;
      if (profile.first_name && profile.first_name !== f.firstName) updates.firstName = profile.first_name;
      if (profile.last_name && profile.last_name !== f.lastName) updates.lastName = profile.last_name;
      if (profile.company && profile.company !== f.companyName) updates.companyName = profile.company;
      if (profile.phone != null && profile.phone !== f.phone) updates.phone = profile.phone;
      if (profile.company_website != null && profile.company_website !== f.companyWebsite) updates.companyWebsite = profile.company_website;
      return Object.keys(updates).length > 0 ? { ...f, ...updates } : f;
    });
  }, [profile?.email, profile?.first_name, profile?.last_name, profile?.company, profile?.phone, profile?.company_website]);

  // Reset checkout choice when user signs in (e.g. after "Create account")
  useEffect(() => {
    if (session) setCheckoutChoice(null);
  }, [session]);

  const bookableDates = useMemo(() => {
    const dates = Object.keys(availabilityByDate).filter((d) => (availabilityByDate[d]?.length ?? 0) > 0).sort();
    if (dates.length > 0) return dates.map((d) => new Date(d + 'T12:00:00'));
    return fallbackDates;
  }, [availabilityByDate, fallbackDates]);

  useEffect(() => {
    const dateStr = selectedDate?.toISOString().split('T')[0];
    const slots = availabilityByDate[dateStr];
    if (!availabilityLoading && bookableDates.length > 0 && (!slots || slots.length === 0)) {
      setSelectedDate(bookableDates[0]);
      setSelectedTime('');
    }
  }, [availabilityLoading, availabilityByDate, bookableDates, selectedDate]);

  // When opening the calendar step, show the month of the selected date
  useEffect(() => {
    if (step !== 'calendar' || !selectedDate) return;
    const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    setCalendarViewMonth((prev) => (prev.getTime() !== d.getTime() ? d : prev));
  }, [step, selectedDate?.getTime()]);

  const availableSlotsForSelectedDate = useMemo(() => {
    const dateStr = selectedDate?.toISOString().split('T')[0];
    return availabilityByDate[dateStr] ?? getTimeSlotsForDate(selectedDate);
  }, [selectedDate, availabilityByDate]);

  const bookableDateSet = useMemo(
    () => new Set(bookableDates.map((d) => d.toISOString().split('T')[0])),
    [bookableDates]
  );

  // Calendly-style month grid: 6 rows × 7 (SUN–SAT). Each cell: { date, isCurrentMonth, isPast, isBookable }.
  const calendarGrid = useMemo(() => {
    const year = calendarViewMonth.getFullYear();
    const month = calendarViewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = first.getDay();
    const daysInMonth = last.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells: { date: Date; isCurrentMonth: boolean; isPast: boolean; isBookable: boolean }[] = [];
    const totalCells = 42;
    for (let i = 0; i < totalCells; i++) {
      const dayIndex = i - startOffset + 1;
      let date: Date;
      let isCurrentMonth: boolean;
      if (dayIndex < 1) {
        date = new Date(year, month, dayIndex);
        isCurrentMonth = false;
      } else if (dayIndex > daysInMonth) {
        date = new Date(year, month + 1, dayIndex - daysInMonth);
        isCurrentMonth = false;
      } else {
        date = new Date(year, month, dayIndex);
        isCurrentMonth = true;
      }
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const isPast = date < today;
      const isBookable = bookableDateSet.has(dateStr);
      cells.push({ date, isCurrentMonth, isPast, isBookable });
    }
    return cells;
  }, [calendarViewMonth, bookableDateSet]);

  const validateEmail = (email: string) => validateEmailFormat(email);
  const validatePhone = (phone: string) => validatePhoneFormat(phone);
  const validateUrl = (url: string, required = true) => validateUrlFormat(url, required);

  const checkEmailRegistered = useCallback(async (emailToCheck: string): Promise<boolean> => {
    const trimmed = emailToCheck?.trim();
    if (!trimmed || validateEmailFormat(trimmed) !== '') return false;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      return data.registered === true;
    } catch {
      return false;
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;
    if (!formData.noCompany) {
      if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
      const urlError = validateUrl(formData.companyWebsite, true);
      if (urlError) errors.companyWebsite = urlError;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedAsGuest =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email?.trim() &&
    formData.phone.trim() &&
    (formData.noCompany || (formData.companyName.trim() && formData.companyWebsite?.trim()));
  const canProceedToPayment = session
    ? !!(selectedTime && profile?.email)
    : canProceedAsGuest && !!selectedTime && !formErrors.email;

  const handlePayment = async () => {
    console.log('[BookingFlow] handlePayment called', { selectedService, selectedTime, hasSession: !!session, isGuest: checkoutChoice === 'guest' });
    
    if (!selectedService || !selectedTime) {
      console.warn('[BookingFlow] Missing service or time');
      return;
    }

    const isGuest = !session && checkoutChoice === 'guest';
    if (!session && !isGuest) {
      alert('Please choose "Create account" or "Continue as guest" and complete the form.');
      return;
    }

    if (isGuest) {
      if (!validateForm()) {
        console.warn('[BookingFlow] Guest form validation failed');
        return;
      }
      const alreadyRegistered = await checkEmailRegistered(formData.email);
      if (alreadyRegistered) {
        setFormErrors((prev) => ({ ...prev, email: 'This email is already registered. Please sign in to continue.' }));
        return;
      }
    }

    if (session) {
      if (!profile?.email) {
        alert('Your account is missing an email. Please sign out and sign in again or contact support.');
        return;
      }
      // Refresh session so the access_token is valid (avoids 401 from expired JWT)
      const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !freshSession?.access_token) {
        setShowAuthPrompt(true);
        alert('Your session expired. Please sign in again.');
        return;
      }
    }

    console.log('[BookingFlow] Starting payment process');
    setIsProcessing(true);

    try {
      const dateStr = selectedDate?.toISOString().split('T')[0];
      const customerEmail = session
        ? (profile?.email || formData.email?.trim() || '')
        : formData.email?.trim() || '';
      const firstName = session ? (profile?.first_name || formData.firstName.trim() || '') : formData.firstName.trim() || '';
      const lastName = session ? (profile?.last_name || formData.lastName.trim() || '') : formData.lastName.trim() || '';
      const phoneVal = session ? (profile?.phone || formData.phone.trim() || null) : formData.phone.trim() || null;
      const companyNameVal = formData.noCompany ? null : (formData.companyName.trim() || (session ? profile?.company || null : null));
      let companyWebsiteVal: string | null = null;
      if (!formData.noCompany) {
        const raw = formData.companyWebsite?.trim() || (session ? profile?.company_website || null : null);
        if (raw) companyWebsiteVal = raw.startsWith('http') ? raw : `https://${raw}`;
      }

      const currentSession = session ? (await supabase.auth.getSession()).data.session : null;
      const userId = currentSession?.user?.id ?? null;

      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            ...(currentSession?.access_token ? { Authorization: `Bearer ${currentSession.access_token}` } : {}),
          },
          body: JSON.stringify({
            service_type: selectedService,
            user_id: userId,
            date: dateStr,
            time: selectedTime,
            first_name: firstName,
            last_name: lastName,
            email: customerEmail,
            phone: phoneVal,
            company_name: companyNameVal,
            company_website: companyWebsiteVal,
            no_company: formData.noCompany || false,
            success_url: `${window.location.origin}?booking=success`,
            cancel_url: `${window.location.origin}?booking=cancelled`,
            customer_email: customerEmail || undefined,
          }),
      });

      let checkoutData: any = {};
      try {
        const text = await res.text();
        checkoutData = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error('[BookingFlow] Failed to parse checkout response:', err, 'Response text:', await res.text());
        throw new Error('Invalid response from payment server');
      }
      
      console.log('[BookingFlow] Checkout response:', { status: res.status, ok: res.ok, data: checkoutData });
      
      if (!res.ok) {
        if (res.status === 401) {
          setShowAuthPrompt(true);
          alert('Session expired. Please sign in again and try paying once more.');
          setIsProcessing(false);
          return;
        }
        console.error('[BookingFlow] Checkout failed:', checkoutData);
        throw new Error(checkoutData?.error || checkoutData?.message || `Payment initialization failed (${res.status})`);
      }

      const url = checkoutData?.url;
      console.log('[BookingFlow] Checkout URL received:', url, 'Type:', typeof url);
      
      if (!url || typeof url !== 'string') {
        console.error('[BookingFlow] Invalid checkout URL:', url, 'Full response:', checkoutData);
        throw new Error(checkoutData?.error || checkoutData?.message || 'No checkout URL returned from payment server');
      }
      
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error('[BookingFlow] Invalid URL format:', url);
        throw new Error('Invalid checkout URL format');
      }

      // Redirect to Stripe - critical for mobile compatibility
      console.log('[BookingFlow] Redirecting to Stripe checkout:', url);
      
      // Store URL in ref for potential retry
      redirectUrlRef.current = url;
      
      // Mobile browsers are strict about redirects after async operations
      // Try multiple methods to ensure redirect works on all devices
      try {
        // Method 1: window.location.replace (works better on some mobile browsers)
        window.location.replace(url);
      } catch (err1) {
        console.warn('[BookingFlow] Replace failed, trying href:', err1);
        try {
          // Method 2: window.location.href (standard method)
      window.location.href = url;
        } catch (err2) {
          console.warn('[BookingFlow] Href failed, trying window.open:', err2);
          try {
            // Method 3: window.open with _self (some mobile browsers allow this)
            const opened = window.open(url, '_self');
            if (!opened) {
              // Method 4: Last resort - show URL to user
              console.error('[BookingFlow] All redirect methods failed');
              alert(`Please visit: ${url}`);
            }
          } catch (err3) {
            console.error('[BookingFlow] All redirect methods failed:', err3);
            alert(`Please visit: ${url}`);
          }
        }
      }
      
      // Don't set isProcessing to false - we're redirecting
      return;
    } catch (error) {
      console.error('[BookingFlow] Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'There was an error processing your payment. Please try again.';
      alert(errorMessage);
      setIsProcessing(false);
    }
    // Note: setIsProcessing(false) is NOT called on success because we redirect
  };

  if (!isOpen) return null;

  const ModalPanel = isMobile ? 'div' : motion.div;
  const modalPanelProps = isMobile
    ? { className: 'relative w-full max-w-4xl bg-[#0f0f13] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]' }
    : {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: { duration: 0.2, ease: 'easeOut' },
        className: 'relative w-full max-w-4xl bg-[#0f0f13] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
      };

  return (
    <>
      <AuthModal 
        isOpen={showAuthPrompt} 
        onClose={() => {
          setShowAuthPrompt(false);
          if (!session) setCheckoutChoice(null);
        }} 
        defaultView="signup" 
      />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
        {isMobile ? (
          <div onClick={onClose} className="absolute inset-0 bg-black/90" aria-hidden />
        ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
            transition={{ duration: 0.2 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        )}
        
        <ModalPanel {...modalPanelProps}>
          <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                {step === 'service' && 'Select Service'}
                {step === 'calendar' && 'Choose Your Slot'}
                {step === 'details' && 'Secure Checkout'}
                {step === 'success' && 'Booking Confirmed'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-brand-muted-light" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 md:p-10" style={{ WebkitOverflowScrolling: 'touch' }}>
            <AnimatePresence mode="wait">
              {step === 'service' && (
                <motion.div 
                  key="service" 
                  className="grid md:grid-cols-2 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {Object.entries(SERVICES).map(([key, s]) => (
                    <button 
                      key={key} 
                      onClick={() => { setSelectedService(key as any); setStep('calendar'); }} 
                      className="text-left p-6 md:p-8 rounded-xl md:rounded-2xl border border-white/5 bg-white/[0.02] hover:border-brand-accent/50 transition-all duration-200"
                    >
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-brand-muted-light text-sm mb-6 md:mb-8 leading-relaxed">{s.description}</p>
                      <span className="text-2xl md:text-3xl font-bold text-white">{s.price}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 'calendar' && (
                <motion.div 
                  key="calendar" 
                  className="flex flex-col md:flex-row gap-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-white mb-4">Select a Date & Time</h3>
                    {availabilityLoading ? (
                      <p className="text-brand-muted-light text-sm">Loading availability…</p>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            aria-label="Previous month"
                            onClick={() => {
                              setCalendarViewMonth((m) => {
                                const newMonth = new Date(m.getFullYear(), m.getMonth() - 1, 1);
                                return newMonth;
                              });
                            }}
                            className="w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="text-white font-semibold">
                            {calendarViewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            type="button"
                            aria-label="Next month"
                            onClick={() => {
                              setCalendarViewMonth((m) => {
                                const newMonth = new Date(m.getFullYear(), m.getMonth() + 1, 1);
                                return newMonth;
                              });
                            }}
                            className="w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-brand-muted-light uppercase py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {calendarGrid.map((cell, i) => {
                            const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
                            const canClick = cell.isCurrentMonth && cell.isBookable && !cell.isPast;
                         return (
                           <button 
                                key={`${cell.date.getTime()}-${i}`}
                                type="button"
                                disabled={!canClick}
                                onClick={() => {
                                  if (canClick) {
                                    setSelectedDate(cell.date);
                                    setSelectedTime('');
                                  }
                                }}
                                className={`
                                  aspect-square rounded-full text-sm font-medium flex items-center justify-center transition-colors
                                  ${!cell.isCurrentMonth ? 'text-white/20' : ''}
                                  ${cell.isCurrentMonth && cell.isPast ? 'text-brand-muted-light/60' : ''}
                                  ${cell.isCurrentMonth && !cell.isPast && !cell.isBookable ? 'text-brand-muted-light/60' : ''}
                                  ${cell.isCurrentMonth && !cell.isPast && cell.isBookable ? 'text-white border border-white/30 hover:border-brand-accent hover:bg-white/5' : ''}
                                  ${isSelected ? '!bg-brand-accent !border-brand-accent !text-white' : ''}
                                `}
                              >
                                {cell.date.getDate()}
                           </button>
                         );
                       })}
                     </div>
                      </>
                    )}
                  </div>
                  <div className="w-full md:w-72 shrink-0">
                    {selectedDate && (
                      <>
                        <p className="text-brand-muted-light text-sm mb-3">
                          {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                        {availableSlotsForSelectedDate.length === 0 ? (
                          <p className="text-brand-muted-light text-sm py-4">No slots left on this day. Pick another date.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {availableSlotsForSelectedDate.map((time) => (
                        <button 
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all text-left ${selectedTime === time ? 'bg-brand-accent border-brand-accent text-white' : 'border-white/10 text-brand-muted-light hover:border-white/20 hover:text-white'}`}
                              >
                                {formatTimeLabel(time)}
                        </button>
                      ))}
                    </div>
                        )}
                        <Button className="mt-6 w-full" disabled={!selectedTime} onClick={() => setStep('details')}>
                          Continue
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div 
                  key="details" 
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {session ? (
                    <>
                      <p className="text-brand-muted-light text-sm">You’re signed in. Confirm your booking and pay—we’ll use your account details.</p>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-brand-muted-light text-xs mb-3">Your booking: {formatDateLabel(selectedDate)} at {selectedTime} · {SERVICES[selectedService].title}</p>
                        <Button 
                          className="w-full !py-6 text-xl" 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isProcessing && canProceedToPayment && selectedTime) {
                              try { await handlePayment(); } catch (err) {
                                console.error('[BookingFlow] Payment handler error:', err);
                                setIsProcessing(false);
                              }
                            }
                          }}
                          disabled={isProcessing || !canProceedToPayment || !selectedTime}
                          type="button"
                        >
                          {isProcessing ? 'Processing...' : `Pay ${SERVICES[selectedService].price} & confirm`}
                        </Button>
                      </div>
                    </>
                  ) : checkoutChoice === null || checkoutChoice === 'account' ? (
                    <>
                      <p className="text-brand-muted-light text-sm">Choose how to continue with your booking.</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full !py-6 flex flex-col items-center gap-2"
                          onClick={() => { setCheckoutChoice('account'); setShowAuthPrompt(true); }}
                        >
                          <UserPlus className="w-6 h-6" />
                          Create account
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full !py-6 flex flex-col items-center gap-2"
                          onClick={() => { setCheckoutChoice('guest'); setShowAuthPrompt(false); }}
                        >
                          <User className="w-6 h-6" />
                          Continue as guest
                        </Button>
                      </div>
                      {checkoutChoice === 'account' && (
                        <p className="text-center text-brand-muted-light text-sm">Complete sign up in the modal, or <button type="button" onClick={() => { setCheckoutChoice('guest'); setShowAuthPrompt(false); }} className="text-brand-accent hover:text-white">continue as guest</button>.</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-brand-muted-light text-sm">Enter your details so we can confirm your booking and send the meeting link.</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">First name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({ ...prev, firstName: value }));
                          if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        placeholder="First name"
                        className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                          formErrors.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                        }`}
                      />
                      {formErrors.firstName && <p className="text-red-400 text-xs mt-1">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">Last name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData((prev) => ({ ...prev, lastName: value }));
                          if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        placeholder="Last name"
                        className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                          formErrors.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                        }`}
                      />
                      {formErrors.lastName && <p className="text-red-400 text-xs mt-1">{formErrors.lastName}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">Email *</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev) => ({ ...prev, email: value }));
                        const error = validateEmail(value);
                        setFormErrors((prev) => ({ ...prev, email: error }));
                      }}
                      onBlur={async (e) => {
                        const val = e.target.value;
                        const error = validateEmail(val);
                        if (error) {
                          setFormErrors((prev) => ({ ...prev, email: error }));
                          return;
                        }
                        const registered = await checkEmailRegistered(val);
                        if (registered) setFormErrors((prev) => ({ ...prev, email: 'This email is already registered. Please sign in to continue.' }));
                      }}
                      placeholder="you@company.com"
                      className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                        formErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                      }`}
                    />
                    {formErrors.email && <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">Phone number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData((prev) => ({ ...prev, phone: value }));
                        if (formErrors.phone) {
                          const error = validatePhone(value);
                          setFormErrors((prev) => ({ ...prev, phone: error }));
                        }
                      }}
                      onBlur={(e) => {
                        const error = validatePhone(e.target.value);
                        if (error) setFormErrors((prev) => ({ ...prev, phone: error }));
                      }}
                      placeholder="07700 900000 or +44 7700 900000"
                      className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                        formErrors.phone ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                      }`}
                    />
                    {formErrors.phone && <p className="text-red-400 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="noCompany"
                      checked={formData.noCompany}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData((prev) => ({ 
                          ...prev, 
                          noCompany: checked, 
                          companyName: checked ? '' : prev.companyName, 
                          companyWebsite: checked ? '' : prev.companyWebsite 
                        }));
                      }}
                      className="rounded border-white/20 bg-white/5 text-brand-accent focus:ring-brand-accent"
                    />
                    <label htmlFor="noCompany" className="text-sm text-brand-muted-light cursor-pointer">I don&apos;t have a company</label>
                  </div>
                  {!formData.noCompany && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">Company name *</label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, companyName: value }));
                            if (formErrors.companyName) setFormErrors((prev) => ({ ...prev, companyName: '' }));
                          }}
                          placeholder="Company name"
                          className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                            formErrors.companyName ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                          }`}
                        />
                        {formErrors.companyName && <p className="text-red-400 text-xs mt-1">{formErrors.companyName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-wider mb-1.5">Company website *</label>
                        <input
                          type="url"
                          value={formData.companyWebsite}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, companyWebsite: value }));
                            if (formErrors.companyWebsite) {
                              const error = validateUrl(value);
                              setFormErrors((prev) => ({ ...prev, companyWebsite: error }));
                            }
                          }}
                          onBlur={(e) => {
                            const error = validateUrl(e.target.value);
                            if (error) setFormErrors((prev) => ({ ...prev, companyWebsite: error }));
                          }}
                          placeholder="example.com"
                          className={`w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none transition-colors ${
                            formErrors.companyWebsite ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                          }`}
                        />
                        {formErrors.companyWebsite && <p className="text-red-400 text-xs mt-1">{formErrors.companyWebsite}</p>}
                      </div>
                    </>
                  )}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-brand-muted-light text-xs mb-3">Your booking: {formatDateLabel(selectedDate)} at {selectedTime} · {SERVICES[selectedService].title}</p>
                    <Button 
                      className="w-full !py-6 text-xl" 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isProcessing && canProceedToPayment && selectedTime) {
                          try { await handlePayment(); } catch (err) {
                            console.error('[BookingFlow] Payment handler error:', err);
                            setIsProcessing(false);
                            redirectUrlRef.current = null;
                          }
                        }
                      }}
                      disabled={isProcessing || !canProceedToPayment || !selectedTime}
                      type="button"
                    >
                      {isProcessing ? 'Processing...' : `Pay ${SERVICES[selectedService].price} & confirm`}
                    </Button>
                  </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ModalPanel>
      </div>
    </>
  );
};

export default BookingFlow;