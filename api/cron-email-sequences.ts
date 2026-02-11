import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!SENDGRID_API_KEY) return false;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    return response.status === 202;
  } catch {
    return false;
  }
}

function buildReengagementEmail(playerName: string, daysSince: number): { subject: string; html: string } {
  const subject = daysSince <= 3
    ? `${playerName}, ready for another quiz battle?`
    : daysSince <= 7
    ? `${playerName}, your friends are playing QuizzaBoom!`
    : `${playerName}, special offer inside - Host your own quiz!`;

  const ctaText = daysSince <= 3
    ? 'Join a Quiz Now'
    : daysSince <= 7
    ? 'Host Your Own Quiz'
    : 'Get Started for $1.99';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#8B3FE8,#00D4FF);border-radius:16px 16px 0 0;">
      <h1 style="color:#fff;font-size:28px;margin:0;">QuizzaBoom</h1>
    </div>
    <div style="background:#1a1a2e;padding:30px;border-radius:0 0 16px 16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#fff;font-size:24px;margin:0 0 12px;">Hey ${playerName}!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:16px;">
          ${daysSince <= 3
            ? 'Had fun at the quiz? There are more epic battles waiting for you!'
            : daysSince <= 7
            ? 'Did you know you can host your own quiz for your friends, family, or colleagues?'
            : 'Create unforgettable moments with your own AI-powered quiz!'}
        </p>
      </div>

      ${daysSince > 3 ? `
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="text-align:center;">
          <p style="color:#00D4FF;font-weight:bold;font-size:18px;margin:0 0 8px;">Why Host a QuizzaBoom?</p>
          <ul style="color:rgba(255,255,255,0.8);text-align:left;padding-left:20px;margin:0;">
            <li style="margin-bottom:8px;">AI generates unique questions instantly</li>
            <li style="margin-bottom:8px;">Up to 250 players via QR code</li>
            <li style="margin-bottom:8px;">Strategic jokers for epic gameplay</li>
            <li>Real-time leaderboard</li>
          </ul>
        </div>
      </div>` : ''}

      <div style="text-align:center;padding:20px 0;">
        <a href="https://quizzaboom.com/pricing" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B3FE8,#E91E8C);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
          ${ctaText}
        </a>
      </div>
    </div>
    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);font-size:11px;">
      <p style="margin:0 0 8px;">QuizzaBoom - Turn Any Gathering Into An Epic Quiz Battle!</p>
      <p style="margin:0;"><a href="https://quizzaboom.com/unsubscribe" style="color:rgba(255,255,255,0.4);">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const results = { j3: 0, j7: 0, j14: 0, errors: 0 };

  try {
    // Find participants who played recently and haven't been re-engaged yet
    const now = new Date();

    // J+3: Players who played 3 days ago, received quiz results, but no marketing email yet
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    const { data: j3Players } = await supabase
      .from('participant_emails')
      .select('*')
      .not('email_sent_at', 'is', null)
      .is('marketing_email_sent_at', null)
      .gte('email_sent_at', fourDaysAgo.toISOString())
      .lt('email_sent_at', threeDaysAgo.toISOString())
      .limit(50);

    for (const player of j3Players || []) {
      const { subject, html } = buildReengagementEmail(player.player_name, 3);
      const sent = await sendEmail(player.email, subject, html);
      if (sent) {
        results.j3++;
        await supabase
          .from('participant_emails')
          .update({ marketing_email_sent_at: now.toISOString() })
          .eq('id', player.id);
      } else {
        results.errors++;
      }
    }

    // J+7: Players from 7 days ago who already received J+3 but no J+7
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const { data: j7Players } = await supabase
      .from('participant_emails')
      .select('*')
      .not('marketing_email_sent_at', 'is', null)
      .is('marketing_email_opened_at', null) // Only target those who haven't opened J+3
      .gte('email_sent_at', eightDaysAgo.toISOString())
      .lt('email_sent_at', sevenDaysAgo.toISOString())
      .is('converted_to_customer_at', null) // Not already converted
      .limit(50);

    for (const player of j7Players || []) {
      const { subject, html } = buildReengagementEmail(player.player_name, 7);
      const sent = await sendEmail(player.email, subject, html);
      if (sent) {
        results.j7++;
      } else {
        results.errors++;
      }
    }

    // J+14: Final attempt for players who haven't converted
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const { data: j14Players } = await supabase
      .from('participant_emails')
      .select('*')
      .not('marketing_email_sent_at', 'is', null)
      .gte('email_sent_at', fifteenDaysAgo.toISOString())
      .lt('email_sent_at', fourteenDaysAgo.toISOString())
      .is('converted_to_customer_at', null)
      .limit(50);

    for (const player of j14Players || []) {
      const { subject, html } = buildReengagementEmail(player.player_name, 14);
      const sent = await sendEmail(player.email, subject, html);
      if (sent) {
        results.j14++;
      } else {
        results.errors++;
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Cron email error:', error);
    return res.status(500).json({ error: 'Cron job failed' });
  }
}
