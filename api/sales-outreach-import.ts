import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SALES_PASSWORD = process.env.SALES_OUTREACH_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

type TemplateId =
  | 'pub_with_quiz'
  | 'pub_no_quiz'
  | 'restaurant_with_quiz'
  | 'restaurant_no_quiz'
  | 'hotel_with_quiz'
  | 'hotel_no_quiz'
  | 'animation_with_quiz'
  | 'animation_no_quiz';

const VALID_TEMPLATES: string[] = [
  'pub_with_quiz', 'pub_no_quiz',
  'restaurant_with_quiz', 'restaurant_no_quiz',
  'hotel_with_quiz', 'hotel_no_quiz',
  'animation_with_quiz', 'animation_no_quiz',
];

interface CsvRow {
  venueName: string;
  email: string;
  template?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, rows } = req.body as { password: string; rows: CsvRow[] };

  if (!password || password !== SALES_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No rows to import' });
  }

  if (rows.length > 1000) {
    return res.status(400).json({ error: 'Maximum 1000 rows per import' });
  }

  try {
    // Get existing emails to skip duplicates
    const emails = rows.map((r) => r.email?.toLowerCase().trim()).filter(Boolean);
    const { data: existing } = await supabase
      .from('sales_outreach_leads')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set((existing || []).map((e: { email: string }) => e.email.toLowerCase()));

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const importedLeads: unknown[] = [];

    for (const row of rows) {
      const venueName = row.venueName?.trim();
      const email = row.email?.toLowerCase().trim();
      const template = row.template?.trim();

      // Validate
      if (!venueName || !email || !email.includes('@')) {
        errors++;
        continue;
      }

      // Skip duplicates
      if (existingEmails.has(email)) {
        skipped++;
        continue;
      }

      // Validate template if provided
      const notes = template && VALID_TEMPLATES.includes(template) ? template : null;

      const { data, error } = await supabase
        .from('sales_outreach_leads')
        .insert({
          venue_name: venueName,
          email,
          status: 'pending',
          notes,
        })
        .select()
        .single();

      if (error) {
        // Could be a race condition duplicate
        if (error.code === '23505') {
          skipped++;
        } else {
          errors++;
        }
        continue;
      }

      existingEmails.add(email); // Prevent duplicates within the batch
      importedLeads.push(data);
      imported++;
    }

    return res.status(200).json({
      imported,
      skipped,
      errors,
      total: rows.length,
      leads: importedLeads,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sales outreach import error:', message);
    return res.status(500).json({ error: message });
  }
}
