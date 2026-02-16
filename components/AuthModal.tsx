import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, Building2, User, ArrowRight, AlertCircle, Phone, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { validateEmail, validatePhone, validateUrl } from '../lib/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultView = 'signin' }) => {
  const [view, setView] = useState<'signin' | 'signup'>(defaultView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [noCompany, setNoCompany] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPasswordError(null);
    setFieldErrors({});

    try {
      if (view === 'signup') {
        const errors: Record<string, string> = {};
        if (!firstName.trim()) errors.firstName = 'First name is required';
        if (!lastName.trim()) errors.lastName = 'Last name is required';
        const emailErr = validateEmail(email);
        if (emailErr) errors.email = emailErr;
        const phoneErr = validatePhone(phone);
        if (phoneErr) errors.phone = phoneErr;
        if (!noCompany) {
          if (!company.trim()) errors.company = 'Company name is required';
          const urlErr = validateUrl(companyWebsite, true);
          if (urlErr) errors.companyWebsite = urlErr;
        }
        if (password !== confirmPassword) {
          setPasswordError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setPasswordError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              company: noCompany ? null : company.trim(),
              phone: phone.trim() || null,
              company_website: noCompany ? null : (companyWebsite.trim() ? (companyWebsite.trim().includes('://') ? companyWebsite.trim() : `https://${companyWebsite.trim()}`) : null),
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data?.user?.id) {
          const website = noCompany ? null : (companyWebsite.trim() ? (companyWebsite.trim().includes('://') ? companyWebsite.trim() : `https://${companyWebsite.trim()}`) : null);
          await supabase.from('profiles').update({
            phone: phone.trim() || null,
            company_website: website,
            company: noCompany ? null : company.trim(),
          }).eq('id', data.user.id);
        }
      } else {
        const emailErr = validateEmail(email);
        if (emailErr) {
          setFieldErrors({ email: emailErr });
          setLoading(false);
          return;
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'An error occurred';
      if (view === 'signup' && (msg.includes('already been registered') || msg.includes('User already registered') || msg.includes('already exists'))) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0f0f13] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif font-bold text-white">
              {view === 'signin' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-brand-muted-light" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                      <input 
                        required 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Last Name</label>
                    <input 
                      required 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="authNoCompany"
                    checked={noCompany}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNoCompany(checked);
                      if (checked) {
                        setCompany('');
                        setCompanyWebsite('');
                        setFieldErrors((prev) => ({ ...prev, company: '', companyWebsite: '' }));
                      }
                    }}
                    className="rounded border-white/20 bg-white/5 text-brand-accent focus:ring-brand-accent"
                  />
                  <label htmlFor="authNoCompany" className="text-sm text-brand-muted-light cursor-pointer">I don&apos;t have a company</label>
                </div>
                {!noCompany && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Company *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                        <input 
                          type="text" 
                          value={company}
                          onChange={(e) => { setCompany(e.target.value); if (fieldErrors.company) setFieldErrors((p) => ({ ...p, company: '' })); }}
                          onBlur={() => setFieldErrors((p) => ({ ...p, company: !company.trim() ? 'Company name is required' : '' }))}
                          className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${fieldErrors.company ? 'border-red-500/50' : 'border-white/10 focus:border-brand-accent'}`}
                          placeholder="Stancastle Ltd"
                        />
                      </div>
                      {fieldErrors.company && <p className="text-red-400 text-xs mt-1">{fieldErrors.company}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Company website *</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                        <input 
                          type="text" 
                          value={companyWebsite}
                          onChange={(e) => { setCompanyWebsite(e.target.value); if (fieldErrors.companyWebsite) setFieldErrors((p) => ({ ...p, companyWebsite: '' })); }}
                          onBlur={() => setFieldErrors((p) => ({ ...p, companyWebsite: validateUrl(companyWebsite, true) }))}
                          className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${fieldErrors.companyWebsite ? 'border-red-500/50' : 'border-white/10 focus:border-brand-accent'}`}
                          placeholder="example.com"
                        />
                      </div>
                      {fieldErrors.companyWebsite && <p className="text-red-400 text-xs mt-1">{fieldErrors.companyWebsite}</p>}
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' })); }}
                      onBlur={() => setFieldErrors((p) => ({ ...p, phone: validatePhone(phone) }))}
                      className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${fieldErrors.phone ? 'border-red-500/50' : 'border-white/10 focus:border-brand-accent'}`}
                      placeholder="07700 900000"
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' })); }}
                  onBlur={() => setFieldErrors((p) => ({ ...p, email: validateEmail(email) }))}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${fieldErrors.email ? 'border-red-500/50' : 'border-white/10 focus:border-brand-accent'}`}
                  placeholder="name@company.com"
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${
                    passwordError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                  }`}
                  placeholder="••••••••"
                  minLength={view === 'signup' ? 6 : undefined}
                />
              </div>
              {view === 'signup' && password && password.length < 6 && (
                <p className="text-red-400 text-xs mt-1">Password must be at least 6 characters</p>
              )}
            </div>

            {view === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted-light uppercase ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-brand-muted" />
                  <input 
                    required 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onBlur={() => {
                      if (password !== confirmPassword && confirmPassword) {
                        setPasswordError('Passwords do not match');
                      }
                    }}
                    className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-colors ${
                      passwordError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {passwordError && <p className="text-red-400 text-xs mt-1">{passwordError}</p>}
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Processing...' : view === 'signin' ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-brand-muted-light text-sm">
              {view === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setView(view === 'signin' ? 'signup' : 'signin');
                  setPasswordError(null);
                  setConfirmPassword('');
                  setFieldErrors({});
                  setError(null);
                }}
                className="text-brand-accent font-bold hover:text-white transition-colors"
              >
                {view === 'signin' ? 'Register Now' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};