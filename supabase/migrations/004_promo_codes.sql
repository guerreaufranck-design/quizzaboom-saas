-- ============================================================
-- Promo Codes System
-- Allows gifting quiz credits without Stripe
-- ============================================================

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  plan_name TEXT NOT NULL,
  max_players INTEGER NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Index for fast code lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code exists (needed for redemption)
CREATE POLICY "Public can read promo codes"
  ON promo_codes FOR SELECT
  USING (true);

-- Service role can do everything (API endpoint uses service role key)
CREATE POLICY "Service role full access"
  ON promo_codes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Seed: 10 codes per plan (40 total)
-- Format: QB-{PLAN}-{4CHARS}
-- All single-use (max_uses = 1)
-- ============================================================

INSERT INTO promo_codes (code, plan_name, max_players, max_uses) VALUES
  -- Solo (5 players, $1.99 value)
  ('QB-SOLO-7K3M', 'Solo', 5, 1),
  ('QB-SOLO-9P2X', 'Solo', 5, 1),
  ('QB-SOLO-4R8N', 'Solo', 5, 1),
  ('QB-SOLO-6W1T', 'Solo', 5, 1),
  ('QB-SOLO-2H5Q', 'Solo', 5, 1),
  ('QB-SOLO-8L4V', 'Solo', 5, 1),
  ('QB-SOLO-3J7Y', 'Solo', 5, 1),
  ('QB-SOLO-1F9B', 'Solo', 5, 1),
  ('QB-SOLO-5D6C', 'Solo', 5, 1),
  ('QB-SOLO-0G8A', 'Solo', 5, 1),

  -- Friends (15 players, $4.99 value)
  ('QB-FRIENDS-4T2K', 'Friends', 15, 1),
  ('QB-FRIENDS-8N6P', 'Friends', 15, 1),
  ('QB-FRIENDS-1X9R', 'Friends', 15, 1),
  ('QB-FRIENDS-5M3W', 'Friends', 15, 1),
  ('QB-FRIENDS-7Q1H', 'Friends', 15, 1),
  ('QB-FRIENDS-2V8L', 'Friends', 15, 1),
  ('QB-FRIENDS-9Y4J', 'Friends', 15, 1),
  ('QB-FRIENDS-6B7F', 'Friends', 15, 1),
  ('QB-FRIENDS-3C5D', 'Friends', 15, 1),
  ('QB-FRIENDS-0A2G', 'Friends', 15, 1),

  -- Party (50 players, $9.99 value)
  ('QB-PARTY-8K1N', 'Party', 50, 1),
  ('QB-PARTY-3P5T', 'Party', 50, 1),
  ('QB-PARTY-6X2M', 'Party', 50, 1),
  ('QB-PARTY-1R9Q', 'Party', 50, 1),
  ('QB-PARTY-4W7H', 'Party', 50, 1),
  ('QB-PARTY-9L3V', 'Party', 50, 1),
  ('QB-PARTY-2J6Y', 'Party', 50, 1),
  ('QB-PARTY-7F4B', 'Party', 50, 1),
  ('QB-PARTY-5D8C', 'Party', 50, 1),
  ('QB-PARTY-0G1A', 'Party', 50, 1),

  -- Pro Event (100+ players, $19.99 value)
  ('QB-PRO-5N8K', 'Pro Event', 100, 1),
  ('QB-PRO-2T4P', 'Pro Event', 100, 1),
  ('QB-PRO-9M1X', 'Pro Event', 100, 1),
  ('QB-PRO-6Q3R', 'Pro Event', 100, 1),
  ('QB-PRO-1H7W', 'Pro Event', 100, 1),
  ('QB-PRO-8V2L', 'Pro Event', 100, 1),
  ('QB-PRO-4Y9J', 'Pro Event', 100, 1),
  ('QB-PRO-7B5F', 'Pro Event', 100, 1),
  ('QB-PRO-3C6D', 'Pro Event', 100, 1),
  ('QB-PRO-0A4G', 'Pro Event', 100, 1);
