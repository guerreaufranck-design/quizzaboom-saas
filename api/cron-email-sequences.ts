import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

type Lang = 'fr' | 'en' | 'de' | 'es';

function getLang(lang?: string): Lang {
  if (lang && ['fr', 'en', 'de', 'es'].includes(lang)) return lang as Lang;
  return 'en';
}

// ============================================================
// i18n for all 3 email sequences (J+3, J+7, J+14)
// ============================================================

interface CronI18n {
  // J+3: "The buzz is still alive"
  j3Subject: (name: string) => string;
  j3Headline: string;
  j3Body: string;
  j3Highlight: string;
  j3Cta: string;
  j3Scenarios: string[];
  // J+7: "Be the hero"
  j7Subject: (name: string) => string;
  j7Headline: string;
  j7Body: string;
  j7StatsTitle: string;
  j7Stat1: string;
  j7Stat2: string;
  j7Stat3: string;
  j7Stat4: string;
  j7Cta: string;
  j7Urgency: string;
  // J+14: "Last chance / special deal"
  j14Subject: (name: string) => string;
  j14Headline: string;
  j14Body: string;
  j14DealBadge: string;
  j14DealText: string;
  j14Testimonial1: string;
  j14Testimonial2: string;
  j14Testimonial3: string;
  j14Cta: string;
  j14Scarcity: string;
  // Shared
  tagline: string;
  unsubscribe: string;
}

