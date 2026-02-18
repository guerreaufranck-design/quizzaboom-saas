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

// ─── Template types ─────────────────────────────────────────────
type TemplateId =
  | 'pub_with_quiz'
  | 'pub_no_quiz'
  | 'restaurant_with_quiz'
  | 'restaurant_no_quiz'
  | 'hotel_with_quiz'
  | 'hotel_no_quiz'
  | 'animation_with_quiz'
  | 'animation_no_quiz';

interface TemplateContent {
  subject: string;
  greeting: string;
  intro: string;
  painTitle: string;
  painPoints: string[];
  solutionTitle: string;
  solutionPoints: string[];
  closing: string;
  cta: string;
}

function getTemplate(templateId: TemplateId, venueName: string): TemplateContent {
  const templates: Record<TemplateId, TemplateContent> = {

    // ── PUB WITH EXISTING QUIZ ──
    pub_with_quiz: {
      subject: `${venueName} — your quiz nights could run themselves`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `I can see you already run quiz nights — brilliant, you know how much they boost atmosphere and sales. But let's be honest... the prep is a different story.`,
      painTitle: `The weekly grind you know too well:`,
      painPoints: [
        `Hours writing or sourcing questions every single week`,
        `Regulars complaining about recycled or repeated questions`,
        `A quizmaster to pay — or staff pulled away from the bar`,
        `Pen, paper, answer sheets... counting scores manually`,
        `Hard to scale beyond 30-40 players per night`,
      ],
      solutionTitle: `With QuizzaBoom, all of that disappears:`,
      solutionPoints: [
        `AI generates <strong>100% unique questions</strong> every time — never a repeat`,
        `Set up in <strong>90 seconds</strong>, runs fully automatically on your TV`,
        `Players join on their phones via QR code — <strong>no paper, no app download</strong>`,
        `Up to <strong>250 players</strong> at once with real-time scoring and leaderboard`,
        `Built-in <strong>commercial breaks</strong> to push your drink specials on the big screen`,
        `<strong>Got multiple venues?</strong> Run the same quiz at the same time across all your locations — same questions, real-time sync. Create epic <strong>inter-venue battles</strong> with a live cross-location leaderboard. Players can compete solo or in teams.`,
      ],
      closing: `Free 30-day trial — no credit card. You could swap to QuizzaBoom this week without changing your schedule.`,
      cta: `Try It This Week`,
    },

    // ── PUB WITHOUT QUIZ ──
    pub_no_quiz: {
      subject: `${venueName} — fill your quiet nights with zero effort`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `I'm reaching out because quiz nights are one of the most effective ways to pack a pub on quieter evenings — and we've made it ridiculously easy to get started.`,
      painTitle: `Why most pubs don't run quiz nights:`,
      painPoints: [
        `Writing questions every week takes hours nobody has`,
        `Hiring a quizmaster is expensive and unreliable`,
        `Managing paper rounds, scores and disputes is a headache`,
        `It seems like a lot of effort for an uncertain return`,
      ],
      solutionTitle: `QuizzaBoom removes every barrier:`,
      solutionPoints: [
        `AI generates all the questions for you — <strong>fresh every single week</strong>`,
        `Set up in <strong>90 seconds</strong>, runs <strong>100% automatically</strong> on your TV`,
        `Players join via QR code on their phones — <strong>no app, no paper, no pens</strong>`,
        `Up to <strong>250 players</strong> with live leaderboard and real-time scoring`,
        `Built-in <strong>commercial breaks</strong> to promote your specials on the big screen`,
        `Pubs using QuizzaBoom report <strong>2x footfall</strong> on quiz nights vs regular evenings`,
      ],
      closing: `Free 30-day trial — no credit card required. You could have your first quiz night this week.`,
      cta: `Start Your Free Trial`,
    },

    // ── RESTAURANT WITH EXISTING QUIZ ──
    restaurant_with_quiz: {
      subject: `${venueName} — upgrade your quiz nights, keep your tables full`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `Love that you're already running quiz events — it's a brilliant way to drive midweek covers. But I'm guessing the prep takes more time than the event itself.`,
      painTitle: `The hidden cost of DIY quiz nights:`,
      painPoints: [
        `Hours spent writing questions instead of focusing on the restaurant`,
        `Same regulars, same complaints about repeated content`,
        `Pen and paper rounds that slow down table service`,
        `Scoring disputes and messy logistics`,
        `Hard to create a premium experience that matches your brand`,
      ],
      solutionTitle: `QuizzaBoom gives you a polished experience with zero prep:`,
      solutionPoints: [
        `AI creates <strong>100% unique questions</strong> every time — themed to your preference`,
        `<strong>90-second setup</strong>, runs automatically on your screen — staff stays on the floor`,
        `Guests play on their phones via QR code — <strong>no paper cluttering tables</strong>`,
        `Real-time leaderboard keeps energy high between courses`,
        `<strong>Commercial breaks</strong> to promote your menu specials, desserts, or wine pairings`,
        `<strong>Multiple locations?</strong> Run the same quiz simultaneously across all your restaurants — same questions, real-time sync. Create <strong>inter-venue battles</strong> with a live leaderboard. Guests play solo or as teams (table vs table).`,
      ],
      closing: `Free 30-day trial, no credit card. Perfect to test on your next quiet midweek evening.`,
      cta: `Try It This Week`,
    },

    // ── RESTAURANT WITHOUT QUIZ ──
    restaurant_no_quiz: {
      subject: `${venueName} — the easiest way to fill midweek tables`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `Midweek evenings can be tough for restaurants. We've helped hundreds of venues turn their quietest nights into their busiest — with AI-powered quiz events that take zero effort.`,
      painTitle: `Why restaurants hesitate with quiz nights:`,
      painPoints: [
        `"It's a pub thing, not a restaurant thing"`,
        `Writing questions seems like a huge time investment`,
        `Paper rounds feel messy and out of place in a dining setting`,
        `Worried it might cheapen the brand or atmosphere`,
      ],
      solutionTitle: `QuizzaBoom is designed to feel premium:`,
      solutionPoints: [
        `Sleek TV display with <strong>beautiful animated graphics</strong> — no tacky pub-quiz feel`,
        `AI generates fresh questions in seconds — <strong>zero prep, ever</strong>`,
        `Guests play on their phones (QR code) — <strong>no paper, no pens, tables stay clean</strong>`,
        `<strong>Commercial breaks</strong> to promote desserts, wine pairings, or upcoming events`,
        `Perfect for <strong>"Table vs Table" team mode</strong> — creates fun without chaos`,
        `Set up in <strong>90 seconds</strong>, runs fully automatically`,
      ],
      closing: `Free 30-day trial — no credit card. A low-risk way to boost midweek covers.`,
      cta: `Start Your Free Trial`,
    },

    // ── HOTEL WITH EXISTING QUIZ/ENTERTAINMENT ──
    hotel_with_quiz: {
      subject: `${venueName} — elevate your guest entertainment effortlessly`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `I noticed you already offer entertainment or quiz events for your guests — great way to keep them on-site and spending at the bar. We can help you do even more, with far less effort.`,
      painTitle: `The challenge with in-house entertainment:`,
      painPoints: [
        `Finding fresh content every week for returning guests`,
        `Coordinating a host or entertainer — schedules, fees, no-shows`,
        `Different guest demographics each night (families, couples, groups)`,
        `Keeping it engaging enough that guests stay for extra drinks`,
      ],
      solutionTitle: `QuizzaBoom is built for hospitality:`,
      solutionPoints: [
        `AI generates <strong>unlimited fresh questions</strong> — perfect for guests who stay multiple nights`,
        `<strong>3 game modes</strong>: Standard, Funny (surprising facts), and Kids (ages 6-12)`,
        `Runs on your lobby/bar TV — <strong>100% automatic, no host needed</strong>`,
        `Guests join via QR code on their phones — <strong>no app, no download</strong>`,
        `<strong>Commercial breaks</strong> to promote spa, restaurant, excursions, or happy hour`,
        `Supports <strong>4 languages</strong> (English, French, German, Spanish) — ideal for international guests`,
        `<strong>Multi-property group?</strong> Run the same quiz across all your hotels at the same time — same questions, live sync. Create <strong>inter-hotel battles</strong> with a shared leaderboard. Guests play individually or in teams.`,
      ],
      closing: `Free 30-day trial — no credit card. Could be running in your bar by this weekend.`,
      cta: `Try It This Week`,
    },

    // ── HOTEL WITHOUT QUIZ ──
    hotel_no_quiz: {
      subject: `${venueName} — keep guests on-site and spending with zero effort`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `The biggest revenue leak for hotels? Guests leaving the premises for evening entertainment. QuizzaBoom gives you an effortless way to keep them at your bar — spending, socialising, and having a brilliant time.`,
      painTitle: `The evening entertainment gap:`,
      painPoints: [
        `Guests eat dinner then leave for outside entertainment`,
        `Bar revenue drops after 9pm on quieter nights`,
        `Hiring entertainers is expensive and hard to schedule consistently`,
        `Need something that works for all guest types — families, couples, groups`,
      ],
      solutionTitle: `QuizzaBoom turns any evening into an event:`,
      solutionPoints: [
        `AI generates all questions — <strong>set up in 90 seconds, zero prep</strong>`,
        `Beautiful display on your bar/lounge TV — <strong>runs fully automatically</strong>`,
        `Guests join via QR code on their phones — <strong>no app, works in any language</strong>`,
        `<strong>Kids mode</strong> (6-12) for family-friendly nights, <strong>standard mode</strong> for adults`,
        `<strong>Commercial breaks</strong> to promote late-night menu, cocktails, or spa offers`,
        `Fresh content every night — <strong>perfect for multi-night stays</strong>`,
      ],
      closing: `Free 30-day trial — no credit card required. Try it for your next guest evening.`,
      cta: `Start Your Free Trial`,
    },

    // ── ANIMATION SERVICE WITH EXISTING QUIZ ──
    animation_with_quiz: {
      subject: `${venueName} — offer unlimited quiz nights to your clients`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `I see you already offer entertainment and quiz services — fantastic. QuizzaBoom can help you scale your quiz offering to unlimited clients while cutting your prep time to zero.`,
      painTitle: `The bottleneck every animation company faces:`,
      painPoints: [
        `Writing unique questions for each client, each week — it never ends`,
        `Relying on hosts who might cancel, be inconsistent, or cost too much`,
        `Difficult to run multiple events on the same night in different locations`,
        `Pen-and-paper format limits the experience and the crowd size`,
        `Clients eventually churn because the content feels repetitive`,
      ],
      solutionTitle: `QuizzaBoom as your secret weapon:`,
      solutionPoints: [
        `AI generates <strong>100% unique questions</strong> for every event — infinite variety`,
        `<strong>White-label option</strong>: your branding on the TV screen, not ours`,
        `Run <strong>multiple events simultaneously</strong> — each with its own unique quiz`,
        `Up to <strong>250 players per event</strong> with real-time scoring — zero paper`,
        `<strong>Strategic Joker system</strong> (steal, block, double points) adds competitive drama`,
        `Your team can manage everything from a <strong>single dashboard</strong>`,
        `<strong>Pitch inter-venue battles to your clients:</strong> connect multiple locations playing the same quiz at the same time — live cross-venue leaderboard, individual or team mode. A massive differentiator for your services.`,
      ],
      closing: `Free 30-day trial. See how it transforms your offering — and your margins.`,
      cta: `Try It This Week`,
    },

    // ── ANIMATION SERVICE WITHOUT QUIZ ──
    animation_no_quiz: {
      subject: `${venueName} — add quiz nights to your services in 5 minutes`,
      greeting: `Hi <strong>${venueName}</strong> team,`,
      intro: `Quiz nights are one of the most requested entertainment formats by pubs, bars, hotels, and event venues. If you're not offering them yet, you're leaving revenue on the table. QuizzaBoom makes it effortless to add to your portfolio.`,
      painTitle: `Why most animation companies don't offer quizzes:`,
      painPoints: [
        `Writing questions takes hours — it's a content job, not an entertainment job`,
        `Hiring dedicated quizmasters is expensive and hard to scale`,
        `Paper-based formats feel outdated and limit the experience`,
        `Hard to differentiate from competitors if everyone uses the same pub quiz format`,
      ],
      solutionTitle: `With QuizzaBoom, you can offer quiz nights at scale:`,
      solutionPoints: [
        `AI generates all questions — <strong>fresh, unique content in seconds</strong>`,
        `<strong>White-label option</strong>: put your company's branding on the TV display`,
        `Up to <strong>250 players per event</strong>, all playing on their phones via QR code`,
        `<strong>Strategic Jokers</strong> (steal, block, protect, double) — way beyond basic trivia`,
        `<strong>Team mode</strong> for corporate events, <strong>Kids mode</strong> for family venues`,
        `Offer your clients <strong>unlimited quiz nights</strong> without increasing your workload`,
      ],
      closing: `Free 30-day trial — no credit card. Add quizzes to your catalogue this week.`,
      cta: `Start Your Free Trial`,
    },
  };

  return templates[templateId] || templates.pub_no_quiz;
}

