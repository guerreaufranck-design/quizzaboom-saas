import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SUPPORT_ADMIN_PASSWORD = process.env.SUPPORT_ADMIN_PASSWORD;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password, ...params } = req.body;

  // ── Auth check ───────────────────────────────────────────────────
  if (action === 'login') {
    if (!SUPPORT_ADMIN_PASSWORD) {
      return res.status(500).json({ error: 'Admin password not configured' });
    }
    if (password !== SUPPORT_ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    return res.status(200).json({ ok: true });
  }

  // All other actions require auth
  if (!SUPPORT_ADMIN_PASSWORD || password !== SUPPORT_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ── Get Stats ────────────────────────────────────────────────────
    if (action === 'get_stats') {
      const { data: conversations, error } = await supabase
        .from('support_conversations')
        .select('status, resolved_at');

      if (error) throw error;

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = {
        waiting: 0,
        active: 0,
        ai_handling: 0,
        resolved_today: 0,
        total: conversations?.length || 0,
      };

      for (const c of conversations || []) {
        if (c.status === 'WAITING_HUMAN') stats.waiting++;
        else if (c.status === 'HUMAN_HANDLING') stats.active++;
        else if (c.status === 'AI_HANDLING') stats.ai_handling++;
        if (c.status === 'RESOLVED' && c.resolved_at && new Date(c.resolved_at) > twentyFourHoursAgo) {
          stats.resolved_today++;
        }
      }

      return res.status(200).json(stats);
    }

    // ── Get Conversations ────────────────────────────────────────────
    if (action === 'get_conversations') {
      const { status: filterStatus, limit = 50 } = params;

      let query = supabase
        .from('support_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data: conversations, error } = await query;
      if (error) throw error;

      // Fetch last message + message count for each conversation
      const enriched = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('support_messages')
            .select('content, role, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from('support_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            ...conv,
            last_message: lastMsg?.content || '',
            last_message_role: lastMsg?.role || '',
            last_message_at: lastMsg?.created_at || conv.updated_at,
            message_count: count || 0,
          };
        })
      );

      // Sort: WAITING_HUMAN first, then HUMAN_HANDLING, then AI_HANDLING, then RESOLVED
      const statusOrder: Record<string, number> = {
        WAITING_HUMAN: 0,
        HUMAN_HANDLING: 1,
        AI_HANDLING: 2,
        RESOLVED: 3,
      };

      enriched.sort((a, b) => {
        const orderDiff = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
        if (orderDiff !== 0) return orderDiff;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      return res.status(200).json(enriched);
    }

    // ── Get Messages ─────────────────────────────────────────────────
    if (action === 'get_messages') {
      const { conversationId } = params;
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversationId' });
      }

      const { data: conversation } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      const { data: messages, error } = await supabase
        .from('support_messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return res.status(200).json({
        conversation,
        messages: messages || [],
      });
    }

    // ── Send Human Message ───────────────────────────────────────────
    if (action === 'send_message') {
      const { conversationId, content } = params;
      if (!conversationId || !content) {
        return res.status(400).json({ error: 'Missing conversationId or content' });
      }

      // Insert human message
      const { error: msgError } = await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        role: 'HUMAN',
        content,
      });

      if (msgError) throw msgError;

      // Update conversation status to HUMAN_HANDLING
      await supabase
        .from('support_conversations')
        .update({
          status: 'HUMAN_HANDLING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return res.status(200).json({ ok: true });
    }

    // ── Resolve Conversation ─────────────────────────────────────────
    if (action === 'resolve') {
      const { conversationId } = params;
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversationId' });
      }

      await supabase
        .from('support_conversations')
        .update({
          status: 'RESOLVED',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Insert system message
      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        role: 'SYSTEM',
        content: 'Conversation resolved by support agent.',
      });

      return res.status(200).json({ ok: true });
    }

    // ── Reopen Conversation ──────────────────────────────────────────
    if (action === 'reopen') {
      const { conversationId } = params;
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversationId' });
      }

      await supabase
        .from('support_conversations')
        .update({
          status: 'HUMAN_HANDLING',
          resolved_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Insert system message
      await supabase.from('support_messages').insert({
        conversation_id: conversationId,
        role: 'SYSTEM',
        content: 'Conversation reopened by support agent.',
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Support admin error:', errMsg);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
