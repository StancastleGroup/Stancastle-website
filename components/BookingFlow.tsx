import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';
// Fixed the "Button" case-sensitivity issue for Vercel
import { Button } from './ui/Button';

const SERVICES = {
  diagnostic: {
    title: 'Diagnostic Session',
    description: 'A deep dive into your business to identify gaps and opportunities.',
    price: '£159.99',
    duration: '60 MINS'
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
  session: any;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ 
  isOpen, 
  onClose, 
  initialService = 'diagnostic',
  session 
}) => {
  const [step, setStep] = useState<'service' | 'calendar' | 'details' | 'success'>('service');
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });

  const getAvailableSlots = (date: Date) => {
    return [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: true },
    ];
  };

  const handlePayment = async () => {
    if (!selectedService || !selectedTime) return;

    if (!session) {
      setShowAuthPrompt(true);
      return;
    }

    setIsProcessing(true);

    try {
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

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
      window.location.href = url;

    } catch (error) {
      console.error('Payment error:', error);
      alert('There was an error processing your payment. Please try again.');
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
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 md:p-10">
            <AnimatePresence mode="wait">
              {step === 'service' && (
                <motion.div key="service" className="grid md:grid-cols-2 gap-6">
                  {Object.entries(SERVICES).map(([key, s]) => (
                    <button 
                      key={key} 
                      onClick={() => { setSelectedService(key as any); setStep('calendar'); }} 
                      className="text-left p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-fuchsia-500 transition-all"
                    >
                      <h3 className="text-2xl font-bold text-white mb-2">{s.title}</h3>
                      <p className="text-gray-400 text-sm mb-8">{s.description}</p>
                      <span className="text-3xl font-bold text-white">{s.price}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {step === 'calendar' && (
                <motion.div key="calendar" className="flex flex-col md:flex-row gap-10">
                  <div className="flex-grow">
                     <div className="grid grid-cols-7 gap-2">
                       {Array.from({ length: 14 }).map((_, i) => {
                         const d = new Date();
                         d.setDate(d.getDate() + i);
                         return (
                           <button 
                            key={i} 
                            onClick={() => setSelectedDate(d)} 
                            className={`h-10 rounded-lg text-sm ${d.toDateString() === selectedDate.toDateString() ? 'bg-fuchsia-500 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                           >
                             {d.getDate()}
                           </button>
                         );
                       })}
                     </div>
                  </div>
                  <div className="w-full md:w-64">
                    <div className="grid grid-cols-1 gap-3">
                      {getAvailableSlots(selectedDate).map((slot, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedTime(slot.time)} 
                          className={`py-3 px-4 rounded-xl text-sm font-bold border ${selectedTime === slot.time ? 'bg-fuchsia-500 border-fuchsia-500 text-white' : 'border-white/5 text-gray-300'}`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    <Button className="mt-8 w-full" disabled={!selectedTime} onClick={() => setStep('details')}>Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div key="details" className="grid lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-6">
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      placeholder="Email" 
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white" 
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                      <Button className="w-full !py-6 text-xl" onClick={handlePayment} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : `Pay ${SERVICES[selectedService].price}`}
                      </Button>
                    </div>
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