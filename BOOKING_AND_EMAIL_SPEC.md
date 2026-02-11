# Booking, Calendar & Email – What We Need From You

This doc lists what **you** need to provide so we can wire everything to **your** calendar, Zoom, and email (contact@stancastle.com).

---

## 1. Calendar (real availability for contact@stancastle.com)

We need to show **your real availability** and only allow booking 90‑minute slots when you’re free.

**Assumption:** Your calendar is **Google Calendar** (contact@stancastle.com).

### Option A – Google Calendar API (recommended)

- **Google Cloud project** with **Google Calendar API** enabled.
- One of:
  - **Service account** (easiest for a server):
    - Create a service account in that project, download the **JSON key**.
    - Share your main calendar (contact@stancastle.com) with the service account email (e.g. `xxx@project.iam.gserviceaccount.com`) with permission **“Make changes to events”** (or at least “See all event details” for read-only busy/free).
    - We’ll store the **service account JSON** (or its key fields) as Supabase secrets and use it in an Edge Function to read busy/free and create events.
  - **OAuth 2.0** (if you prefer using your own Google login):
    - Create OAuth client (e.g. “Web application”), get **Client ID** and **Client Secret**.
    - One-time flow: you sign in as contact@stancastle.com and we store the **refresh token** in Supabase secrets so the server can get access tokens and read/write the calendar.

**What to send / set:**

- Confirm: “We use Google Calendar for contact@stancastle.com.”
- Which you prefer: **Service account** or **OAuth**.
- If **Service account**: after creating it and sharing the calendar, you can either (1) paste the JSON key contents (we’ll put it in Supabase secrets) or (2) add the JSON to the repo only in a secret file that’s gitignored and tell me the path; I’ll use it in the Edge Function.
- If **OAuth**: Client ID, Client Secret, and (after we run a one-time “connect calendar” flow) the refresh token stored in Supabase.

**If your calendar is not Google** (e.g. Outlook, Apple): tell me which one and we’ll adjust (e.g. Microsoft Graph for Outlook).

---

## 2. Zoom (90‑minute meetings with contact@stancastle.com)

Meetings must be **scheduled on the Zoom account** that belongs to contact@stancastle.com (or the Stancastle Zoom account you use for client calls).

**You need:**

- A **Zoom** account (ideally the one for contact@stancastle.com).
- In [Zoom App Marketplace](https://marketplace.zoom.us/): create a **Server-to-Server OAuth** app (if not already done).
- From that app, get:
  - **Account ID**
  - **Client ID**
  - **Client Secret**

**What to set:**

- In **Supabase → Edge Functions → Secrets**, add:
  - `ZOOM_ACCOUNT_ID`
  - `ZOOM_CLIENT_ID`
  - `ZOOM_CLIENT_SECRET`

(We already create a Zoom meeting in the Stripe webhook; with these set, that meeting will be created on this Zoom account and the link stored for the confirmation and Meeting Details email.)

---

## 3. Email (sending from contact@stancastle.com)

We need to send **Order Confirmation** and **Meeting Details** automatically **from** contact@stancastle.com.

**Option A – Resend (recommended, simple)**

- Sign up at [resend.com](https://resend.com).
- Add and verify the domain that contact@stancastle.com uses (e.g. stancastle.com).
- Create an **API key**.
- In Supabase secrets, set: `RESEND_API_KEY=re_xxxx`.

We’ll send from e.g. `contact@stancastle.com` or `noreply@stancastle.com` (you choose; must be verified).

**Option B – SendGrid**

- SendGrid account, API key, and sender/domain verified for contact@stancastle.com.
- Supabase secret: `SENDGRID_API_KEY`.

**Option C – Gmail SMTP (contact@stancastle.com)**

- Gmail address: contact@stancastle.com.
- App password (2FA must be on): [Google App Passwords](https://myaccount.google.com/apppasswords).
- We’ll store in Supabase: `SMTP_USER=contact@stancastle.com`, `SMTP_PASS=xxxx`, and use a small SMTP sender in an Edge Function.

**What to decide:**

- Which option you want (Resend / SendGrid / Gmail SMTP).
- Exact “From” address (e.g. `contact@stancastle.com` or `Stancastle <contact@stancastle.com>`).
- After that, we’ll add the secrets and wire the two emails (Order Confirmation + Meeting Details).

---

## 4. Content you’ll provide later (we’ll use placeholders for now)

- **Email 1 (Order Confirmation):** Thank-you, payment confirmation, booked time, next steps, “form for meeting preparation” (we can link to a Google Form or Typeform you’ll share later).
- **Email 2 (Meeting Details):** Zoom link, date & time, join instructions, session expectations, and the **10–15 prep questions** form. You’ll send the questions later; we’ll add a placeholder form/link so the flow works end-to-end.

No need to send copy now; we’ll implement the flow and slots for the two emails and you can replace placeholder text and form links later.

---

## 5. Summary checklist

| Item | What you do |
|------|-------------|
| **Calendar** | Confirm Google Calendar for contact@stancastle.com; choose Service account or OAuth; create credentials and (for service account) share the calendar with the service account email. |
| **Zoom** | Create Server-to-Server OAuth app (Zoom account for contact@stancastle.com); add `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` to Supabase secrets. |
| **Email** | Choose Resend / SendGrid / Gmail SMTP; verify domain or create app password; add the relevant API key or SMTP credentials to Supabase secrets; confirm “From” address. |
| **Copy & forms** | Later: final Order Confirmation and Meeting Details text; link or content for “meeting preparation” form and the 10–15 prep questions. |

---

Once you confirm calendar (Google + which auth), Zoom (secrets set), and email (provider + From address), we can implement: calendar view with real availability, 90‑minute slots only, short form (with “I don’t have a company” toggle), payment, on-screen confirmation, and the two automated emails from contact@stancastle.com.

**Database:** Run `supabase/migrations/add_booking_form_columns.sql` in the Supabase SQL Editor so the booking form can save first name, last name, email, phone, company name, company website, and “I don’t have a company”. **Email function:** The Stripe webhook calls **send-booking-emails** (Resend). Set `RESEND_API_KEY`, `BOOKING_FROM_EMAIL`, `PREP_FORM_URL`, and `BOOKING_EMAILS_SECRET` in Supabase Edge Function secrets (see STRIPE_SETUP or README).
