import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

type Lang = 'fr' | 'en' | 'de' | 'es';

interface InviteI18n {
  subject: (orgName: string) => string;
  headline: (orgName: string) => string;
  body: (orgName: string, dateStr: string, timeStr: string) => string;
  cta: string;
  footer: string;
  unsubscribe: string;
}

const i18n: Record<Lang, InviteI18n> = {
  en: {
    subject: (org) => `🎯 ${org} invites you to the next quiz!`,
    headline: (org) => `${org} invites you to the next quiz!`,
    body: (org, date, time) =>
      `Great news! <strong>${org}</strong> is hosting a new QuizzaBoom quiz night and you're invited!<br><br>` +
      `📅 <strong>${date}</strong><br>` +
      `🕐 <strong>${time}</strong><br><br>` +
      `Get ready for an epic quiz battle — all you need is your phone and a competitive spirit!`,
    cta: 'Join QuizzaBoom',
    footer: 'See you there! The QuizzaBoom Team',
    unsubscribe: 'Unsubscribe',
  },
  fr: {
    subject: (org) => `🎯 ${org} vous invite au prochain quiz !`,
    headline: (org) => `${org} vous invite au prochain quiz !`,
    body: (org, date, time) =>
      `Bonne nouvelle ! <strong>${org}</strong> organise une nouvelle soiree quiz QuizzaBoom et vous etes invite(e) !<br><br>` +
      `📅 <strong>${date}</strong><br>` +
      `🕐 <strong>${time}</strong><br><br>` +
      `Preparez-vous pour une bataille de quiz epique — il vous suffit d'avoir votre telephone et un esprit de competition !`,
    cta: 'Rejoindre QuizzaBoom',
    footer: 'A bientot ! L\'equipe QuizzaBoom',
    unsubscribe: 'Se desinscrire',
  },
  de: {
    subject: (org) => `🎯 ${org} ladt dich zum nachsten Quiz ein!`,
    headline: (org) => `${org} ladt dich zum nachsten Quiz ein!`,
    body: (org, date, time) =>
      `Tolle Neuigkeiten! <strong>${org}</strong> veranstaltet einen neuen QuizzaBoom Quiz-Abend und du bist eingeladen!<br><br>` +
      `📅 <strong>${date}</strong><br>` +
      `🕐 <strong>${time}</strong><br><br>` +
      `Mach dich bereit fur ein episches Quiz-Battle — alles was du brauchst ist dein Handy und Kampfgeist!`,
    cta: 'QuizzaBoom beitreten',
    footer: 'Bis dann! Das QuizzaBoom Team',
    unsubscribe: 'Abmelden',
  },
  es: {
    subject: (org) => `🎯 ${org} te invita al proximo quiz!`,
    headline: (org) => `${org} te invita al proximo quiz!`,
    body: (org, date, time) =>
      `Buenas noticias! <strong>${org}</strong> organiza una nueva noche de quiz QuizzaBoom y estas invitado/a!<br><br>` +
      `📅 <strong>${date}</strong><br>` +
      `🕐 <strong>${time}</strong><br><br>` +
      `Preparate para una batalla de quiz epica — solo necesitas tu telefono y espiritu competitivo!`,
    cta: 'Unirse a QuizzaBoom',
    footer: 'Nos vemos! El equipo QuizzaBoom',
    unsubscribe: 'Darse de baja',
  },
};

function getLang(lang?: string): Lang {
  if (lang && ['fr', 'en', 'de', 'es'].includes(lang)) return lang as Lang;
  return 'en';
}

function buildInviteEmail(orgName: string, dateStr: string, timeStr: string, lang: Lang): string {
  const t = i18n[lang];

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>QuizzaBoom Invite</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#0a0a1a;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:16px 16px 0 0;overflow:hidden;">
      <tr>
        <td style="text-align:center;padding:30px 20px;background-color:#7B2FD8;">
          <h1 style="color:#ffffff;font-size:32px;margin:0;letter-spacing:-1px;">QuizzaBoom</h1>
          <p style="color:#E0E0FF;font-size:16px;margin:8px 0 0;">🎯</p>
        </td>
      </tr>
    </table>

    <!-- Main Content -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#1a1a2e;padding:40px 30px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:56px;margin-bottom:16px;">🎉</div>
            <h2 style="color:#ffffff;font-size:24px;margin:0 0 16px;line-height:1.4;">${t.headline(orgName)}</h2>
          </div>

          <!-- Event Details Card -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
            <tr>
              <td style="background-color:#12122a;border-radius:12px;padding:24px;border:1px solid #2a2a4a;">
                <p style="color:#D0D0E0;font-size:16px;line-height:1.8;margin:0;">
                  ${t.body(orgName, dateStr, timeStr)}
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;">
                <a href="https://quizzaboom.app" style="display:inline-block;padding:18px 48px;background-color:#C91E7C;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:900;font-size:18px;letter-spacing:0.5px;">
                  ${t.cta}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:0 0 16px 16px;overflow:hidden;">
      <tr>
        <td style="text-align:center;padding:20px;background-color:#0a0a1a;">
          <p style="color:#8080A0;font-size:13px;margin:0 0 8px;">${t.footer}</p>
          <p style="margin:0;">
            <a href="https://quizzaboom.app/unsubscribe" style="color:#6060A0;font-size:11px;">${t.unsubscribe}</a>
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { organizationId, eventDate, eventTime, paymentIntentId } = req.body;

  if (!organizationId || !eventDate || !eventTime) {
    return res.status(400).json({ error: 'Missing required fields: organizationId, eventDate, eventTime' });
  }

  try {
    // 1. Verify the organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // 2. Verify payment if paymentIntentId provided
    if (paymentIntentId) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return res.status(402).json({ error: 'Payment not completed' });
      }
    }

    // 3. Fetch unique contacts for this organization
    const { data: contacts, error: contactsError } = await supabase
      .from('participant_emails')
      .select('player_name, email, language')
      .eq('source_organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (contactsError) {
      return res.status(500).json({ error: 'Failed to fetch contacts' });
    }

    // Deduplicate by email (keep most recent)
    const emailMap = new Map<string, { player_name: string; email: string; language: string | null }>();
    for (const c of contacts || []) {
      if (!emailMap.has(c.email)) {
        emailMap.set(c.email, c);
      }
    }
    const uniqueContacts = Array.from(emailMap.values());

    if (uniqueContacts.length === 0) {
      return res.status(200).json({ results: { sent: 0, failed: 0, total: 0 }, message: 'No contacts to send to' });
    }

    // 4. Send emails
    const results = { sent: 0, failed: 0, total: uniqueContacts.length };

    for (const contact of uniqueContacts) {
      const lang = getLang(contact.language || undefined);
      const t = i18n[lang];
      const subject = t.subject(org.name);
      const html = buildInviteEmail(org.name, eventDate, eventTime, lang);

      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: contact.email }] }],
            from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
            subject,
            content: [{ type: 'text/html', value: html }],
          }),
        });

        if (response.status === 202) {
          results.sent++;
        } else {
          results.failed++;
        }
      } catch {
        results.failed++;
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Send invite email error:', message);
    return res.status(500).json({ error: message });
  }
}
