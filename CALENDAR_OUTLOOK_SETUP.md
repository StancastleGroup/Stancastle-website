# Calendar integration (Outlook for contact@stancastle.com)

This doc explains how to connect **contact@stancastle.com**’s Outlook calendar so that:

1. **Real availability** – The site shows your actual free/busy times from Outlook (plus 90‑minute slots and existing bookings).
2. **No double-booking** – When someone books a slot (e.g. Feb 12th 13:00), that slot is excluded for everyone else (from the `appointments` table).
3. **Meetings on your calendar** – After payment, a Zoom meeting is created and an event is added to **contact@stancastle.com**’s Outlook calendar with the Zoom link and the customer as attendee.

---

## What’s already implemented

- **90‑minute slots only** – All bookable slots are 90‑minute blocks (non‑overlapping).
- **get-availability** – Edge Function that returns available dates/slots. Without Outlook credentials it uses rule-based hours; with Outlook it uses your real free/busy.
- **BookingFlow** – Calls `get-availability` and shows only free 90‑min slots; slots already in `appointments` (pending/paid/booked) are excluded.
- **Stripe webhook** – After creating the Zoom meeting, creates an Outlook calendar event for contact@stancastle.com with the Zoom link and 90‑min duration.

---

## What you need to do (Outlook / Microsoft Graph)

### 1. Register an app in Azure

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** (or **Azure Active Directory**) → **App registrations** → **New registration**.
2. Name it (e.g. “Stancastle Calendar”), choose **Accounts in any organizational directory and personal Microsoft accounts** (or **Single tenant** if only your org).
3. Under **Redirect URI**, add **Web** and set e.g. `https://stancastle.com/auth/outlook` (or `http://localhost:3000/auth/outlook` for testing).
4. Register and note:
   - **Application (client) ID**
   - **Directory (tenant) ID** (under “Overview”)

### 2. Create a client secret

1. In the app → **Certificates & secrets** → **New client secret**.
2. Copy the **Value** (you won’t see it again).

### 3. Add API permissions

1. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**.
2. Add:
   - **Calendars.Read** (for free/busy in get-availability)
   - **Calendars.ReadWrite** (for creating events in the webhook)
   - **offline_access** (so you get a refresh token)
3. **Grant admin consent** if your tenant requires it.

### 4. Get a refresh token from your website

Set the three Outlook secrets in Supabase first (step 5), then:

1. **Add the redirect URI in Azure**
   - In your app → **Authentication** → **Add a platform** → **Web**.
   - Redirect URI: **`http://localhost:3000/auth/outlook`** (for testing) and/or **`https://yourdomain.com/auth/outlook`** (for production).
   - Save.

2. **Deploy the token-exchange function**
   ```bash
   npx supabase functions deploy exchange-outlook-token --no-verify-jwt
   ```

3. **Open the Outlook auth page in your browser**
   - Local: **http://localhost:3000/auth/outlook**
   - Or your live site: **https://yourdomain.com/auth/outlook**

4. **Click “Sign in with Microsoft”**
   - Sign in as **contact@stancastle.com** and accept the calendar permissions.

5. **Copy the refresh token**
   - After redirect, the page shows your **refresh token**. Click **Copy to clipboard**, then paste it into Supabase as **OUTLOOK_REFRESH_TOKEN** (step 5 below).

### 5. Set Supabase Edge Function secrets

In **Supabase** → **Edge Functions** → **Secrets**, add:

| Secret | Value |
|--------|--------|
| `OUTLOOK_CLIENT_ID` | Application (client) ID from step 1 |
| `OUTLOOK_CLIENT_SECRET` | Client secret value from step 2 |
| `OUTLOOK_TENANT_ID` | Directory (tenant) ID (or `common` if multi-tenant) |
| `OUTLOOK_REFRESH_TOKEN` | The refresh token you got from the /auth/outlook page (step 4) |
| `OUTLOOK_EMAIL` | `contact@stancastle.com` |

Used by:

- **get-availability** – Uses these to call Microsoft Graph `getSchedule` for your calendar and return only free 90‑min slots (plus existing bookings from the DB).
- **stripe-webhook** – Uses these to create a calendar event in your Outlook after each Zoom meeting.

### 6. Deploy and test

```bash
npx supabase functions deploy get-availability --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

- Open the site → start a booking → calendar step should show “Loading your real availability…” then dates/times from your Outlook (or rule-based if Outlook isn’t configured).
- After a test payment, check **contact@stancastle.com**’s Outlook calendar for the new event with the Zoom link.

---

## Behaviour summary

| Feature | How it works |
|--------|----------------|
| **Real availability** | get-availability calls Graph `getSchedule` for `OUTLOOK_EMAIL`, keeps 90‑min slots that are free and within business rules, then removes any slot already in `appointments`. |
| **90‑min slots only** | All slots are 90‑minute starts (e.g. 08:00, 09:30, 11:00 …). No overlap. |
| **No double-booking** | Slots in `appointments` with status pending/paid/booked are excluded from the list returned by get-availability. |
| **Meeting on your calendar** | After Zoom is created, the webhook creates an Outlook event for `OUTLOOK_EMAIL` with start/end (90 min), subject, body with Zoom link, and the customer as attendee. |

If you don’t set the Outlook secrets, the site still works: availability is rule-based and no Outlook event is created; only Zoom and emails run as before.
