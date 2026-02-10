import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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

      // Get price details to extract metadata
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      if (priceId) {
        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'],
        });

        const product = price.product as Stripe.Product;
        const metadata = product.metadata;

        // Get or create user based on email
        const email = session.customer_details?.email;
        
        if (email) {
          // Create purchase record
          const { error: purchaseError } = await supabase
            .from('user_purchases')
            .insert({
              stripe_session_id: session.id,
              plan_name: metadata.plan_name || 'Unknown',
              max_players: parseInt(metadata.max_players || '5'),
              amount: session.amount_total || 0,
              used: false,
            });

          if (purchaseError) {
            console.error('Failed to create purchase:', purchaseError);
          } else {
            console.log('Purchase recorded successfully');
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    res.status(500).json({ error: message });
  }
}
