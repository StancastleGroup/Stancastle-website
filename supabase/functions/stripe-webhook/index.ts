import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

/** Get Zoom OAuth access token using Account ID + Client ID + Client Secret (S2S app). */
async function getZoomOAuthToken(): Promise<string | null> {
  const accountId = (Deno.env.get('ZOOM_ACCOUNT_ID') ?? '').trim();
  const clientId = (Deno.env.get('ZOOM_CLIENT_ID') ?? '').trim();
  const clientSecret = (Deno.env.get('ZOOM_CLIENT_SECRET') ?? '').trim();
  if (!accountId || !clientId || !clientSecret) return null;
  const formBody = `grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;
  const tokenRes = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody,
  });
  if (!tokenRes.ok) {
    console.error('[Zoom] OAuth token failed:', tokenRes.status, await tokenRes.text());
    return null;
  }
  const data = await tokenRes.json();
  return data.access_token ?? null;
}

/** Create a Zoom meeting with the given access token. Returns result or { error, status } for retry. */
async function createMeetingWithToken(
  accessToken: string,
  date: string,
  time: string,
  serviceType: string,
  durationMinutes: number
): Promise<{ join_url: string; meeting_id: string } | { error: true; status: number }> {
  const dateOnly = date.includes('T') ? date.slice(0, 10) : date;
  const [h = '0', m = '0'] = String(time).split(':');
  const startTime = `${dateOnly}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
  const topic = serviceType === 'partner'
    ? 'Stancastle - Partner Programme Call'
    : 'Stancastle - Diagnostic Session';

  const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: startTime,
      timezone: 'Europe/London',
      duration: durationMinutes,
      settings: { join_before_host: true },
    }),
  });
  if (!meetingRes.ok) {
    const errText = await meetingRes.text();
    console.error('[Zoom] Create meeting failed:', meetingRes.status, errText);
    return { error: true, status: meetingRes.status };
  }
  const meeting = await meetingRes.json();
  return { join_url: meeting.join_url, meeting_id: String(meeting.id) };
}

/** Create a Zoom meeting. Uses ZOOM_ACCESS_TOKEN if set; on 401 retries with OAuth token. Prefers OAuth when credentials are set. */
async function createZoomMeeting(
  date: string,
  time: string,
  serviceType: string,
  durationMinutes: number
): Promise<{ join_url: string; meeting_id: string } | null> {
  const zoomAccessToken = (Deno.env.get('ZOOM_ACCESS_TOKEN') ?? '').trim();
  const canUseOAuth = !!(Deno.env.get('ZOOM_ACCOUNT_ID')?.trim() && Deno.env.get('ZOOM_CLIENT_ID')?.trim() && Deno.env.get('ZOOM_CLIENT_SECRET')?.trim());

  let token: string | null = null;
  let usedOAuth = false;

  // Prefer OAuth when credentials are set (token is always fresh). Fall back to ZOOM_ACCESS_TOKEN if OAuth fails.
  if (canUseOAuth) {
    token = await getZoomOAuthToken();
    if (token) {
      usedOAuth = true;
      console.log('[Zoom] Using OAuth token');
    }
  }
  if (!token && zoomAccessToken) {
    token = zoomAccessToken;
    console.log('[Zoom] Using ZOOM_ACCESS_TOKEN');
  }
  if (!token) {
    console.warn('[Zoom] No token. Set ZOOM_ACCESS_TOKEN or ZOOM_ACCOUNT_ID + ZOOM_CLIENT_ID + ZOOM_CLIENT_SECRET.');
    return null;
  }

  let result = await createMeetingWithToken(token, date, time, serviceType, durationMinutes);

  // If we used manual token and got 401, retry once with a fresh OAuth token (if credentials exist).
  if (result && 'error' in result && result.status === 401 && !usedOAuth && canUseOAuth) {
    console.log('[Zoom] Got 401, retrying with fresh OAuth token');
    const oauthToken = await getZoomOAuthToken();
    if (oauthToken) result = await createMeetingWithToken(oauthToken, date, time, serviceType, durationMinutes);
  }

  if (result && 'error' in result) return null;
  return result as { join_url: string; meeting_id: string } | null;
}

/** Normalize tenant ID (strip "id " prefix if pasted from Azure UI). */
function normalizeTenantId(value: string | undefined): string {
  const s = (value ?? 'common').trim();
  if (s.toLowerCase().startsWith('id ')) return s.slice(3).trim();
  return s;
}

/** Sanitize refresh token: no newlines or extra spaces (Supabase secret can get pasted with line breaks). */
function sanitizeRefreshToken(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

/** Get Microsoft Graph access token (for contact@stancastle.com Outlook calendar). */
async function getOutlookAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get('OUTLOOK_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET')?.trim();
  const tenant = normalizeTenantId(Deno.env.get('OUTLOOK_TENANT_ID'));
  const refreshToken = sanitizeRefreshToken(Deno.env.get('OUTLOOK_REFRESH_TOKEN'));
  if (!clientId || !clientSecret || !refreshToken) return null;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    scope: 'offline_access Calendars.Read Calendars.ReadWrite',
  });
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    console.error('[stripe-webhook] Outlook token failed:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token ?? null;
}

