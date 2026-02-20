import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';
import { buildDynamicSystemPrompt } from './_appKnowledge';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';
const SUPPORT_NOTIFY_EMAIL = process.env.SUPPORT_NOTIFY_EMAIL || 'support@quizzaboom.app';

// Dynamic system prompt — auto-generated from app configuration
const SYSTEM_PROMPT = buildDynamicSystemPrompt();

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

// ── Send notification email via SendGrid ─────────────────────────────
async function sendNewChatNotification(conversationId: string, firstMessage: string, language: string, userPage: string) {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured — skipping chat notification');
    return;
  }

  try {
    const adminUrl = `https://quizzaboom.app/support-admin?id=${conversationId}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#8B3FE8;">New Support Chat on QuizzaBoom</h2>
        <p><strong>Language:</strong> ${language || 'Unknown'}</p>
        <p><strong>Page:</strong> ${userPage || 'Unknown'}</p>
        <p><strong>First message:</strong></p>
        <blockquote style="background:#f5f5f5;padding:12px 16px;border-left:4px solid #8B3FE8;margin:12px 0;border-radius:4px;">
          ${firstMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </blockquote>
        <p>
          <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#8B3FE8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
            Open Admin Dashboard
          </a>
        </p>
        <p style="color:#999;font-size:12px;margin-top:20px;">QuizzaBoom Support System</p>
      </div>
    `;

    await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: SUPPORT_NOTIFY_EMAIL }] }],
        from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
        subject: `💬 New support chat on QuizzaBoom`,
        content: [{ type: 'text/html', value: html }],
      }),
    });
  } catch (err) {
    console.error('Failed to send chat notification email:', err);
  }
}

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
    const { message, history, language, conversationId: existingConvId, userPage } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing required field: message' });
    }

    if (!genAI || !GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable' });
    }

    // ── 1. Create or fetch conversation ──────────────────────────────
    let conversationId = existingConvId;
    let conversationStatus = 'AI_HANDLING';

    if (!conversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('support_conversations')
        .insert({
          status: 'AI_HANDLING',
          language: language || 'en',
          user_ip: clientIp,
          user_page: userPage || null,
          user_agent: (req.headers['user-agent'] as string) || null,
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Failed to create conversation:', convError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      conversationId = newConv.id;

      // Send notification email (non-blocking)
      sendNewChatNotification(conversationId, message, language || 'en', userPage || 'unknown').catch(() => {});
    } else {
      // Fetch existing conversation status
      const { data: conv } = await supabase
        .from('support_conversations')
        .select('status')
        .eq('id', conversationId)
        .single();

      if (conv) {
        conversationStatus = conv.status;
      }
    }

    // ── 2. Insert user message ───────────────────────────────────────
    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      role: 'USER',
      content: message,
    });

    // ── 3. If human is handling, skip AI ─────────────────────────────
    if (conversationStatus === 'HUMAN_HANDLING') {
      // Update conversation timestamp
      await supabase
        .from('support_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return res.status(200).json({
        reply: language === 'French' || language === 'fr'
          ? 'Un agent humain s\'occupe de votre conversation. Il va vous répondre sous peu !'
          : language === 'German' || language === 'de'
          ? 'Ein menschlicher Agent kümmert sich um Ihre Konversation. Er wird Ihnen in Kürze antworten!'
          : language === 'Spanish' || language === 'es'
          ? 'Un agente humano está atendiendo su conversación. ¡Le responderá en breve!'
          : 'A human agent is handling your conversation. They will reply shortly!',
        conversationId,
        escalated: false,
      });
    }

    // ── 4. Call Gemini AI ────────────────────────────────────────────
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
    let text = response.text();

    // ── 5. Detect escalation ─────────────────────────────────────────
    let escalated = false;
    if (text.includes('[ESCALATE]')) {
      escalated = true;
      text = text.replace('[ESCALATE]', '').trim();

      // Update conversation status to WAITING_HUMAN
      await supabase
        .from('support_conversations')
        .update({
          status: 'WAITING_HUMAN',
          escalated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    }

    // ── 6. Insert AI message ─────────────────────────────────────────
    await supabase.from('support_messages').insert({
      conversation_id: conversationId,
      role: 'AI',
      content: text,
    });

    // ── 7. Update conversation timestamp ─────────────────────────────
    if (!escalated) {
      await supabase
        .from('support_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return res.status(200).json({ reply: text, conversationId, escalated });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Support chat error:', errMsg);
    return res.status(500).json({ error: 'Support chat failed. Please try again.' });
  }
}
