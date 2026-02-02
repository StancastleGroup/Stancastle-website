# CLAUDE.md - Stancastle Project Overview

## Project Summary

**Stancastle** is a high-conversion strategic consultancy website built for UK business owners. It combines a sleek marketing funnel with a booking system, authentication, and is designed to integrate AI-powered problem diagnosis features.

**Target Audience:** High-net-worth UK business owners and senior founders.

---

## Design Philosophy

### Visual Language: "High-Density Strategic Editorial"

| Element | Value |
|---------|-------|
| **Primary Background** | `#050508` (dark mode) |
| **Card Background** | `#0f0f13` |
| **Accent (Fuchsia)** | `#d946ef` |
| **Glow (Purple)** | `#a855f7` |
| **Text** | `#f8fafc` |
| **Muted Text** | `#94a3b8` |

### UX Principles
- **Tighter vertical spacing** to maintain momentum through the funnel
- **Cinematic entrance animations** (Framer Motion staggered children, InView reveals)
- **High-trust signals** (Award badges, Client Logo marquee, Logic-driven FAQ)
- **Glassmorphism effects** (`backdrop-filter: blur(16px)`) on modals and cards
- **Glow effects** on CTAs and interactive elements

### Typography
- **Sans-serif:** Montserrat (weights: 300-800)
- **Serif:** Playfair Display (for headings, fancy quotes)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | React 18.3.1 via ESM (`esm.sh`) - direct browser execution |
| **Build Tool** | Vite 6.2 (dev server on port 3000) |
| **Styling** | Tailwind CSS (CDN-based config in `index.html`) + custom CSS variables |
| **Animations** | Framer Motion (staggered children, infinite marquees, SVG path drawing) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (email/password) |
| **Icons** | Lucide-React |
| **AI** | Gemini API (configured, not yet active) |
| **Web Scraping** | Firecrawl API (planned, not yet implemented) |
| **Payments** | None currently - **Stripe integration needed** |

---

## Project Structure

**IMPORTANT:** All files reside in the root directory. No `src/` prefixing. Use standard ES6 imports from the `importmap` in `index.html`.

```
/Stancastle-website/
├── components/
│   ├── ui/
│   │   ├── Button.tsx          # Premium button with hover glows & shine effects
│   │   └── Section.tsx         # Wrapper with consistent padding + InView animations
│   ├── Hero.tsx                # Complex SVG "X" strike-through + trust marquee
│   ├── Navigation.tsx          # Header with auth & booking triggers
│   ├── Services.tsx            # Service offerings + pricing cards
│   ├── BookingFlow.tsx         # State-driven multi-step wizard (PAYMENT HERE)
│   ├── AuthModal.tsx           # Sign in/Sign up modal
│   ├── ContactForm.tsx         # Lead capture with phone highlight
│   ├── Testimonials.tsx        # High-performance infinite marquee carousel
│   ├── FAQ.tsx                 # Strategic objection-handling FAQ
│   └── ...other marketing sections
├── context/
│   └── AuthContext.tsx         # Session + UserProfile state management
├── lib/
│   └── supabase.ts             # Supabase client initialization
├── App.tsx                     # Layout orchestrator + global BookingFlow portal
├── types.ts                    # TypeScript definitions
├── index.html                  # HTML entry + Tailwind config + importmap + custom CSS
└── vite.config.ts              # Vite + env vars (Gemini API key)
```

### Key Component Architecture

| Component | Role |
|-----------|------|
| **App.tsx** | Layout orchestrator. Contains the global `BookingFlow` portal and handles vertical section spacing. |
| **Section.tsx** | Wrapper ensuring consistent padding and "InView" entrance animations. |
| **Button.tsx** | Premium button primitive with 4 variants (primary/secondary/outline/ghost), hover glows and shine effects. |
| **BookingFlow.tsx** | State-driven multi-step wizard: `service → calendar → details → success`. **Primary integration point for payments.** |
| **Hero.tsx** | Features complex SVG "X" strike-through animations and a high-performance trust marquee. |
| **AuthContext.tsx** | Manages `session` and `UserProfile` state via Supabase Auth. |

---

## Core Features

### 1. Authentication (Supabase)
- Email/password sign up and sign in
- User profiles stored in `profiles` table
- Session management via `AuthContext`

### 2. Booking System
- **Two Services:**
  - Diagnostic Session: £159.99 (one-time)
  - Partner Programme: £749.99/month (subscription)
- Multi-step flow: Service → Calendar → Details → Payment → Success
- Appointments stored in `appointments` table

### 3. Supabase Tables
- **profiles**: id, first_name, last_name, company, email, is_partner
- **appointments**: id, user_id, service_type, date, time, status

---

## Styling Architecture

