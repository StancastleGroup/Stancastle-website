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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRICES = {
  diagnostic: {
    amount: 15999, // £159.99 in pence
    name: 'Diagnostic Session',
    description: 'Intensive 90-minute strategic deep-dive with a 30-day action plan.',
    mode: 'payment' as const,
  },
  partner: {
    amount: 74999, // £749.99 in pence
    name: 'Partner Programme',
    description: 'Acting Strategic Leadership for operational restructuring and growth.',
    mode: 'subscription' as const,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { service_type, user_id, appointment_id, success_url, cancel_url, customer_email } = await req.json();

    if (!service_type || !user_id || !appointment_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate appointment exists and belongs to this user (security: no JWT required)
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, user_id, status')
      .eq('id', appointment_id)
      .single();

    if (appointmentError || !appointment || appointment.user_id !== user_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid or unauthorized appointment' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (appointment.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Appointment already processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const service = PRICES[service_type as keyof typeof PRICES];

    if (!service) {
      return new Response(
        JSON.stringify({ error: 'Invalid service type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: service.mode,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      customer_email,
      metadata: {
        user_id,
        appointment_id,
        service_type,
      },
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: service.name,
            description: service.description,
          },
          unit_amount: service.amount,
          ...(service.mode === 'subscription' ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      }],
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
