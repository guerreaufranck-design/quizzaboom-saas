import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * TEMPORARY endpoint to manually fix a purchase that was not recorded by the webhook.
 * Protected by a secret key. DELETE THIS FILE after use.
 *
 * Usage: POST /api/fix-purchase
 * Body: { secret, email, planName, maxPlayers, amount, stripeSessionId }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { secret, email, planName, maxPlayers, amount, stripeSessionId } = req.body;

    // Simple secret protection
    if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const { data: userList } = await supabase.auth.admin.listUsers();
    const user = userList?.users?.find(
      (u: { email?: string }) => u.email === email
    );

    if (!user) {
      return res.status(404).json({ error: `No user found with email: ${email}` });
    }

    console.log('Found user:', user.id, user.email);

    // Insert the purchase
    const { data, error } = await supabase
      .from('user_purchases')
      .insert({
        user_id: user.id,
        stripe_session_id: stripeSessionId || `manual_fix_${Date.now()}`,
        plan_name: planName || 'Party',
        max_players: maxPlayers || 50,
        amount: amount || 999,
        used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Purchase created for ${email}`,
      purchase: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Fix purchase error:', error);
    return res.status(500).json({ error: message });
  }
}
