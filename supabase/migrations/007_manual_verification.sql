-- 007_manual_verification.sql
-- Adds support for manual business verification (autonomos, non-VAT territories, etc.)

-- Add new columns to verification_requests for manual verification data
ALTER TABLE verification_requests
  ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'automatic',
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS commercial_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update the status check constraint to include 'pending_review'
-- (drop old constraint if it exists, then recreate)
DO $$
BEGIN
  ALTER TABLE verification_requests
    DROP CONSTRAINT IF EXISTS verification_requests_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE verification_requests
  ADD CONSTRAINT verification_requests_status_check
  CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected', 'contested'));

-- Index for admin dashboard to quickly find pending reviews
CREATE INDEX IF NOT EXISTS idx_verification_requests_pending_review
  ON verification_requests(status) WHERE status = 'pending_review';

-- Index for looking up verification by user + type
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_type
  ON verification_requests(user_id, registration_type);
