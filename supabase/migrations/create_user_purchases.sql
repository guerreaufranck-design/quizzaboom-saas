-- Create user_purchases table
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  plan_name TEXT NOT NULL,
  max_players INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  quiz_session_id UUID REFERENCES quiz_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON user_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: System can insert purchases
CREATE POLICY "System can insert purchases"
  ON user_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own purchases
CREATE POLICY "Users can update own purchases"
  ON user_purchases
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX idx_user_purchases_stripe_session ON user_purchases(stripe_session_id);
