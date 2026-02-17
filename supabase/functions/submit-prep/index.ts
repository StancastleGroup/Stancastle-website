import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TO_EMAIL = 'contact@stancastle.com';
// From address must be a verified domain in Resend (e.g. contact@stancastle.com). Resend cannot send from @gmail.com.
const FROM_EMAIL = Deno.env.get('PREP_FROM_EMAIL') || Deno.env.get('BOOKING_FROM_EMAIL') || 'Stancastle <onboarding@resend.dev>';

/** Human-readable labels for answer keys in the email (The Stancastle Pre-Session Diagnostic). */
const ANSWER_LABELS: Record<string, string> = {
  business_one_sentence: '1. What your business does (one sentence)',
  how_long_operating: '2. How long operating & when it stopped feeling right',
  bet_on_problem: '3. What you’d bet is causing your biggest problem',
  confidence_1_5: '3. Confidence (1–5)',
  what_tried_to_fix: '4. What you’ve already tried to fix it',
  cost_financial_score: '5. Cost – Financial (score 1–10)',
  cost_financial_explanation: '5. Cost – Financial (explanation)',
  cost_time_score: '5. Cost – Time (score 1–10)',
  cost_time_explanation: '5. Cost – Time (explanation)',
  cost_mental_score: '5. Cost – Mental/emotional (score 1–10)',
  cost_mental_explanation: '5. Cost – Mental/emotional (explanation)',
  cost_opportunity_score: '5. Cost – Opportunity (score 1–10)',
  cost_opportunity_explanation: '5. Cost – Opportunity (explanation)',
  customer_journey: '6. How a customer finds you → buys → receives → returns',
  top_3_customers: '7. Top 3 customers by value & if you lost them',
  biggest_waste: '8. Biggest source of wasted money or time',
  business_structure: '9. Business structure – who does what, who reports to whom',
  decision_nobody_make: '10. Decision nobody can make without you – should they?',
  why_customers_choose: '11. Why customers choose you – and how you know it’s true',
  trajectory_12_months: '12. Trajectory over last 12 months (momentum) & what changed',
  vision_gap_score: '13. Gap between vision and reality (score 1–10)',
  vision_gap: '13. What created the gap',
  afraid_confirm: '14. What you’re afraid this session will confirm',
  what_would_stop_you: '15. What would stop you from doing it',
};

/** Keys that are part of the cost table (Q5) – we render them as a small table in the email. */
const COST_ROW_KEYS = [
  { score: 'cost_financial_score', expl: 'cost_financial_explanation', label: 'Financial cost' },
  { score: 'cost_time_score', expl: 'cost_time_explanation', label: 'Time cost' },
  { score: 'cost_mental_score', expl: 'cost_mental_explanation', label: 'Mental/emotional cost' },
  { score: 'cost_opportunity_score', expl: 'cost_opportunity_explanation', label: 'Opportunity cost' },
] as const;

const COST_IDS = new Set(COST_ROW_KEYS.flatMap((r) => [r.score, r.expl]));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const answers = body?.answers && typeof body.answers === 'object' ? body.answers : {};

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('submit-prep: RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build cost table (Q5) for email
    let costTableHtml = '';
    const hasAnyCost = COST_ROW_KEYS.some(
      (r) => (answers[r.score] ?? '').toString().trim() !== '' || (answers[r.expl] ?? '').toString().trim() !== ''
    );
    if (hasAnyCost) {
      const costRows = COST_ROW_KEYS.map(
        (r) =>
          `<tr><td style="padding:6px 10px; border:1px solid #eee;">${escapeHtml(r.label)}</td><td style="padding:6px 10px; border:1px solid #eee;">${escapeHtml(String(answers[r.score] ?? ''))}</td><td style="padding:6px 10px; border:1px solid #eee;">${escapeHtml(String(answers[r.expl] ?? ''))}</td></tr>`
      ).join('');
      costTableHtml = `
        <p style="margin-top:12px;"><strong>Question 5 – Cost breakdown</strong></p>
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <thead><tr style="background:#f5f5f5;"><th style="padding:6px 10px; border:1px solid #eee; text-align:left;"></th><th style="padding:6px 10px; border:1px solid #eee;">Score (1-10)</th><th style="padding:6px 10px; border:1px solid #eee;">Explanation</th></tr></thead>
          <tbody>${costRows}</tbody>
        </table>
      `;
    }

    // All other answers (excluding cost table keys to avoid duplication)
    const otherRows = Object.entries(answers)
      .filter(([key, v]) => !COST_IDS.has(key as keyof typeof COST_IDS) && v != null && String(v).trim() !== '')
      .map(([key, value]) => {
        const label = ANSWER_LABELS[key] || key.replace(/_/g, ' ');
        return `<tr><td style="padding:8px 12px; border-bottom:1px solid #eee; vertical-align:top;"><strong>${escapeHtml(label)}</strong></td><td style="padding:8px 12px; border-bottom:1px solid #eee;">${escapeHtml(String(value))}</td></tr>`;
      })
      .join('');

    const html = `
      <p><strong>Pre-Session Diagnostic submitted</strong></p>
      <p><strong>Name:</strong> ${escapeHtml(name || '—')}<br><strong>Email:</strong> ${escapeHtml(email || '—')}<br><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
      ${costTableHtml}
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        <tbody>${otherRows}</tbody>
      </table>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email || undefined,
        subject: `Pre-Session Diagnostic from ${name || email || 'Someone'}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('submit-prep Resend error:', res.status, errText);
      let userMessage = 'Failed to send your answers. Please try again or email contact@stancastle.com.';
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.message) userMessage = `Email error: ${errJson.message}`;
      } catch {
        if (errText && errText.length < 200) userMessage = `Email error: ${errText}`;
      }
      return new Response(JSON.stringify({ error: userMessage }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('submit-prep error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