### Tailwind Configuration
Custom Tailwind config lives in `index.html` `<script>` block with:
- Brand color palette (dark, card, accent, glow, text, muted)
- Custom fonts (Montserrat, Playfair Display)
- Glass-panel effect utility
- Custom animations (pulse-slow, float, shimmer, gradient-shift)

### Custom CSS
Glass effects and glow utilities are defined in the `index.html` `<style>` block:
```css
.glass-panel {
  background: rgba(15, 15, 19, 0.7);
  backdrop-filter: blur(16px);
}
```

### Modules
Use standard ES6 imports from the `importmap` specified in `index.html`. Example:
```typescript
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
```

---

## Environment Variables

Create a `.env.local` file:
```env
GEMINI_API_KEY=your_gemini_api_key
# After Stripe integration:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Critical Business Rules & Assets

### Contact Information
- **Phone Number:** 020 8064 2496 (highlighted in ContactForm)

### Product Positioning
- **Diagnostic Session:** High-intent product. Features "90-minute deep dive" and "Custom Action Plan."
- **IMPORTANT:** The term "PDF" was intentionally removed from deliverables to avoid cheapening the perceived value. Use "Custom Action Plan" or "Decision Matrix" instead.

### Authentication Flow
- Users must **Register** before finalizing a booking
- `AuthModal` handles registration/login
- `BookingFlow` triggers an auth prompt if a user tries to pay while logged out

---

## Key Business Logic

### Pricing (with 40% sale)
- Diagnostic: ~~£266.65~~ → £159.99 (one-time)
- Partner: ~~£1,249.98~~ → £749.99/month (subscription)

### Sales Urgency Messaging
- "40% SALE ENDING SOON" badge on service cards
- "2 Slots Left" scarcity indicator in Hero

### Availability Rules (BookingFlow.tsx)
- Sunday: Closed
- Monday: 8am-5pm
- Wednesday: 10am-5pm (no early slots)
- Thursday: 11am-5pm
- Friday: 8am-10am only
- Saturday: 5pm slot only

---

## Current Payment Flow (NO ACTUAL PROCESSING)

Location: `components/BookingFlow.tsx` → `handlePayment()` function (line ~180)

Currently just inserts to database - **no payment processing**.

---

# Stripe Integration Guide

## Strategic Implementation Overview

Since this is a **client-side only** application, the integration strategy is:

1. **Backend (Supabase Edge Functions):** Initialize Stripe PaymentIntent or Checkout Session securely server-side
2. **Client-Side:**
   - Import `@stripe/stripe-js`
   - In `handlePayment()` within `BookingFlow.tsx`, call the Edge Function to get a `clientSecret`
   - Redirect to Stripe Checkout or render `PaymentElement` inline
3. **Tiered Logic:**
   - **Diagnostic (£159.99):** One-time payment
   - **Partner (£749.99):** Recurring Stripe Subscription (requires Price ID from Stripe Dashboard)
4. **Webhooks:** Listen for `checkout.session.completed` to update `appointments.status` in Supabase

**Integration Point:** Focus on the `details` step in `BookingFlow.tsx` → `handlePayment()` function.

---

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification (UK business details)
3. Get your API keys from Dashboard → Developers → API keys:
   - **Publishable key**: `pk_test_xxx` (for frontend)
   - **Secret key**: `sk_test_xxx` (for backend)

---

## Step 2: Install Stripe Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## Step 3: Create Stripe Configuration

Create `lib/stripe.ts`:
```typescript
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);
```

---

## Step 4: Set Up Supabase Edge Functions for Backend

Since you're using Supabase, create Edge Functions for secure Stripe operations.

### 4a. Create checkout session function

In your Supabase project, create `supabase/functions/create-checkout/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const PRICES = {
  diagnostic: {
    amount: 15999, // £159.99 in pence
    name: 'Diagnostic Session',
    mode: 'payment' as const,
  },
  partner: {
    priceId: 'price_xxx', // Create this in Stripe Dashboard for recurring
    name: 'Partner Programme',
    mode: 'subscription' as const,
  },
};

serve(async (req) => {
  const { service_type, user_id, appointment_id, success_url, cancel_url } = await req.json();

  const service = PRICES[service_type as keyof typeof PRICES];

  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: service.mode,
    success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url,
    metadata: {
      user_id,
      appointment_id,
      service_type,
    },
  };

  if (service.mode === 'payment') {
    sessionConfig.line_items = [{
      price_data: {
        currency: 'gbp',
        product_data: { name: service.name },
        unit_amount: service.amount,
      },
      quantity: 1,
    }];
  } else {
    sessionConfig.line_items = [{ price: service.priceId, quantity: 1 }];
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 4b. Create webhook handler

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
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

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const { appointment_id, user_id, service_type } = session.metadata!;

      // Update appointment status to paid
      await supabase
        .from('appointments')
        .update({ status: 'paid', stripe_session_id: session.id })
        .eq('id', appointment_id);

      // If partner programme, update user profile
      if (service_type === 'partner') {
        await supabase
          .from('profiles')
          .update({ is_partner: true, stripe_customer_id: session.customer })
          .eq('id', user_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      // Handle subscription cancellation
      await supabase
        .from('profiles')
        .update({ is_partner: false })
        .eq('stripe_customer_id', subscription.customer);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }));
});
```

---

## Step 5: Update BookingFlow.tsx

Replace the `handlePayment` function in `components/BookingFlow.tsx`:

```typescript
import { stripePromise } from '../lib/stripe';

