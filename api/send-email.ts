import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface PlayerResult {
  playerName: string;
  email: string;
  score: number;
  rank: number;
  totalPlayers: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  bestStreak: number;
}

interface EmailRequest {
  type: 'quiz_results';
  sessionId: string;
  quizTitle: string;
  players: PlayerResult[];
}

async function sendWithSendGrid(to: string, subject: string, htmlContent: string) {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');
    return false;
  }

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
        content: [{ type: 'text/html', value: htmlContent }],
      }),
    });

    return response.status === 202;
  } catch (error) {
    console.error('SendGrid send error:', error);
    return false;
  }
}

function buildResultsEmail(player: PlayerResult, quizTitle: string): string {
  const medalEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '🎮';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="text-align:center;padding:30px 20px;background:linear-gradient(135deg,#8B3FE8,#00D4FF);border-radius:16px 16px 0 0;">
      <h1 style="color:#fff;font-size:28px;margin:0;">QuizzaBoom</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:8px 0 0;">Your Quiz Results</p>
    </div>

    <!-- Results Card -->
    <div style="background:#1a1a2e;padding:30px;border-radius:0 0 16px 16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:8px;">${medalEmoji}</div>
        <h2 style="color:#fff;font-size:24px;margin:0 0 8px;">Hey ${player.playerName}!</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;">Here are your results for <strong style="color:#00D4FF;">${quizTitle}</strong></p>
      </div>

      <!-- Stats Grid -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#00D4FF;">#${player.rank}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">Rank / ${player.totalPlayers}</div>
        </div>
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#E91E8C;">${player.score}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">Points</div>
        </div>
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:bold;color:#FFD700;">${player.accuracy}%</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">Accuracy</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:rgba(255,255,255,0.6);">Correct answers</span>
          <span style="color:#fff;font-weight:bold;">${player.correctAnswers}/${player.totalQuestions}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:rgba(255,255,255,0.6);">Best streak</span>
          <span style="color:#fff;font-weight:bold;">${player.bestStreak} in a row</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.1);">
        <p style="color:rgba(255,255,255,0.8);margin:0 0 16px;">Want to host your own quiz?</p>
        <a href="https://quizzaboom.com/pricing" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8B3FE8,#E91E8C);color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
          Create Your Own Quiz
        </a>
        <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:12px 0 0;">
          Starting at $1.99 - No subscription required!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);font-size:11px;">
      <p style="margin:0 0 8px;">QuizzaBoom - Turn Any Gathering Into An Epic Quiz Battle!</p>
      <p style="margin:0;">
        <a href="https://quizzaboom.com/unsubscribe" style="color:rgba(255,255,255,0.4);">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, sessionId, quizTitle, players } = req.body as EmailRequest;

  if (type !== 'quiz_results' || !sessionId || !players?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const player of players) {
    if (!player.email) {
      results.skipped++;
      continue;
    }

    const subject = `Your QuizzaBoom Results - ${quizTitle}`;
    const html = buildResultsEmail(player, quizTitle);
    const success = await sendWithSendGrid(player.email, subject, html);

    if (success) {
      results.sent++;

      // Track email sent in participant_emails table
      await supabase.from('participant_emails').upsert(
        {
          session_id: sessionId,
          player_name: player.playerName,
          email: player.email,
          quiz_results: {
            score: player.score,
            rank: player.rank,
            totalPlayers: player.totalPlayers,
            correctAnswers: player.correctAnswers,
            totalQuestions: player.totalQuestions,
            accuracy: player.accuracy,
            bestStreak: player.bestStreak,
          },
          email_sent_at: new Date().toISOString(),
        },
        { onConflict: 'session_id,email' }
      );
    } else {
      results.failed++;
    }
  }

  return res.status(200).json({ results });
}
