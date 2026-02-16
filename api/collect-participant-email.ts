import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/collect-participant-email
 *
 * Collects a participant's email into the participant_emails table.
 * Uses service role key to bypass RLS.
 *
 * Body: { sessionId, playerName, email, organizationId? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, playerName, email, organizationId } = req.body;

  if (!sessionId || !email) {
    return res.status(400).json({ error: 'Missing sessionId or email' });
  }

  try {
    const { error } = await supabase.from('participant_emails').upsert(
      {
        session_id: sessionId,
        player_name: playerName || 'Anonymous',
        email,
        ...(organizationId ? { source_organization_id: organizationId } : {}),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'session_id,email' }
    );

    if (error) {
      console.error('Failed to collect participant email:', error);
      return res.status(500).json({ error: 'Failed to collect email' });
    }

    console.log(`✅ Participant email collected: ${email} for session ${sessionId}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Collect participant email error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
