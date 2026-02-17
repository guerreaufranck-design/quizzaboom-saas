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

  const { password, venueName, email, template } = req.body;

  if (!password || password !== SALES_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!venueName || !email) {
    return res.status(400).json({ error: 'Missing venueName or email' });
  }

  try {
    // Check duplicate
    const { data: existing } = await supabase
      .from('sales_outreach_leads')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists', existingId: existing[0].id });
    }

    const { data, error } = await supabase
      .from('sales_outreach_leads')
      .insert({
        venue_name: venueName,
        email: email.toLowerCase(),
        status: 'pending',
        notes: template || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to add lead' });
    }

    return res.status(200).json({ lead: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sales outreach add error:', message);
    return res.status(500).json({ error: message });
  }
}
