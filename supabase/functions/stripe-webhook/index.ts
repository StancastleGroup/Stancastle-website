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
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { appointment_id, user_id, service_type } = session.metadata || {};

        if (appointment_id) {
          // Update appointment status to paid
          const { error: appointmentError } = await supabase
            .from('appointments')
            .update({
              status: 'paid',
              stripe_session_id: session.id,
              amount_paid: session.amount_total,
            })
            .eq('id', appointment_id);

          if (appointmentError) {
            console.error('Error updating appointment:', appointmentError);
          }
        }

        // If partner programme, update user profile
        if (service_type === 'partner' && user_id) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              is_partner: true,
              stripe_customer_id: session.customer as string,
            })
            .eq('id', user_id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription cancellation
        const { error } = await supabase
          .from('profiles')
          .update({ is_partner: false })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Error updating profile on subscription cancel:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment failed for customer: ${invoice.customer}`);
        // You could send notification emails here
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
