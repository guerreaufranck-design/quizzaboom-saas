-- Verification requests table for business verification workflow
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  registration_number TEXT NOT NULL,
  country TEXT NOT NULL,
  business_name TEXT,
  activity_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contested')),
  rejection_reason TEXT,
  detected_type TEXT,
  organization_id UUID REFERENCES organizations(id),
  raw_data JSONB,
  contested_at TIMESTAMPTZ,
  contest_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

-- RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification requests
CREATE POLICY "Users can view own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification requests (via API)
CREATE POLICY "Users can create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do anything (used by API endpoint)
CREATE POLICY "Service role full access to verification_requests"
  ON verification_requests FOR ALL
  USING (auth.role() = 'service_role');
