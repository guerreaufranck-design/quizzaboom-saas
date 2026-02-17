import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/update-player
 *
 * Updates session_players fields that can't be updated client-side due to RLS.
 * Uses service role key to bypass RLS.
 *
 * Body: { playerId: string, updates: Record<string, any> }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playerId, updates } = req.body;

  if (!playerId || !updates) {
    return res.status(400).json({ error: 'Missing playerId or updates' });
  }

  // Whitelist allowed fields to prevent abuse
  const allowedFields = [
    'current_streak', 'best_streak', 'is_connected', 'last_activity',
    'total_score', 'correct_answers', 'questions_answered',
    'accuracy_percentage', 'threat_level',
    'protection_uses_remaining', 'block_uses_remaining',
    'steal_uses_remaining', 'double_points_uses_remaining',
    'strategic_actions_taken', 'successful_strategic_actions',
    'settings', 'updated_at',
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = value;
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const { error } = await supabase
      .from('session_players')
      .update(sanitized)
      .eq('id', playerId);

    if (error) {
      console.error('Failed to update player:', error);
      return res.status(500).json({ error: 'Failed to update player' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update player error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
