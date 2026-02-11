import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * GET: returns client_id and tenant_id for building the Microsoft login URL (no secrets).
 * POST: exchanges authorization code for refresh_token. Body: { code, redirect_uri }.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method === 'GET') {
    const clientId = Deno.env.get('OUTLOOK_CLIENT_ID')?.trim();
    const tenant = (Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common').trim();
    return new Response(
      JSON.stringify({ client_id: clientId || null, tenant_id: tenant }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing code or redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('OUTLOOK_CLIENT_ID')?.trim();
    const clientSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET')?.trim();
    const tenant = (Deno.env.get('OUTLOOK_TENANT_ID') ?? 'common').trim();
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'OUTLOOK_CLIENT_ID or OUTLOOK_CLIENT_SECRET not set in Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri,
      scope: 'offline_access Calendars.Read Calendars.ReadWrite',
    });

    const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.error_description || data.error || 'Token exchange failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_in: data.expires_in,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