/** Create a calendar event in contact@stancastle.com's Outlook calendar (so you see the meeting). */
async function createOutlookCalendarEvent(
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
  subject: string,
  bodyWithZoomLink: string,
  attendeeEmail: string
): Promise<void> {
  const email = Deno.env.get('OUTLOOK_EMAIL')?.trim();
  if (!email) return;
  const token = await getOutlookAccessToken();
  if (!token) return;
  // Normalize date to YYYY-MM-DD (Supabase can return full ISO e.g. 2026-02-12T00:00:00+00:00)
  const dateOnly = dateStr.slice(0, 10);
  const [h = 0, m = 0] = String(timeStr).split(':').map(Number);
  const start = `${dateOnly}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  const endM = h * 60 + m + durationMinutes;
  const endH = Math.floor(endM / 60);
  const endMin = endM % 60;
  const end = `${dateOnly}T${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;
  const res = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/calendar/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject,
      body: { contentType: 'HTML', content: bodyWithZoomLink },
      start: { dateTime: start, timeZone: 'Europe/London' },
      end: { dateTime: end, timeZone: 'Europe/London' },
      attendees: [{ emailAddress: { address: attendeeEmail, name: attendeeEmail }, type: 'required' }],
    }),
  });
  if (!res.ok) {
    console.error('[stripe-webhook] Outlook create event failed:', res.status, await res.text());
  } else {
    console.log('[stripe-webhook] Outlook calendar event created for', email);
  }
}

serve(async (req) => {
  // Log every request immediately (so you see something even if later code fails)
  console.log('[stripe-webhook] Request received', new Date().toISOString());

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    console.log('[stripe-webhook] Rejected: no stripe-signature header');
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    // Use async version: SubtleCrypto in Deno/Edge can't run in sync context
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      secret
    );

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { appointment_id, user_id, service_type } = session.metadata || {};

        if (appointment_id) {
          const { data: appointment } = await supabase
            .from('appointments')
            .select('date, time, email')
            .eq('id', appointment_id)
            .single();

          const durationMinutes = service_type === 'partner' ? 60 : 90;
          let zoomJoinUrl: string | null = null;
          let zoomMeetingId: string | null = null;
          if (appointment?.date && appointment?.time) {
            console.log('[stripe-webhook] Creating Zoom meeting for', appointment.date, appointment.time);
            const zoom = await createZoomMeeting(
              appointment.date,
              appointment.time,
              service_type || 'diagnostic',
              durationMinutes
            );
            if (zoom) {
              zoomJoinUrl = zoom.join_url;
              zoomMeetingId = zoom.meeting_id;
              console.log('[stripe-webhook] Zoom meeting created:', zoomMeetingId);
            } else {
              console.log('[stripe-webhook] Zoom meeting was not created (check logs above for credentials or API errors)');
            }
          } else {
            console.log('[stripe-webhook] Skipping Zoom: appointment missing date or time', appointment?.date, appointment?.time);
          }

          const { error: appointmentError } = await supabase
            .from('appointments')
            .update({
              status: 'paid',
              stripe_session_id: session.id,
              amount_paid: session.amount_total,
              ...(zoomJoinUrl && { zoom_join_url: zoomJoinUrl }),
              ...(zoomMeetingId && { zoom_meeting_id: zoomMeetingId }),
            })
            .eq('id', appointment_id);

          if (appointmentError) {
            console.error('[stripe-webhook] Error updating appointment (missing zoom_join_url/zoom_meeting_id columns?):', appointmentError);
          }

          // Add meeting to contact@stancastle.com's Outlook calendar (so you see it)
          const customerEmail = (appointment as { email?: string })?.email;
          if (zoomJoinUrl && appointment?.date && appointment?.time && customerEmail) {
            const durationMinutes = service_type === 'partner' ? 60 : 90;
            const subject = service_type === 'partner'
              ? 'Partner Programme – ' + customerEmail
              : 'Diagnostic Session – ' + customerEmail;
            const bodyHtml = `<p>Zoom: <a href="${zoomJoinUrl}">${zoomJoinUrl}</a></p>`;
            createOutlookCalendarEvent(
              appointment.date,
              appointment.time,
              durationMinutes,
              subject,
              bodyHtml,
              customerEmail
            ).catch((e) => console.error('[stripe-webhook] Outlook event error:', e));
          }

          // Trigger booking emails (Order Confirmation + Meeting Details)
          const bookingEmailsSecret = Deno.env.get('BOOKING_EMAILS_SECRET');
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          if (!bookingEmailsSecret || !supabaseUrl) {
            console.warn('Booking emails skipped: BOOKING_EMAILS_SECRET or SUPABASE_URL not set');
          } else {
            try {
              const emailUrl = `${supabaseUrl}/functions/v1/send-booking-emails`;
              console.log('Calling send-booking-emails for appointment:', appointment_id);
              const res = await fetch(emailUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-booking-secret': bookingEmailsSecret,
                },
                body: JSON.stringify({ appointment_id }),
              });
              const body = await res.text();
              if (!res.ok) {
                console.error('send-booking-emails failed:', res.status, body);
              } else {
                console.log('send-booking-emails ok:', body);
              }
            } catch (e) {
              console.error('Failed to trigger booking emails:', e);
            }
          }
        }

        // If partner programme, update user profile
        if (service_type === 'partner' && user_id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              is_partner: true,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', user_id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription cancellation
        const { error } = await supabase
          .from('profiles')
          .update({ is_partner: false })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Error updating profile on subscription cancel:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for customer: ${invoice.customer}`);
        // You could send notification emails here
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[stripe-webhook] Signature/parse error:', message);
    // Common: "No signatures found matching the payload" => STRIPE_WEBHOOK_SECRET is wrong or from a different endpoint
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
