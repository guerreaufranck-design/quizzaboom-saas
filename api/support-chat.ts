import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `You are QuizzaBoom's friendly support assistant. You help users understand and use the QuizzaBoom quiz platform.

ABOUT QUIZZABOOM:
QuizzaBoom is a SaaS quiz application that lets anyone create and host interactive quiz nights. It uses AI (Gemini) to generate unique quiz questions on any topic.

KEY FEATURES:
- AI-powered quiz generation: Choose a theme, difficulty, and number of questions. AI generates unique questions instantly.
- Real-time multiplayer: Up to 250 players can join simultaneously via QR code or session code.
- TV Display mode: Show the quiz on a big screen (TV/projector) while players answer on their phones.
- Strategic mode: Players get 4 jokers (Protection, Block, Steal, Double Points) for tactical gameplay.
- Commercial breaks: Hosts can schedule pauses with custom promo messages (great for bars/restaurants).
- Email results: Players who provide their email get their results automatically.
- 4 languages: English, French, German, Spanish.
- Team mode: Players can be grouped into teams for team-based competitions.

PRICING (One-time payments, no subscription):
- Free: 1 quiz, up to 5 players — $0
- Party: 1 quiz, up to 15 players — $1.99
- Mega Party: 1 quiz, up to 50 players — $4.99
- Pro Event: 1 quiz, up to 150 players — $9.99
- Business plans: Monthly subscription for bars/restaurants/hotels ($69/mo Starter, $99/mo Pro)
- Business Starter includes 30-day free trial

HOW TO CREATE A QUIZ:
1. Sign in (Google or email)
2. Go to Dashboard → Create Quiz
3. Choose theme(s), difficulty (Easy/Medium/Hard), number of questions (25/50/100/custom), language
4. Optional: Enable strategic mode (jokers), schedule commercial breaks
5. Click "Generate" — AI creates your quiz in ~30 seconds
6. Share the session code or QR code with players
7. Open TV Display on a big screen
8. Start the quiz when players are ready

HOW TO JOIN A QUIZ:
1. Go to quizzaboom.app
2. Click "Join a Quiz"
3. Enter the 6-character session code (or scan QR code)
4. Enter your name, optionally your email
5. Wait for the host to start — play on your phone!

QUIZ MODES:
- Standard: Serious competition trivia with verified facts
- Funny: "Believe it or not" style — real but surprising facts
- Kids: Educational and fun for ages 6-12

DIFFICULTIES:
- Easy: 70-80% success rate, family-friendly
- Medium: 40-60% success rate, pub quiz level
- Hard: 20-30% success rate, expert competition

STRATEGIC JOKERS (when strategic mode is enabled):
- Protection: Immunity from all attacks for one round
- Block: Prevent another player from answering
- Steal: Take 100% of another player's points for that round
- Double Points: Multiply your score by 2 for that round

BUSINESS VERIFICATION:
- Bars, restaurants, hotels, and event companies can get a B2B subscription
- Requires a business registration number (SIRET for France, VAT for EU, EIN for US, etc.)
- AI-powered instant verification
- 30-day free trial on the Starter plan

SUPPORT:
- For technical issues or questions not covered here, users can email: support@quizzaboom.app
- Website: quizzaboom.app

RULES FOR RESPONDING:
1. Be friendly, helpful, and concise
2. Answer in the SAME LANGUAGE the user writes in
3. If you don't know the answer or the question is outside QuizzaBoom's scope, say so politely and suggest emailing support@quizzaboom.app
4. Never make up features or pricing that don't exist
5. If the user seems frustrated, be empathetic and offer to escalate to human support
6. Keep responses short (2-4 sentences max) unless the user asks for detailed instructions
7. Use emojis sparingly to keep things friendly
8. If asked about bugs or errors, suggest basic troubleshooting (refresh, clear cache, try again) and offer to escalate`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    const { message, history, language } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing required field: message' });
    }

    if (!genAI || !GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    });

    // Build conversation history for context
    const chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add system instruction as first user message
    const langInstruction = language ? `IMPORTANT: The user is writing in ${language}. Always respond in ${language}.` : '';
    chatHistory.push({
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\n${langInstruction}\n\nPlease acknowledge that you understand your role as QuizzaBoom's support assistant.` }],
    });
    chatHistory.push({
      role: 'model',
      parts: [{ text: 'Understood! I\'m QuizzaBoom\'s support assistant, ready to help users with the quiz platform. I\'ll be friendly, concise, and answer in the user\'s language. How can I help?' }],
    });

    // Add previous conversation history (last 10 messages max)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'model') {
          chatHistory.push({
            role: msg.role,
            parts: [{ text: msg.text }],
          });
        }
      }
    }

    // Start chat with history
    const chat = model.startChat({ history: chatHistory });

    // Send the new message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Support chat error:', message);
    return res.status(500).json({ error: 'Support chat failed. Please try again.' });
  }
}