const handlePayment = async () => {
  if (!session) {
    setShowAuth(true);
    return;
  }

  setIsProcessing(true);

  try {
    // 1. Create appointment record first (status: 'pending')
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: session.user.id,
        service_type: selectedService,
        date: selectedDate?.toISOString().split('T')[0],
        time: selectedTime,
        status: 'pending',
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;

    // 2. Create Stripe checkout session
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          service_type: selectedService,
          user_id: session.user.id,
          appointment_id: appointment.id,
          success_url: `${window.location.origin}?booking=success`,
          cancel_url: `${window.location.origin}?booking=cancelled`,
        }),
      }
    );

    const { url } = await response.json();

    // 3. Redirect to Stripe Checkout
    window.location.href = url;

  } catch (error) {
    console.error('Payment error:', error);
    alert('There was an error processing your payment. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

---

## Step 6: Update Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Add payment columns to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER;

-- Update status enum to include payment states
-- Statuses: pending, paid, booked, completed, cancelled, refunded

-- Add Stripe columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
```

---

## Step 7: Set Up Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-supabase-url.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

---

## Step 8: Configure Environment Variables

### In Supabase Dashboard (Edge Function Secrets):
- `STRIPE_SECRET_KEY`: sk_live_xxx
- `STRIPE_WEBHOOK_SECRET`: whsec_xxx

### In `.env.local`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_SUPABASE_URL=https://ndvjpqubhjrsgjbkuxrh.supabase.co
```

---

## Step 9: Create Partner Programme Product in Stripe

1. Go to Stripe Dashboard → Products
2. Create product "Partner Programme"
3. Add recurring price: £749.99/month (GBP)
4. Copy the `price_xxx` ID
5. Update the Edge Function with this price ID

---

## Step 10: Test the Integration

1. Use Stripe test mode first (pk_test_xxx, sk_test_xxx)
2. Test card: `4242 4242 4242 4242` (any future date, any CVC)
3. Verify:
   - Checkout redirects work
   - Webhooks update database
   - Subscriptions create correctly
4. Switch to live keys when ready

---

## Quick Reference: File Changes Needed

| File | Change |
|------|--------|
| `lib/stripe.ts` | **CREATE** - Stripe client init |
| `components/BookingFlow.tsx` | **EDIT** - Update handlePayment |
| `.env.local` | **EDIT** - Add Stripe keys |
| `supabase/functions/create-checkout/` | **CREATE** - Edge function |
| `supabase/functions/stripe-webhook/` | **CREATE** - Webhook handler |
| Supabase SQL | **RUN** - Add payment columns |

---

## Testing Checklist

- [ ] Stripe account created and verified
- [ ] Test API keys configured
- [ ] Edge functions deployed
- [ ] Webhook endpoint configured
- [ ] Database columns added
- [ ] Diagnostic payment works (one-time)
- [ ] Partner subscription works (recurring)
- [ ] Webhook updates appointment status
- [ ] Subscription cancellation handled
- [ ] Switch to live keys

---

## Future Enhancements

### Payment Features
- [ ] Customer portal for subscription management
- [ ] Invoice generation
- [ ] Refund automation (connect to refund policy)
- [ ] Payment failed email notifications
- [ ] Promo codes / discount coupons
- [ ] Multi-currency support

### AI-Powered Problem Diagnosis (Planned)
The "problem finding dashboard" concept requires:
- [ ] **Gemini API integration** - Analyze business documents, generate action plans
- [ ] **Firecrawl API integration** - Scrape/analyze client websites for diagnosis
- [ ] Admin dashboard for managing appointments
- [ ] Video call integration (Zoom/Meet links)
- [ ] Email notifications for bookings
- [ ] Calendar synchronization (currently hardcoded availability)

---

## Quick Reference

| Need to... | File Location |
|------------|---------------|
| Add payment processing | `components/BookingFlow.tsx` → `handlePayment()` |
| Modify auth flow | `context/AuthContext.tsx` |
| Change Supabase connection | `lib/supabase.ts` |
| Update Tailwind/CSS | `index.html` |
| Add environment variables | `.env.local` + `vite.config.ts` |
| Create Stripe backend | `supabase/functions/` (Edge Functions) |
