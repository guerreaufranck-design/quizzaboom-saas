import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
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
    const { password, action } = req.body;

    // Auth check
    const adminPassword = process.env.SALES_PASSWORD || process.env.VITE_SALES_PASSWORD || '';
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (action === 'get_codes') {
      // Get all promo codes with usage stats
      const { data: codes, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get redemption details for each code
      const codeNames = (codes || []).map((c) => `promo:${c.code}`);
      const { data: purchases, error: purchaseError } = await supabase
        .from('user_purchases')
        .select('stripe_session_id, user_id, created_at, used')
        .in('stripe_session_id', codeNames);

      if (purchaseError) throw purchaseError;

      // Build redemption map: code → array of redemptions
      const redemptionMap: Record<string, Array<{ user_id: string; redeemed_at: string; quiz_used: boolean }>> = {};
      for (const p of purchases || []) {
        const code = p.stripe_session_id.replace('promo:', '');
        if (!redemptionMap[code]) redemptionMap[code] = [];
        redemptionMap[code].push({
          user_id: p.user_id,
          redeemed_at: p.created_at,
          quiz_used: p.used,
        });
      }

      // Enrich codes with redemption data
      const enrichedCodes = (codes || []).map((c) => ({
        ...c,
        redemptions: redemptionMap[c.code] || [],
      }));

      return res.status(200).json({ codes: enrichedCodes });
    }

    if (action === 'toggle_active') {
      const { codeId, isActive } = req.body;
      if (!codeId) return res.status(400).json({ error: 'Missing codeId' });

      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive })
        .eq('id', codeId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (action === 'create_code') {
      const { code, planName, maxPlayers, maxUses, expiresAt } = req.body;
      if (!code || !planName || !maxPlayers || !maxUses) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: code.trim().toUpperCase(),
          plan_name: planName,
          max_players: maxPlayers,
          max_uses: maxUses,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ code: data });
    }

    if (action === 'delete_code') {
      const { codeId } = req.body;
      if (!codeId) return res.status(400).json({ error: 'Missing codeId' });

      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Promo tracking error:', message);
    return res.status(500).json({ error: message });
  }
}
