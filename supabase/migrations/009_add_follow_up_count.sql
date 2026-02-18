-- Add follow-up tracking to sales outreach leads
ALTER TABLE sales_outreach_leads
  ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- Update the status CHECK constraint to allow 'follow_up' status
-- First drop the old constraint, then add the new one
ALTER TABLE sales_outreach_leads
  DROP CONSTRAINT IF EXISTS sales_outreach_leads_status_check;

ALTER TABLE sales_outreach_leads
  ADD CONSTRAINT sales_outreach_leads_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'follow_up'));
