import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, action } = req.body;

    // Auth check
    const adminPassword = process.env.SALES_PASSWORD || process.env.VITE_SALES_PASSWORD || '';
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (action === 'get_codes') {
      // 1. Get all promo codes
      const { data: codes, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Get all promo-based purchases with user_id
      const codeNames = (codes || []).map((c) => `promo:${c.code}`);
      if (codeNames.length === 0) {
        return res.status(200).json({ codes: [] });
      }

      const { data: purchases, error: purchaseError } = await supabase
        .from('user_purchases')
        .select('stripe_session_id, user_id, created_at, used, quiz_session_id')
        .in('stripe_session_id', codeNames);

      if (purchaseError) throw purchaseError;

      // 3. Collect all unique user_ids from purchases
      const userIds = [...new Set((purchases || []).map((p) => p.user_id))];

      // 4. Fetch user emails from auth.users (service role can access this)
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        // Use admin API to get user details
        const emailPromises = userIds.map(async (uid) => {
          const { data } = await supabase.auth.admin.getUserById(uid);
          return { uid, email: data?.user?.email || null };
        });
        const emailResults = await Promise.all(emailPromises);
        for (const r of emailResults) {
          if (r.email) emailMap[r.uid] = r.email;
        }
      }

      // 5. Fetch quizzes created by these users
      let quizMap: Record<string, Array<{ id: string; title: string; created_at: string }>> = {};
      if (userIds.length > 0) {
        const { data: quizzes } = await supabase
          .from('ai_generated_quizzes')
          .select('id, creator_id, title, created_at')
          .in('creator_id', userIds)
          .order('created_at', { ascending: false });

        for (const q of quizzes || []) {
          if (!quizMap[q.creator_id]) quizMap[q.creator_id] = [];
          quizMap[q.creator_id].push({ id: q.id, title: q.title, created_at: q.created_at });
        }
      }

      // 6. Fetch sessions hosted by these users
      let sessionMap: Record<string, Array<{
        id: string;
        session_code: string;
        status: string;
        total_players: number;
        started_at: string | null;
        finished_at: string | null;
        quiz_title: string | null;
      }>> = {};
      if (userIds.length > 0) {
        const { data: sessions } = await supabase
          .from('quiz_sessions')
          .select('id, host_id, session_code, status, total_players, started_at, finished_at, quiz_id')
          .in('host_id', userIds)
          .order('created_at', { ascending: false });

        // Get quiz titles for sessions
        const quizIds = [...new Set((sessions || []).map((s) => s.quiz_id).filter(Boolean))];
        let quizTitleMap: Record<string, string> = {};
        if (quizIds.length > 0) {
          const { data: quizTitles } = await supabase
            .from('ai_generated_quizzes')
            .select('id, title')
            .in('id', quizIds);
          for (const q of quizTitles || []) {
            quizTitleMap[q.id] = q.title;
          }
        }

        for (const s of sessions || []) {
          if (!sessionMap[s.host_id]) sessionMap[s.host_id] = [];
          sessionMap[s.host_id].push({
            id: s.id,
            session_code: s.session_code,
            status: s.status,
            total_players: s.total_players || 0,
            started_at: s.started_at,
            finished_at: s.finished_at,
            quiz_title: quizTitleMap[s.quiz_id] || null,
          });
        }
      }

      // 7. Build enriched redemptions per code
      const redemptionMap: Record<string, Array<{
        user_id: string;
        email: string | null;
        redeemed_at: string;
        quiz_used: boolean;
        quizzes_created: number;
        sessions_hosted: number;
        total_players_reached: number;
        sessions: Array<{
          session_code: string;
          status: string;
          total_players: number;
          quiz_title: string | null;
          started_at: string | null;
        }>;
      }>> = {};

      for (const p of purchases || []) {
        const code = p.stripe_session_id.replace('promo:', '');
        if (!redemptionMap[code]) redemptionMap[code] = [];

        const userSessions = sessionMap[p.user_id] || [];
        const totalPlayersReached = userSessions.reduce((sum, s) => sum + (s.total_players || 0), 0);

        redemptionMap[code].push({
          user_id: p.user_id,
          email: emailMap[p.user_id] || null,
          redeemed_at: p.created_at,
          quiz_used: p.used,
          quizzes_created: (quizMap[p.user_id] || []).length,
          sessions_hosted: userSessions.length,
          total_players_reached: totalPlayersReached,
          sessions: userSessions.slice(0, 10).map((s) => ({
            session_code: s.session_code,
            status: s.status,
            total_players: s.total_players,
            quiz_title: s.quiz_title,
            started_at: s.started_at,
          })),
        });
      }

      // 8. Enrich codes
      const enrichedCodes = (codes || []).map((c) => ({
        ...c,
        redemptions: redemptionMap[c.code] || [],
      }));

      return res.status(200).json({ codes: enrichedCodes });
    }

    if (action === 'toggle_active') {
      const { codeId, isActive } = req.body;
      if (!codeId) return res.status(400).json({ error: 'Missing codeId' });

      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive })
        .eq('id', codeId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (action === 'create_code') {
      const { code, planName, maxPlayers, maxUses, expiresAt } = req.body;
      if (!code || !planName || !maxPlayers || !maxUses) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: code.trim().toUpperCase(),
          plan_name: planName,
          max_players: maxPlayers,
          max_uses: maxUses,
          expires_at: expiresAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ code: data });
    }

    if (action === 'delete_code') {
      const { codeId } = req.body;
      if (!codeId) return res.status(400).json({ error: 'Missing codeId' });

      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Promo tracking error:', message);
    return res.status(500).json({ error: message });
  }
}