const cronI18n: Record<Lang, CronI18n> = {
  en: {
    j3Subject: (name) => `${name}, the quiz buzz isn't over yet...`,
    j3Headline: 'Still thinking about that quiz?',
    j3Body: 'We get it. The adrenaline, the laughs, that one question you KNOW you got wrong. But here\'s the thing...',
    j3Highlight: 'What if next time, YOU were the one asking the questions?',
    j3Cta: 'CREATE A QUIZ IN 30 SECONDS',
    j3Scenarios: [
      '🍕 Friday pizza night? Add a quiz.',
      '🎉 Birthday coming up? Surprise them with a quiz.',
      '💼 Monday team meeting? Make it a quiz.',
      '🏖️ Group vacation? Quiz time.',
    ],
    j7Subject: (name) => `${name}, everyone's asking "when's the next quiz?"`,
    j7Headline: 'Be the one who makes it happen.',
    j7Body: 'You know that person who always organizes the best things? The one everyone thanks? That could be you. Right now.',
    j7StatsTitle: 'WHY IT WORKS',
    j7Stat1: '⚡ 30 seconds to create — AI does all the work',
    j7Stat2: '📱 250 players join via QR code — no app download',
    j7Stat3: '🧠 ANY topic — from pop culture to quantum physics',
    j7Stat4: '🔥 Strategic jokers — everyone gets a chance to win',
    j7Cta: 'I WANT TO HOST MY QUIZ',
    j7Urgency: 'From $1.99 — cheaper than a coffee, more fun than anything.',
    j14Subject: (name) => `${name}, your quiz is waiting — special offer inside`,
    j14Headline: 'We saved something for you.',
    j14Body: 'Look, we\'ll be honest. We think you\'d be an AMAZING quiz host. And we\'d hate for you to miss out.',
    j14DealBadge: 'SPECIAL OFFER',
    j14DealText: 'Your first quiz from just $1.99 — up to 50 players, AI-powered questions, real-time leaderboard. Everything included.',
    j14Testimonial1: '"Best team building we\'ve EVER done" — Marketing team, London',
    j14Testimonial2: '"My bar is now packed every quiz night" — Pierre, Paris',
    j14Testimonial3: '"The kids couldn\'t stop laughing" — Sarah, family quiz night',
    j14Cta: 'GET STARTED FOR $1.99',
    j14Scarcity: 'This pricing won\'t last forever. Create your first quiz today.',
    tagline: 'QuizzaBoom — Turn Any Gathering Into An Epic Quiz Battle!',
    unsubscribe: 'Unsubscribe',
  },
  fr: {
    j3Subject: (name) => `${name}, l'ambiance du quiz n'est pas finie...`,
    j3Headline: 'Vous repensez encore au quiz ?',
    j3Body: 'On comprend. L\'adrenaline, les fous rires, cette question que vous SAVEZ avoir ratee. Mais le truc, c\'est...',
    j3Highlight: 'Et si la prochaine fois, c\'etait VOUS qui posiez les questions ?',
    j3Cta: 'CREER UN QUIZ EN 30 SECONDES',
    j3Scenarios: [
      '🍕 Soiree pizza vendredi ? Ajoutez un quiz.',
      '🎉 Anniversaire en vue ? Surprenez-les avec un quiz.',
      '💼 Reunion lundi ? Transformez-la en quiz.',
      '🏖️ Vacances en groupe ? C\'est l\'heure du quiz.',
    ],
    j7Subject: (name) => `${name}, tout le monde demande "c'est quand le prochain quiz ?"`,
    j7Headline: 'Soyez celui ou celle qui lance le prochain.',
    j7Body: 'Vous connaissez cette personne qui organise toujours les meilleurs trucs ? Celle que tout le monde remercie ? Ca pourrait etre vous. Maintenant.',
    j7StatsTitle: 'POURQUOI CA MARCHE',
    j7Stat1: '⚡ 30 secondes pour creer — l\'IA fait tout le boulot',
    j7Stat2: '📱 250 joueurs rejoignent via QR code — aucune appli a telecharger',
    j7Stat3: '🧠 N\'IMPORTE QUEL sujet — de la culture pop a la physique quantique',
    j7Stat4: '🔥 Jokers strategiques — tout le monde a sa chance',
    j7Cta: 'JE VEUX ORGANISER MON QUIZ',
    j7Urgency: 'A partir de 1,99 EUR — moins cher qu\'un cafe, plus fun que tout.',
    j14Subject: (name) => `${name}, votre quiz vous attend — offre speciale`,
    j14Headline: 'On vous a garde quelque chose.',
    j14Body: 'Soyons honnetes. On pense que vous seriez un INCROYABLE animateur de quiz. Et ce serait dommage de passer a cote.',
    j14DealBadge: 'OFFRE SPECIALE',
    j14DealText: 'Votre premier quiz a partir de 1,99 EUR — jusqu\'a 50 joueurs, questions generees par IA, classement en direct. Tout inclus.',
    j14Testimonial1: '"Le meilleur team building qu\'on ait JAMAIS fait" — Equipe marketing, Lyon',
    j14Testimonial2: '"Mon bar fait salle comble chaque soir quiz" — Pierre, Paris',
    j14Testimonial3: '"Les enfants n\'arretaient pas de rire" — Sarah, soiree quiz famille',
    j14Cta: 'COMMENCER POUR 1,99 EUR',
    j14Scarcity: 'Ce tarif ne durera pas eternellement. Creez votre premier quiz aujourd\'hui.',
    tagline: 'QuizzaBoom — Transformez chaque reunion en un quiz epique !',
    unsubscribe: 'Se desinscrire',
  },
  de: {
    j3Subject: (name) => `${name}, das Quiz-Feeling ist noch nicht vorbei...`,
    j3Headline: 'Denkst du noch an das Quiz?',
    j3Body: 'Verstehen wir. Das Adrenalin, das Lachen, die eine Frage, die du GARANTIERT falsch hattest. Aber das Ding ist...',
    j3Highlight: 'Was, wenn DU nachstes Mal die Fragen stellst?',
    j3Cta: 'QUIZ IN 30 SEKUNDEN ERSTELLEN',
    j3Scenarios: [
      '🍕 Pizza-Abend am Freitag? Quiz dazu.',
      '🎉 Geburtstag? Uberrasche sie mit einem Quiz.',
      '💼 Team-Meeting am Montag? Mach ein Quiz daraus.',
      '🏖️ Gruppenurlaub? Quiz-Zeit.',
    ],
    j7Subject: (name) => `${name}, alle fragen "wann kommt das nachste Quiz?"`,
    j7Headline: 'Sei die Person, die es passieren lasst.',
    j7Body: 'Du kennst diese Person, die immer die besten Sachen organisiert? Die, der alle danken? Das konntest du sein. Jetzt.',
    j7StatsTitle: 'WARUM ES FUNKTIONIERT',
    j7Stat1: '⚡ 30 Sekunden zum Erstellen — die KI macht alles',
    j7Stat2: '📱 250 Spieler per QR-Code dabei — kein App-Download',
    j7Stat3: '🧠 JEDES Thema — von Popkultur bis Quantenphysik',
    j7Stat4: '🔥 Strategische Joker — jeder hat eine Chance zu gewinnen',
    j7Cta: 'ICH WILL MEIN QUIZ VERANSTALTEN',
    j7Urgency: 'Ab 1,99 EUR — gunstiger als ein Kaffee, mehr Spass als alles andere.',
    j14Subject: (name) => `${name}, dein Quiz wartet — Sonderangebot`,
    j14Headline: 'Wir haben etwas fur dich aufgehoben.',
    j14Body: 'Ehrlich gesagt: Wir glauben, du warst ein GROSSARTIGER Quiz-Host. Und es ware schade, das zu verpassen.',
    j14DealBadge: 'SONDERANGEBOT',
    j14DealText: 'Dein erstes Quiz ab nur 1,99 EUR — bis zu 50 Spieler, KI-Fragen, Echtzeit-Bestenliste. Alles inklusive.',
    j14Testimonial1: '"Bestes Teambuilding, das wir JE hatten" — Marketing-Team, Berlin',
    j14Testimonial2: '"Meine Bar ist jetzt jeden Quiz-Abend voll" — Pierre, Paris',
    j14Testimonial3: '"Die Kinder konnten nicht aufhoren zu lachen" — Sarah, Familien-Quiz',
    j14Cta: 'FUR 1,99 EUR STARTEN',
    j14Scarcity: 'Dieser Preis gilt nicht ewig. Erstelle heute dein erstes Quiz.',
    tagline: 'QuizzaBoom — Verwandle jedes Treffen in ein episches Quiz-Battle!',
    unsubscribe: 'Abmelden',
  },
  es: {
    j3Subject: (name) => `${name}, la energia del quiz no ha terminado...`,
    j3Headline: 'Sigues pensando en el quiz?',
    j3Body: 'Lo entendemos. La adrenalina, las risas, esa pregunta que SABES que fallaste. Pero la cosa es...',
    j3Highlight: 'Y si la proxima vez, TU hicieras las preguntas?',
    j3Cta: 'CREAR UN QUIZ EN 30 SEGUNDOS',
    j3Scenarios: [
      '🍕 Viernes de pizza? Anade un quiz.',
      '🎉 Cumpleanos a la vista? Sorprendelos con un quiz.',
      '💼 Reunion del lunes? Conviertela en quiz.',
      '🏖️ Vacaciones en grupo? Hora del quiz.',
    ],
    j7Subject: (name) => `${name}, todos preguntan "cuando es el proximo quiz?"`,
    j7Headline: 'Se la persona que lo hace posible.',
    j7Body: 'Conoces a esa persona que siempre organiza las mejores cosas? A la que todos agradecen? Podrias ser tu. Ahora mismo.',
    j7StatsTitle: 'POR QUE FUNCIONA',
    j7Stat1: '⚡ 30 segundos para crear — la IA hace todo el trabajo',
    j7Stat2: '📱 250 jugadores se unen por QR — sin descargar nada',
    j7Stat3: '🧠 CUALQUIER tema — de cultura pop a fisica cuantica',
    j7Stat4: '🔥 Comodines estrategicos — todos tienen oportunidad',
    j7Cta: 'QUIERO ORGANIZAR MI QUIZ',
    j7Urgency: 'Desde 1,99 EUR — mas barato que un cafe, mas divertido que todo.',
    j14Subject: (name) => `${name}, tu quiz te espera — oferta especial`,
    j14Headline: 'Te guardamos algo.',
    j14Body: 'Seamos honestos. Creemos que serias un INCREIBLE host de quiz. Y seria una lastima que te lo perdieras.',
    j14DealBadge: 'OFERTA ESPECIAL',
    j14DealText: 'Tu primer quiz desde solo 1,99 EUR — hasta 50 jugadores, preguntas por IA, tabla de clasificacion en vivo. Todo incluido.',
    j14Testimonial1: '"El mejor team building que hemos hecho JAMAS" — Equipo de marketing, Madrid',
    j14Testimonial2: '"Mi bar se llena cada noche de quiz" — Pierre, Paris',
    j14Testimonial3: '"Los ninos no paraban de reir" — Sarah, noche de quiz familiar',
    j14Cta: 'EMPEZAR POR 1,99 EUR',
    j14Scarcity: 'Este precio no durara para siempre. Crea tu primer quiz hoy.',
    tagline: 'QuizzaBoom — Convierte cualquier reunion en una batalla de quiz epica!',
    unsubscribe: 'Darse de baja',
  },
};

