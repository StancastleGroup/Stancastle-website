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
    const { 
      service_type, 
      user_id, 
      date, 
      time, 
      first_name, 
      last_name, 
      email, 
      phone, 
      company_name, 
      company_website, 
      no_company,
      success_url, 
      cancel_url, 
      customer_email 
    } = await req.json();

    if (!service_type || !date || !time || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isGuest = !user_id || user_id === '';
    if (isGuest) {
      if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Guest checkout requires first_name, last_name, email, and phone' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const service = PRICES[service_type as keyof typeof PRICES];

    if (!service) {
      return new Response(
        JSON.stringify({ error: 'Invalid service type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create pending appointment (does not block slot; get-availability only counts paid/booked)
    const { data: pendingAppointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        user_id: isGuest ? null : user_id,
        service_type,
        date,
        time,
        status: 'pending',
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || customer_email || null,
        phone: phone || null,
        company_name: company_name || null,
        company_website: company_website || null,
        no_company: no_company === true || no_company === 'true',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Create pending appointment error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Could not create booking. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appointmentId = pendingAppointment?.id;
    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'Could not create booking.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store booking details + appointment_id in Stripe metadata (webhook will update pending → paid)
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: service.mode,
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      customer_email: customer_email || email || undefined,
      metadata: {
        appointment_id: String(appointmentId),
        user_id: isGuest ? '' : (user_id || ''),
        service_type,
        date,
        time,
        first_name: first_name || '',
        last_name: last_name || '',
        email: email || customer_email || '',
        phone: phone || '',
        company_name: company_name || '',
        company_website: company_website || '',
        no_company: String(no_company || false),
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
