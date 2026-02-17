import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';
const SALES_PASSWORD = process.env.SALES_OUTREACH_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

function buildOutreachEmail(venueName: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>QuizzaBoom for ${venueName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Main Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr>
        <td style="background-color:#7B2FD8;padding:28px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:28px;margin:0;letter-spacing:-0.5px;">QuizzaBoom</h1>
          <p style="color:#E0E0FF;font-size:14px;margin:6px 0 0;">AI-Powered Quiz Nights</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:36px 32px;">
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">
            Hi <strong>${venueName}</strong> team,
          </p>
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 20px;">
            I noticed you could be a great fit for <strong>QuizzaBoom</strong> — an AI-powered quiz platform built specifically for pubs, bars and restaurants.
          </p>

          <!-- Key Benefits -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background-color:#f9f5ff;border-radius:10px;border:1px solid #e8ddf5;">
            <tr>
              <td style="padding:24px;">
                <p style="color:#5B21B6;font-size:15px;font-weight:bold;margin:0 0 14px;">Why venues love QuizzaBoom:</p>
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding:4px 0;color:#333;font-size:15px;line-height:1.5;">
                      <strong style="color:#7B2FD8;">90 seconds</strong> to set up a full quiz night — AI generates all questions
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#333;font-size:15px;line-height:1.5;">
                      Up to <strong style="color:#7B2FD8;">250 players</strong> join via QR code — no app download needed
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#333;font-size:15px;line-height:1.5;">
                      Runs <strong style="color:#7B2FD8;">100% automatically</strong> on your TV — staff can focus on service
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#333;font-size:15px;line-height:1.5;">
                      Venues report <strong style="color:#7B2FD8;">+30% in sales</strong> on quiz nights
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#333;font-size:15px;line-height:1.5;">
                      Built-in <strong style="color:#7B2FD8;">commercial breaks</strong> to promote your specials on the big screen
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
            We're offering a <strong>free 30-day trial</strong> — no credit card required. You could have your first quiz night running this week.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;padding:8px 0;">
                <a href="https://quizzaboom.app/pricing" style="display:inline-block;padding:16px 40px;background-color:#7B2FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  Start Your Free Trial
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#333;font-size:16px;line-height:1.6;margin:24px 0 0;">
            Happy to answer any questions or set up a quick demo for your team.
          </p>
          <p style="color:#333;font-size:16px;line-height:1.6;margin:16px 0 0;">
            Cheers,<br>
            <strong>The QuizzaBoom Team</strong>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0 0 4px;">QuizzaBoom — AI-Powered Quiz Nights for Venues</p>
          <p style="color:#999;font-size:12px;margin:0;">
            <a href="https://quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">quizzaboom.app</a>
          </p>
          <p style="margin:8px 0 0;">
            <a href="https://quizzaboom.app/unsubscribe" style="color:#bbb;font-size:11px;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prospects, password } = req.body;

  if (!password || password !== SALES_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!prospects || !Array.isArray(prospects) || prospects.length === 0) {
    return res.status(400).json({ error: 'Missing prospects array' });
  }

  try {
    const results: { email: string; status: 'sent' | 'failed' }[] = [];
    let sent = 0;
    let failed = 0;

    for (const prospect of prospects) {
      const { venueName, email, id } = prospect;
      if (!venueName || !email) {
        results.push({ email: email || 'unknown', status: 'failed' });
        failed++;
        continue;
      }

      const subject = `Fill your venue on quiet nights — AI-powered quiz nights in 90 seconds`;
      const html = buildOutreachEmail(venueName);

      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });

        const success = response.status === 202;
        const status = success ? 'sent' : 'failed';

        // Update lead status in DB
        if (id) {
          await supabase
            .from('sales_outreach_leads')
            .update({
              status,
              sent_at: success ? new Date().toISOString() : null,
            })
            .eq('id', id);
        }

        results.push({ email, status });
        if (success) sent++;
        else failed++;
      } catch {
        if (id) {
          await supabase
            .from('sales_outreach_leads')
            .update({ status: 'failed' })
            .eq('id', id);
        }
        results.push({ email, status: 'failed' });
        failed++;
      }
    }

    return res.status(200).json({ sent, failed, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sales outreach send error:', message);
    return res.status(500).json({ error: message });
  }
}
