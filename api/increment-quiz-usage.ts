import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/increment-quiz-usage
 *
 * Increments the quiz usage counter for a B2B organization.
 * Uses service role key to bypass RLS on the organizations table.
 *
 * Body: { organizationId: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'Missing organizationId' });
  }

  try {
    // Fetch current usage
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('quizzes_used_this_month, monthly_quiz_limit, subscription_plan, subscription_status')
      .eq('id', organizationId)
      .single();

    if (fetchError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const newCount = (org.quizzes_used_this_month || 0) + 1;

    // Update usage counter
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ quizzes_used_this_month: newCount })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Failed to increment quiz usage:', updateError);
      return res.status(500).json({ error: 'Failed to update usage' });
    }

    console.log(`✅ Quiz usage incremented for org ${organizationId}: ${newCount}`);

    return res.status(200).json({
      quizzes_used_this_month: newCount,
      monthly_quiz_limit: org.monthly_quiz_limit,
    });
  } catch (error) {
    console.error('Increment quiz usage error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
