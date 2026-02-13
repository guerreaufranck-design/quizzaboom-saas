import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }

    const normalizedCode = code.trim().toUpperCase();
    console.log('🎟️ Redeeming promo code:', normalizedCode, 'for user:', userId);

    // 1. Look up the promo code
    const { data: promoCode, error: lookupError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (lookupError || !promoCode) {
      console.log('❌ Promo code not found or inactive:', normalizedCode);
      return res.status(404).json({ error: 'invalid' });
    }

    // 2. Check if expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      console.log('❌ Promo code expired:', normalizedCode);
      return res.status(410).json({ error: 'expired' });
    }

    // 3. Check if fully used
    if (promoCode.used_count >= promoCode.max_uses) {
      console.log('❌ Promo code fully redeemed:', normalizedCode);
      return res.status(410).json({ error: 'exhausted' });
    }

    // 4. Check for duplicate redemption by this user
    const { data: existing } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('stripe_session_id', `promo:${normalizedCode}`)
      .single();

    if (existing) {
      console.log('❌ User already redeemed this code:', normalizedCode);
      return res.status(409).json({ error: 'already_redeemed' });
    }

    // 5. Create the purchase (same shape as Stripe webhook creates)
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: userId,
        stripe_session_id: `promo:${normalizedCode}`,
        plan_name: promoCode.plan_name,
        max_players: promoCode.max_players,
        amount: 0,
        used: false,
      });

    if (purchaseError) {
      console.error('❌ Failed to create purchase:', purchaseError);
      return res.status(500).json({ error: 'Failed to create purchase' });
    }

    // 6. Increment used_count
    const { error: updateError } = await supabase
      .from('promo_codes')
      .update({ used_count: promoCode.used_count + 1 })
      .eq('code', normalizedCode);

    if (updateError) {
      console.error('⚠️ Failed to increment used_count:', updateError);
      // Non-blocking — purchase was already created
    }

    console.log('✅ Promo code redeemed:', normalizedCode, '→', promoCode.plan_name);

    return res.status(200).json({
      success: true,
      planName: promoCode.plan_name,
      maxPlayers: promoCode.max_players,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Promo redeem error:', message);
    return res.status(500).json({ error: message });
  }
}
