import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { getBookableDates, getTimeSlotsForDate, formatDateLabel } from '../lib/availability';

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
      return Object.keys(updates).length > 0 ? { ...f, ...updates } : f;
    });
  }, [profile?.email, profile?.first_name, profile?.last_name, profile?.company]);

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

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    // UK phone: +44, 0, or international format. Remove spaces/dashes for validation
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+44|0|44)?[1-9]\d{8,9}$/;
    if (!phoneRegex.test(cleaned)) return 'Please enter a valid UK phone number';
    return '';
  };

  const validateUrl = (url: string): string => {
    if (!url.trim()) return 'Company website is required';
    try {
      const urlObj = new URL(url.trim());
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'Website must start with http:// or https://';
      }
      return '';
    } catch {
      return 'Please enter a valid website URL (e.g., https://example.com)';
    }
  };

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
      const urlError = validateUrl(formData.companyWebsite);
      if (urlError) errors.companyWebsite = urlError;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canProceedToPayment =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email?.trim() &&
    formData.phone.trim() &&
    (formData.noCompany || formData.companyName.trim());

  const handlePayment = async () => {
    if (!selectedService || !selectedTime) return;
    
    // Validate form data types
    if (!validateForm()) {
      return;
    }
    
    if (!session) {
      alert('Please sign in first to schedule a call. Click "Sign In" in the navigation menu to continue.');
      return;
    }

    setIsProcessing(true);

    try {
      // Refresh session so the access_token is valid (avoids 401 from expired JWT)
      const { data: { session: freshSession }, error: refreshError } = await supabase.auth.refreshSession();
      const tokenSession = freshSession ?? session;
      if (refreshError || !tokenSession?.access_token) {
        setShowAuthPrompt(true);
        alert('Your session expired. Please sign in again.');
        setIsProcessing(false);
        return;
      }

      const dateStr = selectedDate?.toISOString().split('T')[0];
      
      // CRITICAL: Check if slot is still available before booking (prevents double-booking race condition)
      const { data: existingBooking, error: checkError } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', dateStr)
        .eq('time', selectedTime)
        .in('status', ['pending', 'paid', 'booked'])
        .maybeSingle();
      
      if (checkError) {
        console.error('[BookingFlow] Error checking availability:', checkError);
        throw new Error('Failed to verify slot availability. Please try again.');
      }
      
      if (existingBooking) {
        alert(`Sorry, this time slot (${dateStr} at ${selectedTime}) has just been booked by someone else. Please select another time.`);
        setIsProcessing(false);
        // Refresh availability for this date to update the UI
        const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        // Force refresh by clearing this month's availability
        setAvailabilityByDate((prev) => {
          const updated = { ...prev };
          const monthStart = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-01`;
          const monthEnd = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-31`;
          Object.keys(updated).forEach((dateStr) => {
            if (dateStr >= monthStart && dateStr <= monthEnd) {
              delete updated[dateStr];
            }
          });
          return updated;
        });
        // Trigger a fresh fetch
        fetchAvailabilityForMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        return;
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: tokenSession.user.id,
          service_type: selectedService,
          date: dateStr,
          time: selectedTime,
          status: 'pending',
          first_name: formData.firstName.trim() || profile?.first_name,
          last_name: formData.lastName.trim() || profile?.last_name,
          email: formData.email?.trim() || profile?.email || tokenSession.user.email,
          phone: formData.phone.trim() || null,
          company_name: formData.noCompany ? null : (formData.companyName.trim() || profile?.company || null),
          company_website: formData.noCompany ? null : (formData.companyWebsite.trim() || null),
          no_company: formData.noCompany,
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      const customerEmail = formData.email?.trim() || profile?.email || tokenSession.user.email!;
      // Call with anon key only (no JWT). Function has verify_jwt = false and validates appointment server-side.
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          service_type: selectedService,
          user_id: tokenSession.user.id,
          appointment_id: appointment.id,
          success_url: `${window.location.origin}?booking=success`,
          cancel_url: `${window.location.origin}?booking=cancelled`,
          customer_email: customerEmail || undefined,
        }),
      });

      const checkoutData = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setShowAuthPrompt(true);
          alert('Session expired. Please sign in again and try paying once more.');
          setIsProcessing(false);
          return;
        }
        throw new Error(checkoutData?.error || checkoutData?.message || 'Payment initialization failed');
      }

      const url = checkoutData?.url;
      if (url) window.location.href = url;
      else throw new Error(checkoutData?.error || 'No checkout URL returned');
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AuthModal 
        isOpen={showAuthPrompt} 
        onClose={() => setShowAuthPrompt(false)} 
        defaultView="signup" 
      />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#0f0f13] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">
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
                      className="text-left p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-fuchsia-500 transition-all"
                    >
                      <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-brand-muted-light text-sm mb-8">{s.description}</p>
                      <span className="text-3xl font-bold text-white">{s.price}</span>
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
                  <p className="text-brand-muted-light text-sm">A few details so we can confirm your booking and send the meeting link.</p>
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
                        if (formErrors.email) {
                          const error = validateEmail(value);
                          setFormErrors((prev) => ({ ...prev, email: error }));
                        }
                      }}
                      onBlur={(e) => {
                        const error = validateEmail(e.target.value);
                        if (error) setFormErrors((prev) => ({ ...prev, email: error }));
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
                          placeholder="https://example.com"
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePayment();
                      }}
                      disabled={isProcessing || !canProceedToPayment || !selectedTime}
                      type="button"
                    >
                      {isProcessing 
                        ? 'Processing...' 
                        : !session 
                          ? `Sign in to pay ${SERVICES[selectedService].price}`
                          : `Pay ${SERVICES[selectedService].price} & confirm`
                      }
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default BookingFlow;