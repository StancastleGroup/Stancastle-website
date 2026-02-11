import React, { useEffect, useState } from 'react';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

const SCOPE = 'offline_access Calendars.Read Calendars.ReadWrite';

export const OutlookAuthPage: React.FC = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string>('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      setExchanging(true);
      const redirectUri = window.location.origin + window.location.pathname;
      fetch(`${supabaseUrl}/functions/v1/exchange-outlook-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
        body: JSON.stringify({ code, redirect_uri: redirectUri }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.error) setError(data.error);
          else setRefreshToken(data.refresh_token || null);
        })
        .catch((e) => setError(String(e)))
        .finally(() => setExchanging(false));
      return;
    }

    fetch(`${supabaseUrl}/functions/v1/exchange-outlook-token`, {
      headers: { apikey: supabaseAnonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        setClientId(data.client_id ?? null);
        setTenantId(data.tenant_id || 'common');
      })
      .catch(() => setError('Could not load Outlook config'))
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = () => {
    if (!clientId) return;
    const redirectUri = window.location.origin + window.location.pathname;
    const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', SCOPE);
    url.searchParams.set('response_mode', 'query');
    window.location.href = url.toString();
  };

  const copyToken = () => {
    if (refreshToken) navigator.clipboard.writeText(refreshToken);
  };

  if (exchanging) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-text flex items-center justify-center p-6">
        <p className="text-brand-muted-light">Exchanging code for refresh token…</p>
      </div>
    );
  }

  if (refreshToken) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-text flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-brand-card border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-serif font-bold text-white mb-2">Refresh token ready</h1>
          <p className="text-brand-muted-light text-sm mb-4">
            Copy the value below and add it to Supabase → Edge Functions → Secrets as <strong>OUTLOOK_REFRESH_TOKEN</strong>.
          </p>
          <div className="bg-black/30 rounded-xl p-4 break-all text-sm font-mono text-brand-muted-light mb-4">
            {refreshToken}
          </div>
          <button
            type="button"
            onClick={copyToken}
            className="w-full py-3 rounded-xl bg-brand-accent text-white font-bold hover:opacity-90"
          >
            Copy to clipboard
          </button>
          <p className="text-brand-muted-light text-xs mt-4">
            Also set OUTLOOK_EMAIL=contact@stancastle.com in Supabase secrets if not already set.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-text flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-brand-card border border-white/10 rounded-2xl p-8">
          <h1 className="text-xl font-serif font-bold text-white mb-2">Error</h1>
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <p className="text-brand-muted-light text-sm">
            Ensure OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_TENANT_ID are set in Supabase Edge Function secrets, and that this redirect URI is added in Azure: <strong>{window.location.origin}/auth/outlook</strong>
          </p>
        </div>
      </div>
    );
  }

  if (loading || !clientId) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-text flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {loading ? (
            <p className="text-brand-muted-light">Loading…</p>
          ) : (
            <>
              <p className="text-brand-muted-light mb-4">Outlook is not configured.</p>
              <p className="text-sm text-brand-muted-light">
                Add OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, and OUTLOOK_TENANT_ID to Supabase → Edge Functions → Secrets, then deploy the <strong>exchange-outlook-token</strong> function and open this page again.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-text flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-brand-card border border-white/10 rounded-2xl p-8">
        <h1 className="text-xl font-serif font-bold text-white mb-2">Connect Outlook calendar</h1>
        <p className="text-brand-muted-light text-sm mb-6">
          Sign in with <strong>contact@stancastle.com</strong> so we can read your real availability and add booked meetings to your calendar. You’ll get a refresh token to paste into Supabase.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          className="w-full py-4 rounded-xl bg-[#2F2F2F] text-white font-bold border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none"><path fill="#F25022" d="M0 0h10v10H0z"/><path fill="#00A4EF" d="M11 0h10v10H11z"/><path fill="#7FBA00" d="M0 11h10v10H0z"/><path fill="#FFB900" d="M11 11h10v10H11z"/></svg>
          Sign in with Microsoft
        </button>
        <p className="text-brand-muted-light text-xs mt-4">
          Redirect URI for Azure must be: <strong>{window.location.origin}/auth/outlook</strong>
        </p>
      </div>
    </div>
  );
};
