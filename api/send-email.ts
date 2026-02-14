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

interface EmailI18n {
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
  ctaHeadline: string;
  ctaSubline: string;
  ctaButton: string;
  ctaPrice: string;
  ctaPricePerPlayer: string;
  useCaseTitle: string;
  useCase1: string;
  useCase2: string;
  useCase3: string;
  useCase4: string;
  useCase5: string;
  useCase6: string;
  socialProof: string;
  feat1: string;
  feat2: string;
  feat3: string;
  feat4: string;
  multiSiteCallout: string;
  multiSiteDesc: string;
  tagline: string;
  unsubscribe: string;
}

const i18n: Record<Lang, EmailI18n> = {
  en: {
    subject: (quiz) => `🎉 Your QuizzaBoom Results - ${quiz}`,
    subtitle: 'Your Quiz Results Are In!',
    hey: (name) => `Hey ${name}! What a game! 🔥`,
    resultsFor: (quiz) => `Here are your results for <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Rank',
    points: 'Points',
    accuracy: 'Accuracy',
    correctAnswers: 'Correct answers',
    bestStreak: 'Best streak',
    inARow: 'in a row',
    ctaHeadline: '🎉 YOU just had a BLAST — now imagine being the one who CREATES that experience!',
    ctaSubline: 'Your friends in Paris, your cousin in London, your team working from home — everyone plays together, from ANYWHERE! All this for less than a coffee ☕',
    ctaButton: '🚀 YES! HOST MY QUIZ FROM $1.99',
    ctaPrice: 'From $1.99 per game — No subscription. No hidden fees. Ready in 30 seconds!',
    ctaPricePerPlayer: 'That\'s only $0.10 per player for a 20-player game! 🤯',
    useCaseTitle: '🌍 People EVERYWHERE are already playing!',
    useCase1: '🍻 Bars & restaurants — packed houses, incredible energy!',
    useCase2: '🏢 The office — team building that people ACTUALLY enjoy',
    useCase3: '🏠 Home — family game nights that EVERYONE remembers',
    useCase4: '⛱️ Vacation — THE activity that makes every trip legendary',
    useCase5: '🏆 Sports clubs — post-match quizzes that keep the vibe alive',
    useCase6: '🌍 Multi-site — friends in different cities play together LIVE!',
    socialProof: '🚀 50,000+ players already! Join via QR code in 2 seconds — zero downloads, zero friction!',
    feat1: '🤖 AI generates unique questions on ANY topic in seconds',
    feat2: '⚔️ Strategic jokers that flip the game upside down!',
    feat3: '📊 Real-time leaderboard on the big screen',
    feat4: '🌍 Play from ANYWHERE — multi-site ready, no borders!',
    multiSiteCallout: 'PLAY FROM ANYWHERE IN THE WORLD!',
    multiSiteDesc: 'Your players can be in different cities, different countries — everyone plays together in real-time! Perfect for remote teams, long-distance friends & family.',
    tagline: 'QuizzaBoom — Turn Any Gathering Into An Epic Quiz Battle! 🚀',
    unsubscribe: 'Unsubscribe',
  },
  fr: {
    subject: (quiz) => `🎉 Vos resultats QuizzaBoom - ${quiz}`,
    subtitle: 'Vos resultats sont arrives !',
    hey: (name) => `Hey ${name} ! Quelle partie ! 🔥`,
    resultsFor: (quiz) => `Voici vos resultats pour <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Classement',
    points: 'Points',
    accuracy: 'Precision',
    correctAnswers: 'Bonnes reponses',
    bestStreak: 'Meilleure serie',
    inARow: 'de suite',
    ctaHeadline: '🎉 Vous venez de vivre un moment INCROYABLE — et si VOUS organisiez le prochain ?',
    ctaSubline: 'Vos amis a Paris, votre cousin a Londres, vos collegues en teletravail — tout le monde joue ensemble, de N\'IMPORTE OU ! Le tout pour moins qu\'un cafe ☕',
    ctaButton: '🚀 OUI ! J\'ORGANISE MON QUIZ DES $1.99',
    ctaPrice: 'A partir de $1.99 la partie — Sans abonnement. Sans frais caches. Pret en 30 secondes !',
    ctaPricePerPlayer: 'Soit seulement $0.10 par joueur pour 20 participants ! 🤯',
    useCaseTitle: '🌍 Ils jouent PARTOUT dans le monde !',
    useCase1: '🍻 Bars & restaurants — salles combles, ambiance de folie !',
    useCase2: '🏢 Au bureau — du team building que les gens ADORENT vraiment',
    useCase3: '🏠 A la maison — des soirees jeux dont TOUT LE MONDE parle',
    useCase4: '⛱️ En vacances — L\'animation qui rend chaque sejour legendaire',
    useCase5: '🏆 Clubs de sport — quiz d\'apres-match qui prolongent l\'ambiance',
    useCase6: '🌍 Multi-site — des amis dans differentes villes jouent ensemble EN DIRECT !',
    socialProof: '🚀 Plus de 50 000 joueurs ! Rejoignez via QR code en 2 secondes — zero telechargement !',
    feat1: '🤖 L\'IA genere des questions uniques sur N\'IMPORTE QUEL sujet en secondes',
    feat2: '⚔️ Des jokers strategiques qui retournent completement la partie !',
    feat3: '📊 Classement en direct sur grand ecran',
    feat4: '🌍 Jouez de N\'IMPORTE OU — multi-site, sans frontieres !',
    multiSiteCallout: 'JOUEZ DE N\'IMPORTE OU DANS LE MONDE !',
    multiSiteDesc: 'Vos joueurs peuvent etre dans differentes villes, differents pays — tout le monde joue ensemble en temps reel ! Parfait pour les equipes a distance et les amis eloignes.',
    tagline: 'QuizzaBoom — Transformez chaque reunion en un quiz epique ! 🚀',
    unsubscribe: 'Se desinscrire',
  },
  de: {
    subject: (quiz) => `🎉 Deine QuizzaBoom-Ergebnisse - ${quiz}`,
    subtitle: 'Deine Ergebnisse sind da!',
    hey: (name) => `Hey ${name}! Was fur ein Spiel! 🔥`,
    resultsFor: (quiz) => `Hier sind deine Ergebnisse fur <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Rang',
    points: 'Punkte',
    accuracy: 'Genauigkeit',
    correctAnswers: 'Richtige Antworten',
    bestStreak: 'Beste Serie',
    inARow: 'in Folge',
    ctaHeadline: '🎉 DU hattest gerade einen RIESENSPASS — stell dir vor, DU organisierst das nachste!',
    ctaSubline: 'Deine Freunde in Berlin, dein Cousin in Wien, deine Kollegen im Homeoffice — alle spielen zusammen, von UBERALL! Das alles fur weniger als einen Kaffee ☕',
    ctaButton: '🚀 JA! MEIN QUIZ AB $1.99',
    ctaPrice: 'Ab $1.99 pro Spiel — Kein Abo. Keine versteckten Kosten. In 30 Sekunden startklar!',
    ctaPricePerPlayer: 'Das sind nur $0.10 pro Spieler bei 20 Teilnehmern! 🤯',
    useCaseTitle: '🌍 UBERALL wird schon gespielt!',
    useCase1: '🍻 Bars & Restaurants — volles Haus, unglaubliche Stimmung!',
    useCase2: '🏢 Im Buro — Teambuilding, das WIRKLICH Spass macht',
    useCase3: '🏠 Zuhause — Spieleabende, die JEDER in Erinnerung behalt',
    useCase4: '⛱️ Im Urlaub — DIE Aktivitat, die den Trip legendar macht',
    useCase5: '🏆 Sportvereine — Quiz nach dem Spiel halt die Stimmung hoch',
    useCase6: '🌍 Multi-Standort — Freunde in verschiedenen Stadten spielen LIVE zusammen!',
    socialProof: '🚀 Uber 50.000 Spieler! Per QR-Code in 2 Sekunden dabei — kein Download!',
    feat1: '🤖 KI generiert einzigartige Fragen zu JEDEM Thema in Sekunden',
    feat2: '⚔️ Strategische Joker, die das Spiel komplett umdrehen!',
    feat3: '📊 Echtzeit-Bestenliste auf dem grossen Bildschirm',
    feat4: '🌍 Spiele von UBERALL — Multi-Standort, keine Grenzen!',
    multiSiteCallout: 'SPIELE VON UBERALL AUF DER WELT!',
    multiSiteDesc: 'Deine Spieler konnen in verschiedenen Stadten sein — alle spielen in Echtzeit zusammen! Perfekt fur Remote-Teams und Fernfreundschaften.',
    tagline: 'QuizzaBoom — Verwandle jedes Treffen in ein episches Quiz-Battle! 🚀',
    unsubscribe: 'Abmelden',
  },
  es: {
    subject: (quiz) => `🎉 Tus resultados QuizzaBoom - ${quiz}`,
    subtitle: 'Tus resultados han llegado!',
    hey: (name) => `Hey ${name}! Que partidazo! 🔥`,
    resultsFor: (quiz) => `Aqui estan tus resultados para <strong style="color:#00D4FF;">${quiz}</strong>`,
    rank: 'Posicion',
    points: 'Puntos',
    accuracy: 'Precision',
    correctAnswers: 'Respuestas correctas',
    bestStreak: 'Mejor racha',
    inARow: 'seguidas',
    ctaHeadline: '🎉 Acabas de vivir algo INCREIBLE — ahora imagina ser TU quien organiza el proximo!',
    ctaSubline: 'Tus amigos en Madrid, tu primo en Buenos Aires, tus companeros en teletrabajo — todos juegan juntos, desde CUALQUIER LUGAR! Todo por menos que un cafe ☕',
    ctaButton: '🚀 SI! ORGANIZO MI QUIZ DESDE $1.99',
    ctaPrice: 'Desde $1.99 por partida — Sin suscripcion. Sin costos ocultos. Listo en 30 segundos!',
    ctaPricePerPlayer: 'Eso es solo $0.10 por jugador con 20 participantes! 🤯',
    useCaseTitle: '🌍 Ya estan jugando en TODO EL MUNDO!',
    useCase1: '🍻 Bares y restaurantes — lleno total, energia increible!',
    useCase2: '🏢 La oficina — team building que la gente DISFRUTA de verdad',
    useCase3: '🏠 En casa — noches de juegos que TODOS recuerdan',
    useCase4: '⛱️ De vacaciones — LA actividad que hace el viaje legendario',
    useCase5: '🏆 Clubes deportivos — quiz post-partido que mantienen la energia',
    useCase6: '🌍 Multi-sitio — amigos en diferentes ciudades juegan juntos EN VIVO!',
    socialProof: '🚀 Mas de 50.000 jugadores! Unete via QR en 2 segundos — sin descargas!',
    feat1: '🤖 La IA genera preguntas unicas sobre CUALQUIER tema en segundos',
    feat2: '⚔️ Comodines estrategicos que dan la vuelta al juego!',
    feat3: '📊 Tabla de clasificacion en tiempo real en pantalla grande',
    feat4: '🌍 Juega desde CUALQUIER LUGAR — multi-sitio, sin fronteras!',
    multiSiteCallout: 'JUEGA DESDE CUALQUIER LUGAR DEL MUNDO!',
    multiSiteDesc: 'Tus jugadores pueden estar en diferentes ciudades, diferentes paises — todos juegan juntos en tiempo real! Perfecto para equipos remotos y amigos a distancia.',
    tagline: 'QuizzaBoom — Convierte cualquier reunion en una batalla de quiz epica! 🚀',
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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>QuizzaBoom Results</title>
  <style>
    :root { color-scheme: light only; }
    [data-ogsc] body, [data-ogsb] body { background-color: #0a0a1a !important; }
    u + .body { background-color: #0a0a1a !important; }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#0a0a1a;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
  <div style="max-width:600px;margin:0 auto;padding:20px;background-color:#0a0a1a;">
    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:16px 16px 0 0;overflow:hidden;">
      <tr>
        <td style="text-align:center;padding:30px 20px;background-color:#7B2FD8;">
          <h1 style="color:#ffffff;font-size:32px;margin:0;letter-spacing:-1px;">QuizzaBoom</h1>
          <p style="color:#E0E0FF;font-size:16px;margin:8px 0 0;">${t.subtitle}</p>
        </td>
      </tr>
    </table>

    <!-- Results Card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#1a1a2e;padding:30px;">
          <div style="text-align:center;margin-bottom:24px;">
            ${topBadge}
            <div style="font-size:56px;margin-bottom:8px;">${medalEmoji}</div>
            <h2 style="color:#ffffff;font-size:26px;margin:0 0 8px;">${t.hey(player.playerName)}</h2>
            <p style="color:#B0B0C0;margin:0;font-size:16px;">${t.resultsFor(quizTitle)}</p>
          </div>

          <!-- Stats Grid — TABLE layout for iOS Mail compatibility -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td width="33%" style="padding:0 4px 0 0;" valign="top">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#12122a;border-radius:12px;padding:16px;text-align:center;border:1px solid #1a5a6a;">
                      <div style="font-size:32px;font-weight:900;color:#00D4FF;">#${player.rank}</div>
                      <div style="color:#9090A0;font-size:12px;">${t.rank} / ${player.totalPlayers}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="33%" style="padding:0 2px;" valign="top">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#12122a;border-radius:12px;padding:16px;text-align:center;border:1px solid #5a1a4a;">
                      <div style="font-size:32px;font-weight:900;color:#E91E8C;">${player.score}</div>
                      <div style="color:#9090A0;font-size:12px;">${t.points}</div>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="34%" style="padding:0 0 0 4px;" valign="top">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color:#12122a;border-radius:12px;padding:16px;text-align:center;border:1px solid #5a5a1a;">
                      <div style="font-size:32px;font-weight:900;color:#FFD700;">${player.accuracy}%</div>
                      <div style="color:#9090A0;font-size:12px;">${t.accuracy}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Detail stats — TABLE layout for iOS -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td style="background-color:#12122a;border-radius:12px;padding:16px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="color:#9090A0;padding-bottom:8px;">${t.correctAnswers}</td>
                    <td style="color:#ffffff;font-weight:bold;text-align:right;padding-bottom:8px;">${player.correctAnswers}/${player.totalQuestions}</td>
                  </tr>
                  <tr>
                    <td style="color:#9090A0;">${t.bestStreak}</td>
                    <td style="color:#ffffff;font-weight:bold;text-align:right;">${player.bestStreak} ${t.inARow}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- 🔥 MARKETING SECTION — enthusiastic, salesy, multi-site focused -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#151528;padding:32px 24px;border-top:3px solid #E91E8C;">

          <!-- Headline -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td style="text-align:center;">
                <h2 style="color:#ffffff;font-size:22px;margin:0 0 12px;line-height:1.4;">${t.ctaHeadline}</h2>
                <p style="color:#C0C0D0;font-size:15px;margin:0;line-height:1.6;">${t.ctaSubline}</p>
              </td>
            </tr>
          </table>

          <!-- Price highlight -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td style="text-align:center;padding:16px;background-color:#201040;border-radius:12px;border:2px solid #8B3FE8;">
                <p style="color:#FFD700;font-size:28px;font-weight:900;margin:0;">💰 <span style="text-decoration:line-through;color:#FF6B6B;font-size:18px;">$3.99</span> $1.99</p>
                <p style="color:#A0A0B8;font-size:13px;margin:4px 0 0;">${t.ctaPrice}</p>
                <p style="color:#00D4FF;font-size:15px;font-weight:bold;margin:8px 0 0;">${t.ctaPricePerPlayer}</p>
              </td>
            </tr>
          </table>

          <!-- Use cases -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr>
              <td style="background-color:#12122a;border-radius:12px;padding:20px;border:1px solid #2a2a4a;">
                <p style="color:#00D4FF;font-weight:bold;font-size:14px;margin:0 0 12px;text-align:center;text-transform:uppercase;letter-spacing:1px;">${t.useCaseTitle}</p>
                <div style="color:#D0D0E0;font-size:14px;line-height:2;">
                  ${t.useCase1}<br>
                  ${t.useCase2}<br>
                  ${t.useCase3}<br>
                  ${t.useCase4}<br>
                  ${t.useCase5}<br>
                  ${t.useCase6}
                </div>
              </td>
            </tr>
          </table>

          <!-- Multi-site callout -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr>
              <td style="text-align:center;padding:16px;background-color:#1a1040;border-radius:12px;border:1px solid #6B3FE8;">
                <p style="color:#A06FFF;font-weight:900;font-size:16px;margin:0 0 6px;">🌍 ${t.multiSiteCallout}</p>
                <p style="color:#A0A0B8;font-size:13px;margin:0;line-height:1.5;">${t.multiSiteDesc}</p>
              </td>
            </tr>
          </table>

          <!-- Features -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr>
              <td style="text-align:center;">
                <div style="color:#D0D0E0;font-size:14px;line-height:2.2;text-align:center;">
                  ${t.feat1}<br>
                  ${t.feat2}<br>
                  ${t.feat3}<br>
                  ${t.feat4}
                </div>
              </td>
            </tr>
          </table>

          <!-- Social proof -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
            <tr>
              <td style="text-align:center;padding:12px;background-color:#0a1a2a;border-radius:8px;border:1px solid #1a4a5a;">
                <p style="color:#00D4FF;font-size:13px;font-weight:bold;margin:0;">${t.socialProof}</p>
              </td>
            </tr>
          </table>

          <!-- CTA Button — links to /offer -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
            <tr>
              <td style="text-align:center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://quizzaboom.app/offer" style="height:56px;v-text-anchor:middle;width:300px;" arcsize="21%" fill="true" stroke="f">
                  <v:fill type="gradient" color="#E91E8C" color2="#8B3FE8" />
                  <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;">${t.ctaButton}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="https://quizzaboom.app/offer" style="display:inline-block;padding:18px 48px;background-color:#C91E7C;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:900;font-size:18px;letter-spacing:0.5px;">
                  ${t.ctaButton}
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;">
                <p style="color:#8080A0;font-size:13px;margin:0;">
                  ${t.ctaPrice}
                </p>
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
          <p style="color:#6060A0;font-size:11px;margin:0 0 8px;">${t.tagline}</p>
          <p style="margin:0;">
            <a href="https://quizzaboom.app/unsubscribe" style="color:#6060A0;font-size:11px;">${t.unsubscribe}</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  <!--[if mso]></td></tr></table><![endif]-->
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
