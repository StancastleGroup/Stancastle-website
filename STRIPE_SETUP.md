# Stripe integration – setup checklist

Use this after the code changes are in place. Your Supabase Edge Functions and secrets are already set.

---

## 1. Frontend env (`.env.local`)

You already added the Stripe publishable key. Ensure you have:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx   # or pk_live_xxxx for production
```

Optional: if you use a different Supabase project, add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing `.env.local` (`npm run dev`).

---

## 2. Supabase secrets (already done)

You have:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (for the webhook to update DB)

No change needed.

---

## 3. Database columns (run once in Supabase SQL Editor)

If these columns are missing, run the following in **Supabase Dashboard → SQL Editor**:

```sql
-- Appointments: Stripe + Zoom
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER,
ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT;

-- Profiles: store Stripe customer for Partner subscriptions
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

---

## 4. Zoom (optional – add Zoom call after payment)

After payment, the webhook can create a Zoom meeting and save the join link on the appointment. You need a **Zoom Server-to-Server OAuth** app.

1. In [Zoom App Marketplace](https://marketplace.zoom.us/) create a **Server-to-Server OAuth** app and note **Account ID**, **Client ID**, **Client Secret**.
2. In **Supabase → Edge Functions → Secrets**, add:
   - `ZOOM_ACCOUNT_ID`
   - `ZOOM_CLIENT_ID`
   - `ZOOM_CLIENT_SECRET`
3. Redeploy the **stripe-webhook** Edge Function so it uses the new secrets. After a successful payment, the appointment row will get `zoom_join_url` (and `zoom_meeting_id`). You can show this link on a confirmation page or send it by email.

If these secrets are not set, the webhook still runs and marks the appointment as paid; it just skips creating a Zoom meeting.

---

## 5. Stripe webhook endpoint

In **Stripe Dashboard → Developers → Webhooks**:

1. **Add endpoint**
2. **Endpoint URL:**  
   `https://ndvjpqubhjrsgjbkuxrh.supabase.co/functions/v1/stripe-webhook`
3. **Events to send:**  
   - `checkout.session.completed` (required)  
   - `customer.subscription.deleted` (for Partner cancellations)  
   - `invoice.payment_failed` (optional, for notifications)
4. After creating, copy the **Signing secret** (`whsec_...`) and ensure it is set in **Supabase → Edge Functions → Secrets** as `STRIPE_WEBHOOK_SECRET`.

---

## 6. Test the flow

1. Run the app: `npm run dev`
2. Sign up or sign in (BookingFlow requires auth).
3. Open **Book Diagnostic** or **Join Programme** from the Services section.
4. Choose service → pick date and time → Continue to **Secure Checkout**.
5. Click **Pay £159.99** (or Partner amount). You should be redirected to Stripe Checkout.
6. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC.
7. After payment, you’re redirected to `?booking=success`. The webhook should set the appointment to `paid` in Supabase.

---

## 7. If something fails

- **“Payment initialization failed”**  
  Check browser Network tab: call to `.../create-checkout` and response body. Ensure `STRIPE_SECRET_KEY` is set in Supabase secrets and the Edge Function is deployed.

- **Redirect works but appointment stays “pending”**  
  Webhook may not be firing or may be failing. In Stripe Dashboard → Webhooks, open your endpoint and check **Recent deliveries** for errors. Ensure `STRIPE_WEBHOOK_SECRET` in Supabase matches the signing secret for that endpoint.

- **Auth required**  
  User must be signed in before paying. BookingFlow now uses `useAuth()` so the session is correct; if you still see auth issues, confirm you’re using the global booking flow (e.g. from Nav or Services) and not an old duplicate.
