import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { supabaseUrl } from '../lib/supabase';

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl bg-brand-card border border-white/10 text-white placeholder:text-brand-muted focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-colors';
const TEXTAREA_CLASS = INPUT_CLASS + ' resize-y min-h-[80px]';
const LABEL_CLASS = 'block text-sm font-medium text-white mb-2';

/** All answer keys we send (excluding name, email, phone which are top-level). */
const ANSWER_IDS = [
  'business_one_sentence',
  'how_long_operating',
  'bet_on_problem',
  'confidence_1_5',
  'what_tried_to_fix',
  'cost_financial_score',
  'cost_financial_explanation',
  'cost_time_score',
  'cost_time_explanation',
  'cost_mental_score',
  'cost_mental_explanation',
  'cost_opportunity_score',
  'cost_opportunity_explanation',
  'customer_journey',
  'top_3_customers',
  'biggest_waste',
  'business_structure',
  'decision_nobody_make',
  'why_customers_choose',
  'trajectory_12_months',
  'vision_gap_score',
  'vision_gap',
  'afraid_confirm',
  'what_would_stop_you',
] as const;

const initialAnswers = () =>
  ANSWER_IDS.reduce((acc, id) => ({ ...acc, [id]: '' }), {} as Record<string, string>);

export const PrepPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatus('submitting');

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/submit-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Not provided',
          email: email.trim() || 'Not provided',
          phone: phone.trim() || 'Not provided',
          answers: Object.fromEntries(ANSWER_IDS.map((id) => [id, answers[id]?.trim() ?? ''])),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(data?.error ?? `Request failed (${res.status})`);
        return;
      }
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark text-brand-text font-sans antialiased">
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 max-w-2xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-brand-muted hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Stancastle
        </a>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">
            The Stancastle Pre-Session Diagnostic
          </h1>
          <p className="text-brand-muted-light mb-2">
            Estimated time: 12–15 minutes. Complete honesty gives you maximum value from your session.
          </p>
          <p className="text-brand-muted text-sm mb-10">
            Stancastle Ltd | contact@stancastle.com
          </p>

          {status === 'success' ? (
            <div className="bg-brand-card border border-white/10 rounded-2xl p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Thank you</h2>
              <p className="text-brand-muted-light">
                Your answers will be reviewed in full before your session. We will arrive prepared.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact info */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Your details</h2>
                <div>
                  <label htmlFor="name" className={LABEL_CLASS}>Full name</label>
                  <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jane Smith" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="email" className={LABEL_CLASS}>Email address (to match your booking)</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="phone" className={LABEL_CLASS}>Phone number</label>
                  <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 07xxx xxxxxx" className={INPUT_CLASS} />
                </div>
              </div>

              {/* Q1 */}
              <div>
                <label htmlFor="business_one_sentence" className={LABEL_CLASS}>
                  1. Describe what your business does in one sentence—as if explaining to a competitor, not a customer.
                </label>
                <p className="text-brand-muted text-xs mb-2">(Not your pitch. Not your mission statement. The mechanical reality of what you do and who pays you for it.)</p>
                <textarea id="business_one_sentence" value={answers.business_one_sentence} onChange={(e) => setAnswer('business_one_sentence', e.target.value)} rows={3} className={TEXTAREA_CLASS} />
              </div>

              {/* Q2 */}
              <div>
                <label htmlFor="how_long_operating" className={LABEL_CLASS}>
                  2. How long has the business been operating, and at what point did it stop feeling like it was working the way you expected?
                </label>
                <textarea id="how_long_operating" value={answers.how_long_operating} onChange={(e) => setAnswer('how_long_operating', e.target.value)} rows={3} className={TEXTAREA_CLASS} />
              </div>

              {/* Q3 */}
              <div>
                <label htmlFor="bet_on_problem" className={LABEL_CLASS}>
                  3. If you had to bet your own money on what is genuinely causing your biggest business problem right now, what would you bet on—and how confident are you?
                </label>
                <textarea id="bet_on_problem" value={answers.bet_on_problem} onChange={(e) => setAnswer('bet_on_problem', e.target.value)} rows={2} className={TEXTAREA_CLASS} />
                <p className="text-brand-muted text-xs mt-2 mb-1">Rate your confidence: 1 (guessing) → 5 (certain)</p>
                <select
                  value={answers.confidence_1_5}
                  onChange={(e) => setAnswer('confidence_1_5', e.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">Select…</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Q4 */}
              <div>
                <label htmlFor="what_tried_to_fix" className={LABEL_CLASS}>
                  4. What have you already tried to fix this problem? List everything—including what partially worked.
                </label>
                <textarea id="what_tried_to_fix" value={answers.what_tried_to_fix} onChange={(e) => setAnswer('what_tried_to_fix', e.target.value)} rows={4} className={TEXTAREA_CLASS} />
              </div>

              {/* Q5 - Cost table */}
              <div>
                <label className={LABEL_CLASS}>
                  5. On a scale of 1–10, how much is this problem costing you—in money, time, mental energy, and opportunity? Break it down.
                </label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-white/10 rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-brand-card">
                        <th className="text-left p-3 text-white font-medium w-1/3"></th>
                        <th className="text-left p-3 text-white font-medium">Score (1–10)</th>
                        <th className="text-left p-3 text-white font-medium">Brief explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {[
                        { row: 'Financial cost', scoreId: 'cost_financial_score', explId: 'cost_financial_explanation' },
                        { row: 'Time cost', scoreId: 'cost_time_score', explId: 'cost_time_explanation' },
                        { row: 'Mental/emotional cost', scoreId: 'cost_mental_score', explId: 'cost_mental_explanation' },
                        { row: 'Opportunity cost', scoreId: 'cost_opportunity_score', explId: 'cost_opportunity_explanation' },
                      ].map(({ row, scoreId, explId }) => (
                        <tr key={row} className="bg-brand-card/50">
                          <td className="p-3 text-brand-muted-light">{row}</td>
                          <td className="p-2">
                            <select value={answers[scoreId]} onChange={(e) => setAnswer(scoreId, e.target.value)} className={INPUT_CLASS + ' py-2 min-w-[80px]'}>
                              <option value="">—</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <option key={n} value={String(n)}>{n}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="text" value={answers[explId]} onChange={(e) => setAnswer(explId, e.target.value)} placeholder="Brief explanation" className={INPUT_CLASS + ' py-2'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Q6 */}
              <div>
                <label htmlFor="customer_journey" className={LABEL_CLASS}>
                  6. Walk me through exactly how a customer finds you, decides to buy, pays you, receives your product or service, and comes back again. Be specific about where this process breaks or feels uncertain.
                </label>
                <textarea id="customer_journey" value={answers.customer_journey} onChange={(e) => setAnswer('customer_journey', e.target.value)} rows={4} className={TEXTAREA_CLASS} />
              </div>

              {/* Q7 */}
              <div>
                <label htmlFor="top_3_customers" className={LABEL_CLASS}>
                  7. Who are your top 3 customers or client types by value—and what would happen to your business if you lost all of them tomorrow?
                </label>
                <textarea id="top_3_customers" value={answers.top_3_customers} onChange={(e) => setAnswer('top_3_customers', e.target.value)} rows={3} className={TEXTAREA_CLASS} />
              </div>

              {/* Q8 */}
              <div>
                <label htmlFor="biggest_waste" className={LABEL_CLASS}>
                  8. Without looking at any data, what do you believe your biggest source of wasted money or time is right now?
                </label>
                <textarea id="biggest_waste" value={answers.biggest_waste} onChange={(e) => setAnswer('biggest_waste', e.target.value)} rows={2} className={TEXTAREA_CLASS} />
              </div>

              {/* Q9 */}
              <div>
                <label htmlFor="business_structure" className={LABEL_CLASS}>
                  9. Describe your business structure in words. Who does what, who reports to whom, and which roles only exist because you personally haven’t let go of them yet?
                </label>
                <textarea id="business_structure" value={answers.business_structure} onChange={(e) => setAnswer('business_structure', e.target.value)} rows={4} className={TEXTAREA_CLASS} />
              </div>

              {/* Q10 */}
              <div>
                <label htmlFor="decision_nobody_make" className={LABEL_CLASS}>
                  10. What decision can nobody in your business make without you—and should they be able to?
                </label>
                <textarea id="decision_nobody_make" value={answers.decision_nobody_make} onChange={(e) => setAnswer('decision_nobody_make', e.target.value)} rows={2} className={TEXTAREA_CLASS} />
              </div>

              {/* Q11 */}
              <div>
                <label htmlFor="why_customers_choose" className={LABEL_CLASS}>
                  11. Why do customers choose you over alternatives—and how do you actually know this is true?
                </label>
                <textarea id="why_customers_choose" value={answers.why_customers_choose} onChange={(e) => setAnswer('why_customers_choose', e.target.value)} rows={3} className={TEXTAREA_CLASS} />
              </div>

              {/* Q12 */}
              <div>
                <label htmlFor="trajectory_12_months" className={LABEL_CLASS}>
                  12. Describe the trajectory of your business over the last 12 months. Not in numbers—in momentum. Is it accelerating, steady, slowing, or stalling? Then tell me: what changed, or what didn’t change, that caused this trajectory?
                </label>
                <textarea id="trajectory_12_months" value={answers.trajectory_12_months} onChange={(e) => setAnswer('trajectory_12_months', e.target.value)} rows={4} className={TEXTAREA_CLASS} />
              </div>

              {/* Q13 */}
              <div>
                <label htmlFor="vision_gap" className={LABEL_CLASS}>
                  13. What is the version of this business you originally envisioned—and how far is the current reality from that vision?
                </label>
                <p className="text-brand-muted text-xs mb-2">Score the gap: 1 (completely off track) → 10 (exactly where I planned). Then explain what created the gap.</p>
                <select value={answers.vision_gap_score} onChange={(e) => setAnswer('vision_gap_score', e.target.value)} className={INPUT_CLASS + ' mb-3'}>
                  <option value="">Select score (1–10)…</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
                <textarea id="vision_gap" value={answers.vision_gap} onChange={(e) => setAnswer('vision_gap', e.target.value)} rows={3} placeholder="What created the gap?" className={TEXTAREA_CLASS} />
              </div>

              {/* Q14 */}
              <div>
                <label htmlFor="afraid_confirm" className={LABEL_CLASS}>
                  14. What are you afraid this session will confirm?
                </label>
                <textarea id="afraid_confirm" value={answers.afraid_confirm} onChange={(e) => setAnswer('afraid_confirm', e.target.value)} rows={2} className={TEXTAREA_CLASS} />
              </div>

              {/* Q15 */}
              <div>
                <label htmlFor="what_would_stop_you" className={LABEL_CLASS}>
                  15. If this session gives you complete clarity on what to do next—what would stop you from actually doing it?
                </label>
                <textarea id="what_would_stop_you" value={answers.what_would_stop_you} onChange={(e) => setAnswer('what_would_stop_you', e.target.value)} rows={2} className={TEXTAREA_CLASS} />
              </div>

              <p className="text-brand-muted text-sm">Thank you for completing this. Your answers will be reviewed in full before your session. We will arrive prepared.</p>

              {status === 'error' && <p className="text-red-400 text-sm">{errorMessage}</p>}

              <div className="pt-4">
                <Button type="submit" disabled={status === 'submitting'} variant="primary" size="lg" className="w-full sm:w-auto">
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submit answers
                    </>
                  ) : (
                    'Submit answers'
                  )}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
};