// ============================================================
// Email templates
// ============================================================

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

function emailShell(content: string, tagline: string, unsubscribe: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="text-align:center;padding:24px 20px;background:linear-gradient(135deg,#8B3FE8,#00D4FF);border-radius:16px 16px 0 0;">
      <h1 style="color:#fff;font-size:32px;margin:0;letter-spacing:-1px;">QuizzaBoom</h1>
    </div>
    <div style="background:#1a1a2e;padding:32px 24px;border-radius:0 0 16px 16px;">
      ${content}
    </div>
    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);font-size:11px;">
      <p style="margin:0 0 8px;">${tagline}</p>
      <p style="margin:0;"><a href="https://quizzaboom.app/unsubscribe" style="color:rgba(255,255,255,0.4);">${unsubscribe}</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildJ3Email(playerName: string, lang: Lang): { subject: string; html: string } {
  const t = cronI18n[lang];

  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:8px;">🔥</div>
        <h2 style="color:#fff;font-size:24px;margin:0 0 12px;line-height:1.3;">${t.j3Headline}</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:15px;line-height:1.6;">${t.j3Body}</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;padding:16px;background:linear-gradient(135deg,rgba(233,30,140,0.15),rgba(139,63,232,0.15));border-radius:12px;border:1px solid rgba(233,30,140,0.3);">
        <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;line-height:1.4;">${t.j3Highlight}</p>
      </div>

      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.08);">
        <div style="color:rgba(255,255,255,0.85);font-size:14px;line-height:2.2;">
          ${t.j3Scenarios.join('<br>')}
        </div>
      </div>

      <div style="text-align:center;">
        <a href="https://quizzaboom.app/offer" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#E91E8C,#8B3FE8);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:17px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(233,30,140,0.4);">
          ${t.j3Cta}
        </a>
      </div>`;

  return {
    subject: t.j3Subject(playerName),
    html: emailShell(content, t.tagline, t.unsubscribe),
  };
}

function buildJ7Email(playerName: string, lang: Lang): { subject: string; html: string } {
  const t = cronI18n[lang];

  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:8px;">🎯</div>
        <h2 style="color:#fff;font-size:24px;margin:0 0 12px;line-height:1.3;">${t.j7Headline}</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:15px;line-height:1.6;">${t.j7Body}</p>
      </div>

      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid rgba(0,212,255,0.15);">
        <p style="color:#00D4FF;font-weight:900;font-size:14px;margin:0 0 16px;text-align:center;text-transform:uppercase;letter-spacing:2px;">${t.j7StatsTitle}</p>
        <div style="color:rgba(255,255,255,0.9);font-size:15px;line-height:2.4;">
          ${t.j7Stat1}<br>
          ${t.j7Stat2}<br>
          ${t.j7Stat3}<br>
          ${t.j7Stat4}
        </div>
      </div>

      <div style="text-align:center;margin-bottom:16px;">
        <a href="https://quizzaboom.app/offer" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#E91E8C,#8B3FE8);color:#fff;text-decoration:none;border-radius:12px;font-weight:900;font-size:17px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(233,30,140,0.4);">
          ${t.j7Cta}
        </a>
      </div>
      <p style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;margin:0;">${t.j7Urgency}</p>`;

  return {
    subject: t.j7Subject(playerName),
    html: emailShell(content, t.tagline, t.unsubscribe),
  };
}

