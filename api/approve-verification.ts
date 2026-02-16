import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

/**
 * POST /api/approve-verification
 *
 * Admin endpoint to approve or reject manual verification requests.
 * Secured by ADMIN_SECRET header.
 *
 * Body: {
 *   verificationRequestId: string,
 *   action: 'approve' | 'reject',
 *   rejectionReason?: string
 * }
 *
 * Headers: { Authorization: 'Bearer <ADMIN_SECRET>' }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!ADMIN_SECRET || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { verificationRequestId, action, rejectionReason } = req.body;

  if (!verificationRequestId || !action) {
    return res.status(400).json({ error: 'Missing required fields: verificationRequestId, action' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject".' });
  }

  try {
    // Fetch the verification request
    const { data: verificationRequest, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', verificationRequestId)
      .single();

    if (fetchError || !verificationRequest) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    if (verificationRequest.status !== 'pending_review') {
      return res.status(400).json({
        error: `Cannot ${action} a request with status "${verificationRequest.status}". Only pending_review requests can be processed.`,
      });
    }

    if (action === 'reject') {
      // Reject: update status + reason
      await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || 'Manual review: not eligible',
        })
        .eq('id', verificationRequestId);

      return res.status(200).json({
        success: true,
        action: 'rejected',
        verificationRequestId,
      });
    }

    // --- APPROVE: Create organization + member ---

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const detectedType = verificationRequest.detected_type || 'other';
    const orgType = (['bar', 'restaurant', 'hotel', 'event_company'].includes(detectedType))
      ? detectedType as 'bar' | 'restaurant' | 'hotel' | 'event_company'
      : 'other';

    const businessName = verificationRequest.commercial_name || verificationRequest.business_name || verificationRequest.full_name || 'Business';

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: businessName,
        type: orgType,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
        monthly_quiz_limit: 5,
        quizzes_used_this_month: 0,
        max_participants: 250,
        white_label_enabled: false,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // Add user as organization owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: verificationRequest.user_id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Clean up orphaned organization
      await supabase.from('organizations').delete().eq('id', org.id);
      return res.status(500).json({ error: 'Failed to link account to organization' });
    }

    // Update verification request
    await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        organization_id: org.id,
      })
      .eq('id', verificationRequestId);

    return res.status(200).json({
      success: true,
      action: 'approved',
      verificationRequestId,
      organizationId: org.id,
      businessName,
      trialEndsAt: trialEndsAt.toISOString(),
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
