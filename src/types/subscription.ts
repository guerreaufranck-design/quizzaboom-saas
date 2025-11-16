export type SubscriptionType = 'b2b_monthly' | 'b2c_one_time';
export type B2BPlan = 'starter' | 'pro';
export type B2CPlan = '5_players' | '15_players' | '50_players' | '250_players';

export interface Subscription {
  id: string;
  user_id?: string;
  organization_id?: string;
  type: SubscriptionType;
  plan: B2BPlan | B2CPlan;
  amount: number;
  currency: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  stripe_payment_intent_id?: string;
  quiz_id?: string;
  created_at: string;
  expires_at?: string;
}

export interface ParticipantEmail {
  id: string;
  session_id: string;
  player_name: string;
  email: string;
  quiz_results: QuizResults;
  email_sent_at?: string;
  email_opened_at?: string;
  email_clicked_at?: string;
  marketing_email_sent_at?: string;
  marketing_email_opened_at?: string;
  converted_to_customer_at?: string;
  conversion_plan?: B2CPlan;
  source_organization_id?: string;
}

export interface QuizResults {
  score: number;
  rank: number;
  total_players: number;
  accuracy: number;
  best_streak: number;
  strategic_actions: number;
}