function getSubject(templateId: TemplateId, venueName: string): string {
  return getTemplate(templateId, venueName).subject;
}

// ─── HTML email builder ──────────────────────────────────────────
function buildOutreachEmail(venueName: string, templateId: TemplateId): string {
  const t = getTemplate(templateId, venueName);

  const painPointsHtml = t.painPoints
    .map(
      (p) =>
        `<tr><td style="padding:3px 0;color:#666;font-size:14px;line-height:1.5;">&#x2022; ${p}</td></tr>`
    )
    .join('');

  const solutionPointsHtml = t.solutionPoints
    .map(
      (p) =>
        `<tr><td style="padding:3px 0;color:#333;font-size:14px;line-height:1.5;">&#x2713; ${p}</td></tr>`
    )
    .join('');

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
        <td style="background-color:#7B2FD8;padding:24px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:26px;margin:0;letter-spacing:-0.5px;">QuizzaBoom</h1>
          <p style="color:#E0E0FF;font-size:13px;margin:5px 0 0;">AI-Powered Quiz Nights</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px 32px 16px;">
          <!-- Greeting & Intro -->
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
            ${t.greeting}
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
            ${t.intro}
          </p>

          <!-- Pain Points -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
            <tr>
              <td style="padding:20px;">
                <p style="color:#dc2626;font-size:14px;font-weight:bold;margin:0 0 10px;">${t.painTitle}</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${painPointsHtml}
                </table>
              </td>
            </tr>
          </table>

          <!-- Solution Points -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
            <tr>
              <td style="padding:20px;">
                <p style="color:#16a34a;font-size:14px;font-weight:bold;margin:0 0 10px;">${t.solutionTitle}</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${solutionPointsHtml}
                </table>
              </td>
            </tr>
          </table>

          <!-- Video Demo -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
              <td style="text-align:center;">
                <p style="color:#7B2FD8;font-size:15px;font-weight:bold;margin:0 0 12px;">🎬 See it in action (20 seconds)</p>
                <a href="https://youtu.be/Tva3awmMEOc" style="text-decoration:none;display:inline-block;" target="_blank">
                  <img src="https://img.youtube.com/vi/Tva3awmMEOc/hqdefault.jpg" alt="Watch QuizzaBoom Demo" width="480" style="width:100%;max-width:480px;border-radius:10px;display:block;border:3px solid #7B2FD8;" />
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-50px;position:relative;">
                    <tr>
                      <td style="text-align:center;padding-bottom:16px;">
                        <span style="display:inline-block;background-color:rgba(123,47,216,0.9);color:#ffffff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:bold;">▶ Watch Demo</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>

          <!-- Closing -->
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
            ${t.closing}
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;padding:8px 0 24px;">
                <a href="https://quizzaboom.app/pro-signup" style="display:inline-block;padding:16px 40px;background-color:#7B2FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  ${t.cta}
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px;">
            Happy to jump on a quick 5-minute demo if helpful. Just reply to this email or reach us at <a href="mailto:support@quizzaboom.app" style="color:#7B2FD8;text-decoration:none;font-weight:bold;">support@quizzaboom.app</a>
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:12px 0 0;">
            Cheers,<br>
            <strong>The QuizzaBoom Team</strong><br>
            <a href="mailto:support@quizzaboom.app" style="color:#7B2FD8;text-decoration:none;font-size:13px;">support@quizzaboom.app</a>
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0 0 4px;">QuizzaBoom — AI-Powered Quiz Nights for Venues</p>
          <p style="color:#999;font-size:12px;margin:0 0 4px;">
            <a href="https://quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">quizzaboom.app</a> | <a href="mailto:support@quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">support@quizzaboom.app</a>
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

// ─── Follow-up email builder ─────────────────────────────────────
function buildFollowUpEmail(venueName: string, followUpCount: number): string {
  const isSecondFollowUp = followUpCount >= 2;

  const subject = isSecondFollowUp
    ? `${venueName} — last chance: free 30-day trial ending soon`
    : `${venueName} — just checking in`;

  const bodyIntro = isSecondFollowUp
    ? `I reached out a couple of times about QuizzaBoom — the AI-powered quiz system that runs itself. I completely understand if it's not the right time, but I didn't want you to miss the <strong>free 30-day trial</strong> before we close it off.`
    : `I sent you a note recently about <strong>QuizzaBoom</strong> — the AI-powered quiz night system. I know inboxes get busy, so I wanted to quickly follow up.`;

  const reminder = isSecondFollowUp
    ? `<strong>Quick recap:</strong> AI generates unique questions every time, set up in 90 seconds, players join via QR code on their phones, up to 250 players, real-time leaderboard on your TV. Zero prep, zero paper, zero quizmaster needed.`
    : `<strong>The short version:</strong> QuizzaBoom lets you run professional quiz nights with zero prep. AI creates the questions, players use their phones, and your TV shows a live leaderboard. Set up takes 90 seconds.`;

  const cta = isSecondFollowUp ? `Last Chance — Try Free` : `Start Your Free Trial`;

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuizzaBoom — Follow up</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr>
        <td style="background-color:#7B2FD8;padding:24px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:26px;margin:0;letter-spacing:-0.5px;">QuizzaBoom</h1>
          <p style="color:#E0E0FF;font-size:13px;margin:5px 0 0;">AI-Powered Quiz Nights</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:32px 32px 16px;">
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
            Hi <strong>${venueName}</strong> team,
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
            ${bodyIntro}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
            <tr>
              <td style="padding:20px;">
                <p style="color:#333;font-size:14px;line-height:1.7;margin:0;">
                  ${reminder}
                </p>
              </td>
            </tr>
          </table>
          <!-- Video Demo -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr>
              <td style="text-align:center;">
                <p style="color:#7B2FD8;font-size:15px;font-weight:bold;margin:0 0 12px;">🎬 See it in action (20 seconds)</p>
                <a href="https://youtu.be/Tva3awmMEOc" style="text-decoration:none;display:inline-block;" target="_blank">
                  <img src="https://img.youtube.com/vi/Tva3awmMEOc/hqdefault.jpg" alt="Watch QuizzaBoom Demo" width="480" style="width:100%;max-width:480px;border-radius:10px;display:block;border:3px solid #7B2FD8;" />
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-50px;position:relative;">
                    <tr>
                      <td style="text-align:center;padding-bottom:16px;">
                        <span style="display:inline-block;background-color:rgba(123,47,216,0.9);color:#ffffff;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:bold;">▶ Watch Demo</span>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Venues already using QuizzaBoom report <strong>2x footfall</strong> on quiz nights. No credit card needed to start.
          </p>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;padding:8px 0 24px;">
                <a href="https://quizzaboom.app/pro-signup" style="display:inline-block;padding:16px 40px;background-color:#7B2FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  ${cta}
                </a>
              </td>
            </tr>
          </table>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px;">
            Happy to answer any questions — just reply to this email.
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:12px 0 0;">
            Cheers,<br>
            <strong>The QuizzaBoom Team</strong>
          </p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0 0 4px;">QuizzaBoom — AI-Powered Quiz Nights for Venues</p>
          <p style="color:#999;font-size:12px;margin:0 0 4px;">
            <a href="https://quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">quizzaboom.app</a> | <a href="mailto:support@quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">support@quizzaboom.app</a>
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

function getFollowUpSubject(venueName: string, followUpCount: number): string {
  return followUpCount >= 2
    ? `${venueName} — last chance: free 30-day trial ending soon`
    : `${venueName} — just checking in`;
}

// ─── API Handler ─────────────────────────────────────────────────
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
      const { venueName, email, id, template, isFollowUp, followUpCount } = prospect;
      if (!venueName || !email) {
        results.push({ email: email || 'unknown', status: 'failed' });
        failed++;
        continue;
      }

      let subject: string;
      let html: string;

      if (isFollowUp) {
        // Follow-up email
        const count = followUpCount || 1;
        subject = getFollowUpSubject(venueName, count);
        html = buildFollowUpEmail(venueName, count);
      } else {
        // Initial outreach email
        const templateId: TemplateId = template || 'pub_no_quiz';
        subject = getSubject(templateId, venueName);
        html = buildOutreachEmail(venueName, templateId);
      }

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

        if (id) {
          const updateData: Record<string, unknown> = {
            status,
            sent_at: success ? new Date().toISOString() : null,
          };

          // Increment follow_up_count on successful follow-up
          if (isFollowUp && success) {
            const { data: current } = await supabase
              .from('sales_outreach_leads')
              .select('follow_up_count')
              .eq('id', id)
              .single();
            updateData.follow_up_count = ((current?.follow_up_count as number) || 0) + 1;
          }

          await supabase
            .from('sales_outreach_leads')
            .update(updateData)
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
