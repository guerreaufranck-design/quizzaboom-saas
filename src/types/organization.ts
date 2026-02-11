export type SubscriptionPlan = 'starter' | 'pro';
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due';

export interface Organization {
  id: string;
  name: string;
  type: 'bar' | 'restaurant' | 'hotel' | 'event_company' | 'other';
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_starts_at?: string;
  monthly_quiz_limit: number | null;
  quizzes_used_this_month: number;
  max_participants: number;
  white_label_enabled: boolean;
  white_label_settings?: WhiteLabelSettings;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WhiteLabelSettings {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  custom_domain?: string;
  hide_branding: boolean;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'member';
  invited_by?: string;
  invited_at?: string;
  joined_at: string;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'contested';

export interface VerificationRequest {
  id: string;
  user_id: string;
  registration_number: string;
  country: string;
  business_name?: string;
  activity_code?: string;
  status: VerificationStatus;
  rejection_reason?: string;
  detected_type?: string;
  organization_id?: string;
  raw_data?: Record<string, unknown>;
  contested_at?: string;
  contest_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationResult {
  eligible: boolean;
  businessName: string;
  reason?: string;
  detectedType: string;
  organizationId?: string;
  trialEndsAt?: string;
}
