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
  language?: string;
  players: PlayerResult[];
}

const i18n: Record<Lang, {
  subject: (quiz: string) => string;
  subtitle: string;
  hey: (name: string) => string;
  resultsFor: (quiz: string) => string;
  rank: string;
  points: string;
  accuracy: string;
  correctAnswers: string;
  bestStreak: string;
  inARow: string;
  // Marketing CTA — the killer section
  ctaHeadline: string;
  ctaSubline: string;
  ctaButton: string;
  ctaPrice: string;
  // Use cases
  useCaseTitle: string;
  useCase1: string;
  useCase2: string;
  useCase3: string;
  useCase4: string;
  useCase5: string;
  // Social proof
  socialProof: string;
  // Features
  feat1: string;
  feat2: string;
  feat3: string;
  // Footer
  tagline: string;
  unsubscribe: string;
}> = {
  en: {
    subject: (quiz) => `Your QuizzaBoom Results - ${quiz}`,
    subtitle: 'Your Quiz Results',
    hey: (name) => `Hey ${name}!`,
    resultsFor: (quiz) => `Here are your results for <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Rank',
    points: 'Points',
    accuracy: 'Accuracy',
    correctAnswers: 'Correct answers',
    bestStreak: 'Best streak',
    inARow: 'in a row',
    ctaHeadline: 'YOU could be the one running the next quiz.',
    ctaSubline: 'Imagine their faces. The laughs. The competition. All because YOU pressed "Start".',
    ctaButton: 'CREATE MY QUIZ NOW',
    ctaPrice: 'From $1.99 - No subscription. Ready in 30 seconds.',
    useCaseTitle: 'People are already playing at...',
    useCase1: '🍻 Bars & restaurants — packed houses every Thursday',
    useCase2: '🏢 The office — team building that people actually enjoy',
    useCase3: '🏠 Home — family game nights that everyone remembers',
    useCase4: '⛱️ Vacation — the activity that makes the trip legendary',
    useCase5: '🏆 Sports clubs — post-match quizzes that keep the energy going',
    socialProof: '250 players can join instantly via QR code — zero downloads, zero friction.',
    feat1: '🤖 AI generates unique questions on ANY topic in seconds',
    feat2: '⚔️ Strategic jokers that flip the game upside down',
    feat3: '📊 Real-time leaderboard on the big screen',
    tagline: 'QuizzaBoom — Turn Any Gathering Into An Epic Quiz Battle!',
    unsubscribe: 'Unsubscribe',
  },
  fr: {
    subject: (quiz) => `Vos resultats QuizzaBoom - ${quiz}`,
    subtitle: 'Vos resultats de quiz',
    hey: (name) => `Hey ${name} !`,
    resultsFor: (quiz) => `Voici vos resultats pour <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Classement',
    points: 'Points',
    accuracy: 'Precision',
    correctAnswers: 'Bonnes reponses',
    bestStreak: 'Meilleure serie',
    inARow: 'de suite',
    ctaHeadline: 'Et si le prochain quiz, c\'etait VOUS qui le lanciez ?',
    ctaSubline: 'Imaginez les fous rires. La competition. L\'ambiance de folie. Tout ca parce que VOUS avez appuye sur "Start".',
    ctaButton: 'CREER MON QUIZ MAINTENANT',
    ctaPrice: 'A partir de 1,99 EUR - Sans abonnement. Pret en 30 secondes.',
    useCaseTitle: 'Ils jouent deja a QuizzaBoom...',
    useCase1: '🍻 Bars & restaurants — salles combles chaque jeudi soir',
    useCase2: '🏢 Au bureau — du team building que les gens adorent vraiment',
    useCase3: '🏠 A la maison — des soirees jeux dont tout le monde parle',
    useCase4: '⛱️ En vacances — l\'animation qui rend le sejour legendaire',
    useCase5: '🏆 Clubs de sport — quiz d\'apres-match qui prolongent l\'ambiance',
    socialProof: '250 joueurs rejoignent instantanement via QR code — zero telechargement, zero friction.',
    feat1: '🤖 L\'IA genere des questions uniques sur N\'IMPORTE QUEL sujet en secondes',
    feat2: '⚔️ Des jokers strategiques qui retournent la partie',
    feat3: '📊 Classement en direct sur grand ecran',
    tagline: 'QuizzaBoom — Transformez chaque reunion en un quiz epique !',
    unsubscribe: 'Se desinscrire',
  },
  de: {
    subject: (quiz) => `Deine QuizzaBoom-Ergebnisse - ${quiz}`,
    subtitle: 'Deine Quiz-Ergebnisse',
    hey: (name) => `Hey ${name}!`,
    resultsFor: (quiz) => `Hier sind deine Ergebnisse fur <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Rang',
    points: 'Punkte',
    accuracy: 'Genauigkeit',
    correctAnswers: 'Richtige Antworten',
    bestStreak: 'Beste Serie',
    inARow: 'in Folge',
    ctaHeadline: 'DU konntest das nachste Quiz veranstalten.',
    ctaSubline: 'Stell dir die Gesichter vor. Das Lachen. Den Wettbewerb. Alles weil DU auf "Start" gedruckt hast.',
    ctaButton: 'MEIN QUIZ JETZT ERSTELLEN',
    ctaPrice: 'Ab 1,99 EUR - Kein Abo. In 30 Sekunden startklar.',
    useCaseTitle: 'Hier wird schon gespielt...',
    useCase1: '🍻 Bars & Restaurants — jeden Donnerstag volles Haus',
    useCase2: '🏢 Im Buro — Teambuilding, das wirklich Spass macht',
    useCase3: '🏠 Zuhause — Spieleabende, die unvergesslich bleiben',
    useCase4: '⛱️ Im Urlaub — die Aktivitat, die den Trip legendar macht',
    useCase5: '🏆 Sportvereine — Quiz nach dem Spiel halt die Stimmung hoch',
    socialProof: '250 Spieler treten sofort per QR-Code bei — kein Download, kein Aufwand.',
    feat1: '🤖 KI generiert einzigartige Fragen zu JEDEM Thema in Sekunden',
    feat2: '⚔️ Strategische Joker, die das Spiel komplett umdrehen',
    feat3: '📊 Echtzeit-Bestenliste auf dem grossen Bildschirm',
    tagline: 'QuizzaBoom — Verwandle jedes Treffen in ein episches Quiz-Battle!',
    unsubscribe: 'Abmelden',
  },
  es: {
    subject: (quiz) => `Tus resultados QuizzaBoom - ${quiz}`,
    subtitle: 'Tus resultados del quiz',
    hey: (name) => `Hey ${name}!`,
    resultsFor: (quiz) => `Aqui estan tus resultados para <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Posicion',
    points: 'Puntos',
    accuracy: 'Precision',
    correctAnswers: 'Respuestas correctas',
    bestStreak: 'Mejor racha',
    inARow: 'seguidas',
    ctaHeadline: 'TU podrias organizar el proximo quiz.',
    ctaSubline: 'Imagina las risas. La competencia. La energia. Todo porque TU pulsaste "Start".',
    ctaButton: 'CREAR MI QUIZ AHORA',
    ctaPrice: 'Desde 1,99 EUR - Sin suscripcion. Listo en 30 segundos.',
    useCaseTitle: 'Ya estan jugando en...',
    useCase1: '🍻 Bares y restaurantes — lleno total cada jueves',
    useCase2: '🏢 La oficina — team building que la gente disfruta de verdad',
    useCase3: '🏠 En casa — noches de juegos que todos recuerdan',
    useCase4: '⛱️ De vacaciones — la actividad que hace el viaje legendario',
    useCase5: '🏆 Clubes deportivos — quiz post-partido que mantienen la energia',
    socialProof: '250 jugadores se unen al instante via codigo QR — sin descargas, sin complicaciones.',
    feat1: '🤖 La IA genera preguntas unicas sobre CUALQUIER tema en segundos',
    feat2: '⚔️ Comodines estrategicos que dan la vuelta al juego',
    feat3: '📊 Tabla de clasificacion en tiempo real en pantalla grande',
    tagline: 'QuizzaBoom — Convierte cualquier reunion en una batalla de quiz epica!',
    unsubscribe: 'Darse de baja',
  },
};

