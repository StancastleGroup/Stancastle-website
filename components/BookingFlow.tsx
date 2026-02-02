import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, CreditCard, CheckCircle2, ArrowRight, Building2, Globe, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ndvjpqubhjrsgjbkuxrh.supabase.co';

type Step = 'service' | 'calendar' | 'details' | 'success';

interface Slot {
  time: string;
  available: boolean;
}

const SERVICES = {
  diagnostic: {
    id: 'diagnostic',
    title: 'Diagnostic Session',
    duration: '90 Minutes',
    price: '£159.99',
    type: 'One-time payment',
    description: 'Intensive strategic deep-dive with a 30-day action plan.'
  },
  partner: {
    id: 'partner',
    title: 'Partner Programme',
    duration: 'Ongoing',
    price: '£749.99',
    type: 'Monthly subscription',
    description: 'Acting Strategic Leadership for operational restructuring and growth.'
  }
};

export const BookingFlow: React.FC<{ isOpen: boolean; onClose: () => void; initialService?: 'diagnostic' | 'partner' }> = ({ isOpen, onClose, initialService }) => {
  const { session, profile } = useAuth();
  const [step, setStep] = useState<Step>(initialService ? 'calendar' : 'service');
  const [selectedService, setSelectedService] = useState<keyof typeof SERVICES | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', company: '', website: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        company: profile.company || ''
      }));
    }
  }, [profile]);

  // Handle re-renders or changes to initialService
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      setStep('calendar');
    }
  }, [initialService]);

  const getAvailableSlots = (date: Date): Slot[] => {
    const day = date.getDay();
    const slots: Slot[] = [];
    const startTime = 8;
    const endTime = 17;

    for (let h = startTime; h <= endTime; h += 1.5) {
      const hour = Math.floor(h);
      const minutes = (h % 1) * 60 === 30 ? '30' : '00';
      const timeStr = `${hour}:${minutes}`;
      const timeVal = h;
      let isAvailable = true;

      if (day === 0) isAvailable = false;
      if (day === 3 && timeVal >= 10) isAvailable = false;
      if (day === 4 && timeVal < 11) isAvailable = false;
      if (day === 5 && timeVal >= 10) isAvailable = false;
      if (day === 6 && timeVal !== 17) isAvailable = false;

      slots.push({ time: timeStr, available: isAvailable });
    }
    return slots;
  };

  const handlePayment = async () => {
    // Safety check: ensure service/time are selected
    if (!selectedService || !selectedTime) return;
  
    // 1. AUTO-LOGIN TRIGGER
    // If not logged in, show the login prompt immediately
    if (!session) {
      setShowAuthPrompt(true);
      return;
    }
  
    setIsProcessing(true);
  
    try {
      // 2. Create appointment record first
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: session.user.id,
          service_type: selectedService,
          date: selectedDate?.toISOString().split('T')[0],
          time: selectedTime,
          status: 'pending',
        })
        .select()
        .single();
  
      if (appointmentError) throw appointmentError;
  
      // 3. Create Stripe Checkout (NOW WITH HEADERS FIXED)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // The "Guest Pass" header that was missing:
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            service_type: selectedService,
            user_id: session.user.id,
            appointment_id: appointment.id,
            success_url: `${window.location.origin}?booking=success`,
            cancel_url: `${window.location.origin}?booking=cancelled`,
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }
  
      const { url } = await response.json();
  
      // 4. Redirect to Stripe
      window.location.href = url;
  
    } catch (error) {
      console.error('Payment error:', error);
      alert('There was an error processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  };

  if (!isOpen) return null;

  return (
    <>
      <AuthModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} defaultView="signup" />
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
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
              <p className="text-sm text-gray-500 mt-1">
                {step === 'calendar' && 'UK Time (GMT/BST Automatically Adjusted)'}
                {step === 'details' && selectedService && `Booking ${SERVICES[selectedService].title}`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              {step === 'service' && (
                <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid md:grid-cols-2 gap-6">
                  {(Object.keys(SERVICES) as Array<keyof typeof SERVICES>).map((key) => {
                    const s = SERVICES[key];
                    return (
                      <button key={key} onClick={() => { setSelectedService(key); setStep('calendar'); }} className={`text-left p-8 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${selectedService === key ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">{s.duration}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">{s.description}</p>
                        <div className="flex items-baseline gap-2 mt-auto">
                          <span className="text-3xl font-bold text-white">{s.price}</span>
                        </div>
                        <ArrowRight className="absolute bottom-6 right-6 w-5 h-5 text-fuchsia-500 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {step === 'calendar' && (
                <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col md:flex-row gap-10">
                  <div className="flex-grow">
                     <div className="flex items-center justify-between mb-6">
                        <h4 className="text-white font-bold flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-fuchsia-500" /> Select Date
                        </h4>
                     </div>
                     <div className="grid grid-cols-7 gap-2">
                       {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                         <div key={i} className="text-center text-[10px] text-gray-500 font-bold mb-2">{d}</div>
                       ))}
                       {Array.from({ length: 14 }).map((_, i) => {
                         const d = new Date();
                         d.setDate(d.getDate() + i);
                         const isSelected = d.toDateString() === selectedDate.toDateString();
                         const isSun = d.getDay() === 0;
                         return (
                           <button key={i} disabled={isSun} onClick={() => setSelectedDate(d)} className={`h-10 rounded-lg text-sm font-medium transition-all ${isSelected ? 'bg-fuchsia-500 text-white' : isSun ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:bg-white/5'}`}>
                             {d.getDate()}
                           </button>
                         );
                       })}
                     </div>
                  </div>

                  <div className="w-full md:w-64 flex flex-col">
                    <h4 className="text-white font-bold flex items-center gap-2 mb-6">
                      <Clock className="w-4 h-4 text-fuchsia-500" /> Available Times
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 overflow-y-auto max-h-[300px] pr-2">
                      {getAvailableSlots(selectedDate).map((slot, idx) => (
                        <button key={idx} disabled={!slot.available} onClick={() => setSelectedTime(slot.time)} className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${!slot.available ? 'border-white/5 text-gray-700 opacity-50 cursor-not-allowed bg-transparent' : selectedTime === slot.time ? 'bg-fuchsia-500 border-fuchsia-500 text-white shadow-lg' : 'border-white/5 bg-white/[0.03] text-gray-300 hover:border-white/20'}`}>
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    <Button className="mt-8 w-full" disabled={!selectedTime} onClick={() => setStep('details')}>Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 'details' && selectedService && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">First Name</label>
                        <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="John" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Last Name</label>
                        <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="founder@company.com" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500" />
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-8">
                      <div className="flex justify-between mb-8">
                        <span className="text-gray-400 text-sm">{SERVICES[selectedService].title}</span>
                        <span className="text-white font-bold">{SERVICES[selectedService].price}</span>
                      </div>
                      <Button className="w-full !py-6 text-xl" onClick={handlePayment} disabled={isProcessing || !formData.email}>
                        {isProcessing ? 'Processing...' : `Pay ${SERVICES[selectedService].price}`}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="w-24 h-24 bg-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                     <CheckCircle2 className="w-14 h-14 text-fuchsia-500" />
                  </div>
                  <h3 className="text-4xl font-serif font-bold text-white mb-4 italic">It's Official.</h3>
                  <Button variant="outline" className="px-12" onClick={onClose}>Close Window</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};