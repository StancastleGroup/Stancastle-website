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

/** Normalize time format to HH:mm (e.g., "8:00" -> "08:00", "09:30:00" -> "09:30"). */
function normalizeTime(time: string): string {
  if (!time || typeof time !== 'string') {
    console.warn(`[get-availability] normalizeTime received invalid input:`, time);
    return time || '';
  }
  if (!time.includes(':')) return time;
  const parts = time.split(':').slice(0, 2);
  const normalized = parts.map((s) => s.padStart(2, '0')).join(':');
  return normalized;
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

/** Parse one day's availabilityView (48 chars = 24h in 30-min chunks) into free 90-min slot starts. */
function parseDayView(view: string, dayOfWeek: number): string[] {
  const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
  if (ruleSlots.length === 0 || view.length < 48) return [];
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

/** Fetch free/busy from Outlook for a date range in one getSchedule call (max ~31 days). Returns date -> slots. */
async function getOutlookFreeSlotsForRange(
  accessToken: string,
  email: string,
  dateStrings: string[]
): Promise<Record<string, string[]>> {
  if (dateStrings.length === 0) return {};
  const start = `${dateStrings[0]}T00:00:00`;
  const last = dateStrings[dateStrings.length - 1];
  const end = `${last}T23:59:59`;
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
    return {};
  }
  const data = await res.json();
  const schedule = data?.value?.[0];
  const view: string = schedule?.availabilityView ?? '';
  // availabilityView: 30-min chunks, 48 per day (00:00–23:30). Each day = 48 chars.
  const out: Record<string, string[]> = {};
  const chunksPerDay = 48;
  for (let i = 0; i < dateStrings.length; i++) {
    const dateStr = dateStrings[i];
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = d.getUTCDay();
    const dayView = view.slice(i * chunksPerDay, (i + 1) * chunksPerDay);
    out[dateStr] = parseDayView(dayView, dayOfWeek);
  }
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as { from_date?: string; to_date?: string };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = body.from_date ? new Date(body.from_date) : new Date(today);
    const toDate = body.to_date ? new Date(body.to_date) : (() => { const d = new Date(today); d.setDate(d.getDate() + 21); return d; })();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const fromStr = fromDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const toStr = toDate.toISOString().slice(0, 10); // YYYY-MM-DD

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Query all booked appointments in the date range (only 'paid' and 'booked' - no 'pending' since we don't create pending appointments)
    const { data: appointments, error: queryError } = await supabase
      .from('appointments')
      .select('date, time, status')
      .in('status', ['paid', 'booked'])
      .gte('date', fromStr)
      .lte('date', toStr);

    if (queryError) {
      console.error('[get-availability] Error querying appointments:', queryError);
    }

    // Build a set of all booked slot keys (date + time) for fast lookup
    const bookedSet = new Set<string>();
    (appointments ?? []).forEach((a: { date: string | Date; time: string; status: string }) => {
      // Normalize date: extract YYYY-MM-DD format
      // Supabase DATE columns can return strings like "2026-02-16" or Date objects
      let dateStr: string;
      if (typeof a.date === 'string') {
        // Handle both "2026-02-16" and "2026-02-16T00:00:00Z" formats
        dateStr = a.date.split('T')[0].split(' ')[0]; // Take first part before T or space
      } else if (a.date instanceof Date) {
        dateStr = a.date.toISOString().slice(0, 10);
      } else {
        // Fallback: convert to string and extract date part
        const dateStrRaw = String(a.date);
        dateStr = dateStrRaw.split('T')[0].split(' ')[0];
      }
      
      // Ensure dateStr is in YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        console.warn(`[get-availability] Invalid date format: ${a.date} -> ${dateStr}`);
        return; // Skip this appointment if date format is invalid
      }
      
      // Normalize time: ensure HH:mm format (e.g., "8:00" -> "08:00", "08:00:00" -> "08:00")
      const timeNormalized = normalizeTime(a.time);
      if (!timeNormalized) {
        console.warn(`[get-availability] Invalid time format: ${a.time}`);
        return; // Skip this appointment if time format is invalid
      }
      
      const key = `${dateStr}T${timeNormalized}`;
      bookedSet.add(key);
    });

    const dates = getBookableDatesInRange(fromDate, toDate);
    const outlookEmail = Deno.env.get('OUTLOOK_EMAIL')?.trim();
    const useOutlook = outlookEmail && (Deno.env.get('OUTLOOK_REFRESH_TOKEN')?.trim());

    let result: { date: string; slots: string[] }[] = [];

    if (useOutlook) {
      const token = await getOutlookAccessToken();
      if (token) {
        // Batch Outlook: one getSchedule per ~14 days, run batches in parallel (was 1 call per day = 60+ sequential).
        const BATCH_DAYS = 14;
        const batches: string[][] = [];
        for (let i = 0; i < dates.length; i += BATCH_DAYS) {
          batches.push(dates.slice(i, i + BATCH_DAYS));
        }
        const batchResults = await Promise.all(
          batches.map((batch) => getOutlookFreeSlotsForRange(token, outlookEmail, batch))
        );
        const byDate: Record<string, string[]> = {};
        for (const r of batchResults) {
          for (const [dateStr, slots] of Object.entries(r)) {
            byDate[dateStr] = slots;
          }
        }
        for (const dateStr of dates) {
          const freeSlots = byDate[dateStr] ?? [];
          // Filter out any slots that are already booked
          const available = freeSlots.filter((t) => {
            const timeNormalized = normalizeTime(t);
            const key = `${dateStr}T${timeNormalized}`;
            return !bookedSet.has(key);
          });
          result.push({ date: dateStr, slots: available });
        }
      } else {
        // Fallback to rule-based slots if Outlook fails
        for (const dateStr of dates) {
          const d = new Date(dateStr + 'T12:00:00Z');
          const dayOfWeek = d.getUTCDay();
          const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
          // Filter out any slots that are already booked
          const available = ruleSlots.filter((t) => {
            const timeNormalized = normalizeTime(t);
            const key = `${dateStr}T${timeNormalized}`;
            return !bookedSet.has(key);
          });
          result.push({ date: dateStr, slots: available });
        }
      }
    } else {
      // No Outlook integration - use rule-based slots only
      for (const dateStr of dates) {
        const d = new Date(dateStr + 'T12:00:00Z');
        const dayOfWeek = d.getUTCDay();
        const ruleSlots = SLOTS_BY_DAY[dayOfWeek] ?? [];
        // Filter out any slots that are already booked
        const available = ruleSlots.filter((t) => {
          const timeNormalized = normalizeTime(t);
          const key = `${dateStr}T${timeNormalized}`;
          return !bookedSet.has(key);
        });
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