function getLang(lang?: string): Lang {
  if (lang && ['fr', 'en', 'de', 'es'].includes(lang)) return lang as Lang;
  return 'en';
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

function buildResultsEmail(player: PlayerResult, quizTitle: string, lang: Lang): string {
  const t = i18n[lang];
  const medalEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '🎮';
  const isTop3 = player.rank <= 3;
  const topBadge = isTop3 ? `
        <div style="display:inline-block;padding:6px 20px;background:linear-gradient(135deg,#FFD700,#FFA500);border-radius:20px;margin-bottom:12px;">
          <span style="color:#1a1a2e;font-weight:900;font-size:14px;letter-spacing:1px;">TOP ${player.rank}</span>
        </div>` : '';

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
      <h1 style="color:#fff;font-size:32px;margin:0;letter-spacing:-1px;">QuizzaBoom</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:8px 0 0;">${t.subtitle}</p>
    </div>

    <!-- Results Card -->
    <div style="background:#1a1a2e;padding:30px;">
      <div style="text-align:center;margin-bottom:24px;">
        ${topBadge}
        <div style="font-size:56px;margin-bottom:8px;">${medalEmoji}</div>
        <h2 style="color:#fff;font-size:26px;margin:0 0 8px;">${t.hey(player.playerName)}</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:16px;">${t.resultsFor(quizTitle)}</p>
      </div>

      <!-- Stats Grid -->
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(0,212,255,0.2);">
          <div style="font-size:32px;font-weight:900;color:#00D4FF;">#${player.rank}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">${t.rank} / ${player.totalPlayers}</div>
        </div>
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(233,30,140,0.2);">
          <div style="font-size:32px;font-weight:900;color:#E91E8C;">${player.score}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">${t.points}</div>
        </div>
        <div style="flex:1;min-width:120px;background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(255,215,0,0.2);">
          <div style="font-size:32px;font-weight:900;color:#FFD700;">${player.accuracy}%</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;">${t.accuracy}</div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="color:rgba(255,255,255,0.6);">${t.correctAnswers}</span>
          <span style="color:#fff;font-weight:bold;">${player.correctAnswers}/${player.totalQuestions}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:rgba(255,255,255,0.6);">${t.bestStreak}</span>
          <span style="color:#fff;font-weight:bold;">${player.bestStreak} ${t.inARow}</span>
        </div>
      </div>
    </div>

    <!-- KILLER MARKETING SECTION -->
    <div style="background:linear-gradient(180deg,#1a1a2e 0%,#0f0f23 100%);padding:32px 24px;border-top:2px solid #E91E8C;">

      <!-- Headline -->
      <div style="text-align:center;margin-bottom:24px;">
        <p style="font-size:28px;margin:0 0 4px;">🎯</p>
        <h2 style="color:#fff;font-size:22px;margin:0 0 12px;line-height:1.3;">${t.ctaHeadline}</h2>
        <p style="color:rgba(255,255,255,0.7);font-size:15px;margin:0;line-height:1.5;">${t.ctaSubline}</p>
      </div>

      <!-- Use cases -->
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid rgba(255,255,255,0.08);">
        <p style="color:#00D4FF;font-weight:bold;font-size:14px;margin:0 0 12px;text-align:center;text-transform:uppercase;letter-spacing:1px;">${t.useCaseTitle}</p>
        <div style="color:rgba(255,255,255,0.85);font-size:14px;line-height:2;">
          ${t.useCase1}<br>
          ${t.useCase2}<br>
          ${t.useCase3}<br>
          ${t.useCase4}<br>
          ${t.useCase5}
        </div>
      </div>

      <!-- Features -->
      <div style="margin-bottom:20px;">
        <div style="color:rgba(255,255,255,0.9);font-size:14px;line-height:2.2;text-align:center;">
          ${t.feat1}<br>
          ${t.feat2}<br>
          ${t.feat3}
        </div>
      </div>

      <!-- Social proof -->
      <div style="text-align:center;margin-bottom:24px;padding:12px;background:rgba(0,212,255,0.08);border-radius:8px;border:1px solid rgba(0,212,255,0.15);">
        <p style="color:#00D4FF;font-size:13px;font-weight:bold;margin:0;">${t.socialProof}</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:12px;">
        <a href="https://quizzaboom.com/pricing" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#E91E8C,#8B3FE8);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:18px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(233,30,140,0.4);">
          ${t.ctaButton}
        </a>
      </div>
      <p style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;margin:0;">
        ${t.ctaPrice}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);font-size:11px;border-radius:0 0 16px 16px;background:#0f0f23;">
      <p style="margin:0 0 8px;">${t.tagline}</p>
      <p style="margin:0;">
        <a href="https://quizzaboom.com/unsubscribe" style="color:rgba(255,255,255,0.4);">${t.unsubscribe}</a>
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

  const { type, sessionId, quizTitle, language, players } = req.body as EmailRequest;

  if (type !== 'quiz_results' || !sessionId || !players?.length) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const lang = getLang(language);
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const player of players) {
    if (!player.email) {
      results.skipped++;
      continue;
    }

    const t = i18n[lang];
    const subject = t.subject(quizTitle);
    const html = buildResultsEmail(player, quizTitle, lang);
    const success = await sendWithSendGrid(player.email, subject, html);

    if (success) {
      results.sent++;

      // Track email sent in participant_emails table (with language for cron reengagement)
      await supabase.from('participant_emails').upsert(
        {
          session_id: sessionId,
          player_name: player.playerName,
          email: player.email,
          language: lang,
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
