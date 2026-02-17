import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SALES_PASSWORD = process.env.SALES_OUTREACH_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, days = 90 } = req.body;

  if (!password || password !== SALES_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Fetch organizations with their verification requests for extra details
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, type, subscription_plan, subscription_status, trial_ends_at, quizzes_used_this_month, monthly_quiz_limit, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (orgError) {
      return res.status(500).json({ error: 'Failed to fetch organizations' });
    }

    // Fetch verification requests to get country + business details
    const orgIds = (orgs || []).map((o: { id: string }) => o.id);
    let verifications: Record<string, { country: string; business_name: string; city: string; business_type: string; status: string }> = {};

    if (orgIds.length > 0) {
      const { data: verifs } = await supabase
        .from('verification_requests')
        .select('organization_id, country, business_name, city, business_type, status')
        .in('organization_id', orgIds);

      if (verifs) {
        for (const v of verifs) {
          verifications[v.organization_id] = {
            country: v.country || '',
            business_name: v.business_name || '',
            city: v.city || '',
            business_type: v.business_type || '',
            status: v.status || '',
          };
        }
      }
    }

    // Combine data
    const signups = (orgs || []).map((org: {
      id: string;
      name: string;
      type: string;
      subscription_plan: string;
      subscription_status: string;
      trial_ends_at: string;
      quizzes_used_this_month: number;
      monthly_quiz_limit: number;
      created_at: string;
    }) => {
      const verif = verifications[org.id] || {};
      return {
        id: org.id,
        name: org.name,
        type: org.type,
        plan: org.subscription_plan,
        status: org.subscription_status,
        trial_ends_at: org.trial_ends_at,
        quizzes_used: org.quizzes_used_this_month,
        quiz_limit: org.monthly_quiz_limit,
        created_at: org.created_at,
        country: verif.country || '',
        city: verif.city || '',
        business_type: verif.business_type || '',
        verification_status: verif.status || 'none',
      };
    });

    return res.status(200).json({ signups, total: signups.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sales outreach signups error:', message);
    return res.status(500).json({ error: message });
  }
}
