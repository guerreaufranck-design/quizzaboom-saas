import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';
import { buildDynamicSystemPrompt } from './_appKnowledge';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Dynamic system prompt — auto-generated from app configuration
const SYSTEM_PROMPT = buildDynamicSystemPrompt();

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
      model: 'gemini-2.5-flash',
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
