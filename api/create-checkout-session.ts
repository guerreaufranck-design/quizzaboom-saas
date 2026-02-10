import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { setCorsHeaders } from './_cors';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { priceId, planName, userId, successUrl, cancelUrl } = req.body;

    console.log('Creating checkout session:', { priceId, planName, userId });

    if (!priceId) {
      return res.status(400).json({ error: 'Missing priceId — check VITE_STRIPE_PRICE_* env vars' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan_name: planName,
        user_id: userId || '',
      },
    });

    console.log('Checkout session created:', session.id);

    return res.status(200).json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe error:', error);
    return res.status(500).json({ error: message });
  }
}
