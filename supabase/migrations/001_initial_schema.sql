-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS (B2B)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('bar', 'restaurant', 'hotel', 'event_company', 'other')),
  subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'pro')) DEFAULT 'starter',
  subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  subscription_starts_at TIMESTAMPTZ,
  monthly_quiz_limit INTEGER,
  quizzes_used_this_month INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 250,
  white_label_enabled BOOLEAN DEFAULT FALSE,
  white_label_settings JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION MEMBERS
-- ============================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI GENERATED QUIZZES
-- ============================================
CREATE TABLE ai_generated_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_stages INTEGER NOT NULL,
  questions_per_stage INTEGER NOT NULL,
  has_joker_rounds BOOLEAN DEFAULT FALSE,
  stage_themes TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  estimated_duration INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI QUESTIONS
-- ============================================
CREATE TABLE ai_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES ai_generated_quizzes(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false')) DEFAULT 'multiple_choice',
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  fun_fact TEXT,
  points INTEGER DEFAULT 100,
  time_limit INTEGER DEFAULT 30,
  stage_order INTEGER NOT NULL,
  global_order INTEGER NOT NULL,
  is_joker_question BOOLEAN DEFAULT FALSE,
  joker_type TEXT,
  image_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUIZ SESSIONS
-- ============================================
CREATE TABLE quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES ai_generated_quizzes(id) ON DELETE CASCADE,
  session_code TEXT UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
  current_stage INTEGER DEFAULT 0,
  current_question INTEGER DEFAULT 0,
  unlimited_players BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  party_mode BOOLEAN DEFAULT FALSE,
  total_players INTEGER DEFAULT 0,
  active_players INTEGER DEFAULT 0,
  peak_concurrent_players INTEGER DEFAULT 0,
  strategic_mode_enabled BOOLEAN DEFAULT TRUE,
  joker_actions_enabled BOOLEAN DEFAULT TRUE,
  timing_phases JSONB DEFAULT '{"announcement": 12, "jokers": 12, "question": 30, "results": 5}',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSION PLAYERS
-- ============================================
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  player_id UUID NOT NULL,
  email TEXT,
  avatar_emoji TEXT DEFAULT '😀',
  player_color TEXT DEFAULT '#E91E8C',
  total_score INTEGER DEFAULT 0,
  current_stage INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT TRUE,
  strategic_actions_taken INTEGER DEFAULT 0,
  successful_strategic_actions INTEGER DEFAULT 0,
  threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high', 'extreme')) DEFAULT 'low',
  protection_uses_remaining INTEGER DEFAULT 2,
  block_uses_remaining INTEGER DEFAULT 10,
  steal_uses_remaining INTEGER DEFAULT 10,
  double_points_uses_remaining INTEGER DEFAULT 5,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOKER ACTIONS
-- ============================================
CREATE TABLE joker_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  question_number INTEGER NOT NULL,
  question_theme TEXT,
  action_type TEXT CHECK (action_type IN ('protection', 'block', 'steal', 'double_points')) NOT NULL,
  target_player_id UUID,
  timestamp BIGINT NOT NULL,
  action_order INTEGER NOT NULL,
  response_time INTEGER,
  resolution_status TEXT CHECK (resolution_status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  failure_reason TEXT,
  points_affected INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PLAYER ANSWERS
-- ============================================
CREATE TABLE player_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  question_id UUID REFERENCES ai_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  base_points INTEGER DEFAULT 0,
  time_bonus_points INTEGER DEFAULT 0,
  streak_bonus_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  time_taken INTEGER NOT NULL,
  was_fastest_correct BOOLEAN DEFAULT FALSE,
  joker_effects_applied JSONB DEFAULT '{}',
  was_blocked BOOLEAN DEFAULT FALSE,
  was_protected BOOLEAN DEFAULT FALSE,
  had_double_points BOOLEAN DEFAULT FALSE,
  stolen_points_bonus INTEGER DEFAULT 0,
  speed_rank INTEGER,
  speed_multiplier NUMERIC(3,2) DEFAULT 1.0,
  final_answer_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('b2b_monthly', 'b2c_one_time')) NOT NULL,
  plan TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'pending')) DEFAULT 'active',
  stripe_payment_intent_id TEXT,
  quiz_id UUID REFERENCES ai_generated_quizzes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================
-- PARTICIPANT EMAILS (Marketing Funnel)
-- ============================================
CREATE TABLE participant_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  email TEXT NOT NULL,
  quiz_results JSONB NOT NULL,
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  marketing_email_sent_at TIMESTAMPTZ,
  marketing_email_opened_at TIMESTAMPTZ,
  converted_to_customer_at TIMESTAMPTZ,
  conversion_plan TEXT,
  source_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_quiz_sessions_code ON quiz_sessions(session_code);
CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_joker_actions_session ON joker_actions(session_id);
CREATE INDEX idx_player_answers_session ON player_answers(session_id);
CREATE INDEX idx_ai_questions_quiz ON ai_questions(quiz_id);
CREATE INDEX idx_participant_emails_email ON participant_emails(email);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON ai_generated_quizzes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON quiz_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE joker_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_emails ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Public read for sessions by code)
CREATE POLICY "Public can read sessions by code" ON quiz_sessions
  FOR SELECT USING (true);

CREATE POLICY "Public can insert players" ON session_players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read players in session" ON session_players
  FOR SELECT USING (true);
