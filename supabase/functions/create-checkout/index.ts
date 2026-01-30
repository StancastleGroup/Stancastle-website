import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

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
    // This ID tells Stripe which monthly subscription to charge
    priceId: 'price_1SucNB3309DWqldSSEOZCeFg',
    name: 'Partner Programme',
    description: 'Acting Strategic Leadership for operational restructuring and growth.',
    mode: 'subscription' as const,
  },
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { service_type, user_id, appointment_id, success_url, cancel_url, customer_email } = await req.json();

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
          ...(service.mode === 'subscription' && {
            recurring: {
              interval: 'month',
            },
          }),
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
