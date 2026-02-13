import React, { useState } from 'react';
import { Section } from './ui/Section';
import { Button } from './ui/Button';
import { Phone, Clock, CheckCircle2 } from 'lucide-react';

export const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    // Simulate API call
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <Section id="contact" className="pb-20 md:pb-28 bg-gradient-to-b from-brand-dark to-[#050508]">
      <div className="max-w-6xl mx-auto">
        {/* Section title — centered */}
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight tracking-tight text-center">
          Stop Paying For <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-glow">
            Empty Promises.
          </span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side: Copy & Phone CTA */}
          <div>
            <p className="text-lg text-brand-muted-light mb-8 md:mb-10 leading-relaxed font-light">
              If you're serious about building your business with structure and clarity, speak to us. 
              We only work with companies where we believe we can add significant value.
            </p>

            <div className="space-y-6">
              {/* Phone Highlight */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity duration-500" />
                <a 
                  href="tel:02080642496"
                  className="relative block bg-brand-card border border-white/10 rounded-2xl p-8 hover:border-brand-accent/50 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-brand-accent/10 rounded-full text-brand-accent">
                      <Phone className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Direct Sales Line</span>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-fuchsia-200 transition-colors">
                    020 8064 2496
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-muted-light">
                    <div className="w-2 h-2 rounded-full bg-green-500 md:animate-pulse" />
                    Available now for strategic inquiries
                  </div>
                </a>
              </div>

              {/* Opening Hours */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-4">
                <Clock className="w-6 h-6 text-brand-muted mt-1" />
                <div>
                  <h4 className="text-white font-bold mb-1">Opening Times</h4>
                  <p className="text-brand-muted-light text-sm"><span className="text-white font-medium">Monday - Saturday:</span> 8:00am - 6:00pm</p>
                  <p className="text-brand-muted text-sm"><span className="text-brand-muted-light font-medium">Sunday:</span> Closed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-brand-accent/5 rounded-3xl blur-xl" />
            
            {status === 'success' ? (
              <div className="relative bg-[#0f0f13] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl h-[500px] flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">Message Sent</h3>
                 <p className="text-brand-muted-light">Our strategic team will review your enquiry and contact you shortly.</p>
                 <Button className="mt-8" variant="outline" onClick={() => setStatus('idle')}>Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative bg-[#0f0f13] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
                <h3 className="text-2xl font-serif font-bold text-white mb-6">Send an Enquiry</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-widest mb-2 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@company.com"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="07700 900000"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-muted-light uppercase tracking-widest mb-2 ml-1">Tell us about your business</label>
                    <textarea 
                      rows={4}
                      placeholder="Current revenue, biggest bottleneck, etc..."
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-accent transition-colors resize-none"
                    ></textarea>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-2" 
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending...' : 'Submit Enquiry'}
                  </Button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </Section>
  );
};