function buildJ14Email(playerName: string, lang: Lang): { subject: string; html: string } {
  const t = cronI18n[lang];

  const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:48px;margin-bottom:8px;">🎁</div>
        <h2 style="color:#fff;font-size:24px;margin:0 0 12px;line-height:1.3;">${t.j14Headline}</h2>
        <p style="color:rgba(255,255,255,0.7);margin:0;font-size:15px;line-height:1.6;">${t.j14Body}</p>
      </div>

      <!-- Deal badge -->
      <div style="text-align:center;margin-bottom:20px;">
        <div style="display:inline-block;padding:8px 24px;background:linear-gradient(135deg,#FFD700,#FFA500);border-radius:20px;">
          <span style="color:#1a1a2e;font-weight:900;font-size:14px;letter-spacing:1px;">${t.j14DealBadge}</span>
        </div>
      </div>

      <div style="background:linear-gradient(135deg,rgba(233,30,140,0.1),rgba(139,63,232,0.1));border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid rgba(233,30,140,0.2);">
        <p style="color:#fff;font-size:16px;margin:0;text-align:center;line-height:1.6;">${t.j14DealText}</p>
      </div>

      <!-- Testimonials -->
      <div style="margin-bottom:24px;">
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px 16px;margin-bottom:8px;border-left:3px solid #00D4FF;">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;font-style:italic;">${t.j14Testimonial1}</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px 16px;margin-bottom:8px;border-left:3px solid #E91E8C;">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;font-style:italic;">${t.j14Testimonial2}</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px 16px;border-left:3px solid #FFD700;">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;font-style:italic;">${t.j14Testimonial3}</p>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:16px;">
        <a href="https://quizzaboom.app/offer" style="display:inline-block;padding:18px 48px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#1a1a2e;text-decoration:none;border-radius:12px;font-weight:900;font-size:17px;letter-spacing:0.5px;box-shadow:0 4px 20px rgba(255,215,0,0.3);">
          ${t.j14Cta}
        </a>
      </div>
      <p style="text-align:center;color:rgba(255,255,255,0.5);font-size:13px;margin:0;">${t.j14Scarcity}</p>`;

  return {
    subject: t.j14Subject(playerName),
    html: emailShell(content, t.tagline, t.unsubscribe),
  };
}

// ============================================================
// Cron handler
// ============================================================

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
      const lang = getLang(player.language);
      const { subject, html } = buildJ3Email(player.player_name, lang);
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
      .is('marketing_email_opened_at', null)
      .gte('email_sent_at', eightDaysAgo.toISOString())
      .lt('email_sent_at', sevenDaysAgo.toISOString())
      .is('converted_to_customer_at', null)
      .limit(50);

    for (const player of j7Players || []) {
      const lang = getLang(player.language);
      const { subject, html } = buildJ7Email(player.player_name, lang);
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
      const lang = getLang(player.language);
      const { subject, html } = buildJ14Email(player.player_name, lang);
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
