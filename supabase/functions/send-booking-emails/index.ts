import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-booking-secret',
};

// Use Resend's test sender when no domain verified; set BOOKING_FROM_EMAIL (e.g. contact@stancastle.com) after verifying your domain.
const FROM_EMAIL = Deno.env.get('BOOKING_FROM_EMAIL') || 'Stancastle <onboarding@resend.dev>';
const PREP_FORM_URL = Deno.env.get('PREP_FORM_URL') || 'https://stancastle.com/prep';

/** Format date and time for UK display in emails. Handles ISO date strings and missing time. */
function formatDateTime(dateStr: string | null | undefined, timeStr: string | null | undefined): string {
  if (!dateStr) return 'Date to be confirmed';
  // Normalize: DB may return "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss..." or full ISO
  const dateOnly = dateStr.includes('T') ? dateStr.slice(0, 10) : dateStr;
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 'Date to be confirmed';
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return 'Date to be confirmed';
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateFormatted = date.toLocaleDateString('en-GB', options);
  const timeDisplay = timeStr?.trim() || 'Time to be confirmed';
  return `${dateFormatted} at ${timeDisplay}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const secret = req.headers.get('x-booking-secret');
  const expectedSecret = Deno.env.get('BOOKING_EMAILS_SECRET');
  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) {
      return new Response(JSON.stringify({ error: 'appointment_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Select base fields + zoom_join_url + guest fields (for guest bookings, user_id is null)
    const { data: appointment, error: appError } = await supabase
      .from('appointments')
      .select('id, user_id, date, time, service_type, zoom_join_url, email, first_name, last_name')
      .eq('id', appointment_id)
      .single();

    if (appError || !appointment) {
      console.error('Appointment fetch error. id=', appointment_id, 'error=', appError?.message ?? appError, 'code=', appError?.code);
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let email: string | null = null;
    let firstName = '';
    let lastName = '';

    if (appointment.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', appointment.user_id)
        .single();
      if (profileError) {
        console.error('Profile fetch error for user_id=', appointment.user_id, profileError.message);
      }
      if (profile?.email) email = profile.email;
      if (profile?.first_name) firstName = profile.first_name;
      if (profile?.last_name) lastName = profile.last_name;
      if (!email?.trim()) {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(appointment.user_id);
        if (authUser?.email) {
          email = authUser.email;
          if (!firstName?.trim() && authUser.user_metadata?.full_name) firstName = authUser.user_metadata.full_name;
        }
      }
    } else {
      // Guest booking: use appointment row fields
      email = appointment.email ?? null;
      firstName = appointment.first_name ?? '';
      lastName = appointment.last_name ?? '';
    }

    if (!email?.trim()) {
      console.error('No email for appointment:', appointment_id, 'user_id:', appointment.user_id);
      return new Response(JSON.stringify({ error: 'Appointment has no email' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set; skipping emails');
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstNameDisplay = firstName?.trim() || lastName?.trim() || 'there';
    const dateTimeStr = formatDateTime(appointment.date, appointment.time);
    const serviceName = appointment.service_type === 'partner' ? 'Partner Programme' : 'Diagnostic Session';

    // Email 1 – Order Confirmation
    const orderConfirmationHtml = `
      <p>Hi ${firstNameDisplay},</p>
      <p>Thank you for booking with Stancastle.</p>
      <p><strong>Payment confirmed.</strong> Your ${serviceName} is scheduled for:</p>
      <p><strong>${dateTimeStr}</strong> (UK time)</p>
      <p><strong>Next steps:</strong></p>
      <ul>
        <li>You will receive a separate email shortly with your Zoom meeting link and joining instructions.</li>
        <li>To help us prepare for your session, please complete this short form when you’re ready: <a href="${PREP_FORM_URL}">Meeting preparation form</a></li>
      </ul>
      <p>If you have any questions, reply to this email or call 020 8064 2496.</p>
      <p>Best,<br>The Stancastle Team</p>
    `;

    const orderRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Booking confirmed – ${serviceName} on ${dateTimeStr}`,
        html: orderConfirmationHtml,
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      console.error('Resend order email error:', orderRes.status, err);
      return new Response(
        JSON.stringify({ error: 'Failed to send order confirmation', resend_status: orderRes.status, resend_error: err }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Email 2 – Meeting Details (with Zoom link when available)
    const zoomSection = appointment.zoom_join_url
      ? `
        <p><strong>Join your session:</strong><br>
        <a href="${appointment.zoom_join_url}">${appointment.zoom_join_url}</a></p>
        <p><strong>Instructions:</strong></p>
        <ul>
          <li>Click the link above at your scheduled time (or a few minutes early).</li>
          <li>You may be asked to install the Zoom app or join via browser.</li>
          <li>Please be in a quiet place with a stable connection. We’ll have a 90-minute focused session.</li>
        </ul>
      `
      : `
        <p>Your Zoom meeting link will be sent separately once the meeting has been created. If you don’t receive it within a few minutes, reply to this email or call 020 8064 2496.</p>
      `;

    const meetingDetailsHtml = `
      <p>Hi ${firstNameDisplay},</p>
      <p>Here are the details for your Stancastle session.</p>
      <p><strong>Date & time:</strong> ${dateTimeStr} (UK time)</p>
      <p><strong>Service:</strong> ${serviceName}</p>
      ${zoomSection}
      <p><strong>What to expect:</strong> We’ll use the full 90 minutes for a deep dive into your situation and priorities. Come ready to discuss your business and goals.</p>
      <p>To help us prepare, please complete this form when you can: <a href="${PREP_FORM_URL}">Meeting preparation form</a> (10–15 short questions).</p>
      <p>Best,<br>The Stancastle Team</p>
    `;

    const meetingRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Meeting details – ${serviceName} on ${dateTimeStr}`,
        html: meetingDetailsHtml,
      }),
    });

    if (!meetingRes.ok) {
      const err = await meetingRes.text();
      console.error('Resend meeting email error:', err);
      // Order email already sent; still return 200 or 500? Return 200 so webhook doesn't retry.
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-booking-emails error:', e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
