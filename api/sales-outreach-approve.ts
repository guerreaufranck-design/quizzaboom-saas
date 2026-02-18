import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const SALES_PASSWORD = process.env.SALES_OUTREACH_PASSWORD;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@quizzaboom.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'QuizzaBoom';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/sales-outreach-approve
 *
 * Approve or reject a pending_review verification request.
 * Replicates the logic from approve-verification.ts but uses SALES_OUTREACH_PASSWORD.
 *
 * Body: {
 *   password: string,
 *   verificationRequestId: string,
 *   action: 'approve' | 'reject',
 *   rejectionReason?: string
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, verificationRequestId, action, rejectionReason } = req.body;

  if (!password || password !== SALES_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!verificationRequestId || !action) {
    return res.status(400).json({ error: 'Missing verificationRequestId or action' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
  }

  try {
    // Fetch the verification request
    const { data: vr, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', verificationRequestId)
      .single();

    if (fetchError || !vr) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    if (vr.status !== 'pending_review') {
      return res.status(400).json({
        error: `Cannot ${action} — status is "${vr.status}". Only pending_review requests can be processed.`,
      });
    }

    // ─── REJECT ──────────────────────────────────────────────────
    if (action === 'reject') {
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

    // ─── APPROVE ─────────────────────────────────────────────────

    // 1. Determine business name & type
    const businessName = vr.commercial_name || vr.business_name || vr.full_name || 'Business';
    const detectedType = vr.detected_type || vr.business_type || 'other';
    const orgType = ['bar', 'restaurant', 'hotel', 'event_company'].includes(detectedType)
      ? detectedType
      : 'other';

    // 2. Trial: 30 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 3. Create organization
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

    if (orgError || !org) {
      console.error('Organization creation error:', orgError);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    // 4. Add user as organization owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: vr.user_id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Member creation error:', memberError);
      // Rollback: delete orphaned organization
      await supabase.from('organizations').delete().eq('id', org.id);
      return res.status(500).json({ error: 'Failed to link account to organization' });
    }

    // 5. Update verification request
    await supabase
      .from('verification_requests')
      .update({
        status: 'approved',
        organization_id: org.id,
      })
      .eq('id', verificationRequestId);

    // 6. Send approval email to the user
    try {
      // Get user email from auth.users via service role
      const { data: userData } = await supabase.auth.admin.getUserById(vr.user_id);
      const userEmail = userData?.user?.email;

      if (userEmail && SENDGRID_API_KEY) {
        const trialEndFormatted = trialEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="background-color:#16a34a;padding:24px 32px;text-align:center;">
          <h1 style="color:#ffffff;font-size:26px;margin:0;">&#x2705; Account Approved!</h1>
          <p style="color:#dcfce7;font-size:14px;margin:5px 0 0;">Welcome to QuizzaBoom Pro</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
            Hi <strong>${businessName}</strong>,
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
            Great news! Your professional account has been verified and approved. You can now start creating AI-powered quiz nights for your venue.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
            <tr>
              <td style="padding:20px;">
                <p style="color:#16a34a;font-size:14px;font-weight:bold;margin:0 0 10px;">Your Free Trial includes:</p>
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; <strong>30-day free trial</strong> — until ${trialEndFormatted}</td></tr>
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; Up to <strong>5 quizzes per month</strong></td></tr>
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; Up to <strong>250 players</strong> per session</td></tr>
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; AI-generated questions — <strong>fresh every time</strong></td></tr>
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; Real-time leaderboard on your TV</td></tr>
                  <tr><td style="padding:3px 0;color:#333;font-size:14px;">&#x2713; Players join via QR code — no app needed</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="text-align:center;padding:8px 0 24px;">
                <a href="https://quizzaboom.app/pro-dashboard" style="display:inline-block;padding:16px 40px;background-color:#7B2FD8;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  Create Your First Quiz
                </a>
              </td>
            </tr>
          </table>

          <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px;">
            Need help getting started? Reply to this email or reach us at <a href="mailto:support@quizzaboom.app" style="color:#7B2FD8;text-decoration:none;font-weight:bold;">support@quizzaboom.app</a>
          </p>
          <p style="color:#333;font-size:15px;line-height:1.6;margin:12px 0 0;">
            Cheers,<br><strong>The QuizzaBoom Team</strong>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="color:#999;font-size:12px;margin:0;">QuizzaBoom — AI-Powered Quiz Nights for Venues</p>
          <p style="color:#999;font-size:12px;margin:4px 0 0;">
            <a href="https://quizzaboom.app" style="color:#7B2FD8;text-decoration:none;">quizzaboom.app</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: userEmail }] }],
            from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
            subject: `${businessName} — Your QuizzaBoom Pro account is approved!`,
            content: [{ type: 'text/html', value: emailHtml }],
          }),
        });
      }
    } catch (emailErr) {
      // Email is non-critical — don't fail the approval
      console.error('Approval email error:', emailErr);
    }

    return res.status(200).json({
      success: true,
      action: 'approved',
      verificationRequestId,
      organizationId: org.id,
      businessName,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sales outreach approve error:', message);
    return res.status(500).json({ error: message });
  }
}
