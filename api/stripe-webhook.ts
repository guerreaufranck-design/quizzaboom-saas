import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

const buffer = (req: VercelRequest): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return res.status(400).send(`Webhook Error: ${message}`);
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Payment completed:', session.id);

      // Extract user_id and plan_name from session metadata (set during checkout)
      const sessionMetadata = session.metadata || {};
      let userId = sessionMetadata.user_id;
      const planName = sessionMetadata.plan_name;

      // Fallback: if user_id missing from metadata, try to find user by email
      if (!userId && session.customer_details?.email) {
        console.log('No user_id in metadata, trying email fallback:', session.customer_details.email);
        const { data: userList } = await supabase.auth.admin.listUsers();
        const matchingUser = userList?.users?.find(
          (u: { email?: string }) => u.email === session.customer_details?.email
        );
        if (matchingUser) {
          userId = matchingUser.id;
          console.log('Found user by email fallback:', userId);
        }
      }

      // Get price details for max_players from product metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      let maxPlayers = 5;
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'],
        });
        const product = price.product as Stripe.Product;
        maxPlayers = parseInt(product.metadata.max_players || '5');
      }

      if (userId) {
        // Create purchase record linked to the authenticated user
        const { error: purchaseError } = await supabase
          .from('user_purchases')
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            plan_name: planName || 'Unknown',
            max_players: maxPlayers,
            amount: session.amount_total || 0,
            used: false,
          });

        if (purchaseError) {
          console.error('Failed to create purchase:', purchaseError);
        } else {
          console.log('Purchase recorded successfully for user:', userId);
        }
      } else {
        console.error('No user_id found (metadata + email fallback failed) — purchase cannot be linked');
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    res.status(500).json({ error: message });
  }
}
