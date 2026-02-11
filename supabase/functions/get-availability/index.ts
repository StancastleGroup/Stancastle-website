import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 90-min slots by weekday (0=Sun .. 6=Sat). Must match lib/availability.ts.
const SLOTS_BY_DAY: Record<number, string[]> = {
  0: [],
  1: ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30'],
  2: [],
  3: ['10:00', '11:30', '13:00', '14:30'],
  4: ['11:00', '12:30', '14:00', '15:30'],
  5: ['08:00'],
  6: ['17:00'],
};
const OPEN_DAYS = [1, 3, 4, 5, 6];

function getBookableDatesInRange(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const toTime = to.getTime();
  while (d.getTime() <= toTime) {
    if (OPEN_DAYS.includes(d.getDay())) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
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

/** Get Microsoft Graph access token using refresh token (for contact@stancastle.com). */
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
    console.error('[get-availability] Outlook token failed:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token ?? null;
}

/** Fetch free/busy from Outlook for one day (UK). Returns list of free 90-min slot start times (HH:mm). */
async function getOutlookFreeSlotsForDate(
  accessToken: string,
  email: string,
  dateStr: string,
  dayOfWeek: number
): Promise<string[]> {
  const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
  if (ruleSlots.length === 0) return [];

  const start = `${dateStr}T00:00:00`;
  const end = `${dateStr}T23:59:59`;
  const res = await fetch('https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(email) + '/calendar/getSchedule', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schedules: [email],
      startTime: { dateTime: start, timeZone: 'Europe/London' },
      endTime: { dateTime: end, timeZone: 'Europe/London' },
      availabilityViewInterval: 30,
    }),
  });
  if (!res.ok) {
    console.error('[get-availability] getSchedule failed:', res.status, await res.text());
    return ruleSlots;
  }
  const data = await res.json();
  const schedule = data?.value?.[0];
  const view: string = schedule?.availabilityView ?? '';
  // availabilityView: 30-min chunks for the day in the requested timezone. "0"=free, "1"=tentative, "2"=busy, "3"=oof.
  // Chunk 0 = midnight, chunk 16 = 08:00, chunk 19 = 09:30, etc. 90 min = 3 chunks.
  const freeSlots: string[] = [];
  for (const startSlot of ruleSlots) {
    const [sh, sm] = startSlot.split(':').map(Number);
    const chunkIndex = (sh * 60 + sm) / 30;
    const needChunks = 3;
    let allFree = true;
    for (let c = 0; c < needChunks; c++) {
      const idx = chunkIndex + c;
      if (idx >= view.length || view[idx] !== '0') {
        allFree = false;
        break;
      }
    }
    if (allFree) freeSlots.push(startSlot);
  }
  return freeSlots;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as { from_date?: string; to_date?: string };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = body.from_date ? new Date(body.from_date) : new Date(today);
    const toDate = body.to_date ? new Date(body.to_date) : new Date(today);
    toDate.setDate(toDate.getDate() + 21);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const fromStr = fromDate.toISOString().slice(0, 10);
    const toStr = toDate.toISOString().slice(0, 10);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: appointments } = await supabase
      .from('appointments')
      .select('date, time')
      .in('status', ['pending', 'paid', 'booked'])
      .gte('date', fromStr)
      .lte('date', toStr);

    const bookedSet = new Set<string>();
    (appointments ?? []).forEach((a: { date: string; time: string }) => bookedSet.add(`${a.date}T${a.time}`));

    const dates = getBookableDatesInRange(fromDate, toDate);
    const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')?.trim();
    const useOutlook = outlookEmail && (Deno.env.get('OUTLOOK_REFRESH_TOKEN')?.trim());

    let result: { date: string; slots: string[] }[] = [];

    if (useOutlook) {
      const token = await getOutlookAccessToken();
      if (token) {
        for (const dateStr of dates) {
          const d = new Date(dateStr + 'T12:00:00Z');
          const dayOfWeek = d.getUTCDay();
          const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
          const freeSlots = await getOutlookFreeSlotsForDate(token, outlookEmail, dateStr, dayOfWeek);
          const available = freeSlots.filter((t) => !bookedSet.has(`${dateStr}T${t}`));
          result.push({ date: dateStr, slots: available });
        }
      } else {
        for (const dateStr of dates) {
          const d = new Date(dateStr + 'T12:00:00Z');
          const dayOfWeek = d.getUTCDay();
          const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
          const available = ruleSlots.filter((t) => !bookedSet.has(`${dateStr}T${t}`));
          result.push({ date: dateStr, slots: available });
        }
      }
    } else {
      for (const dateStr of dates) {
        const d = new Date(dateStr + 'T12:00:00Z');
        const dayOfWeek = d.getUTCDay();
        const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
        const available = ruleSlots.filter((t) => !bookedSet.has(`${dateStr}T${t}`));
        result.push({ date: dateStr, slots: available });
      }
    }

    return new Response(JSON.stringify({ dates: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[get-availability]', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
