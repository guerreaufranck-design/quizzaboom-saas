-- Sales outreach leads table for B2B prospecting
CREATE TABLE IF NOT EXISTS sales_outreach_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_outreach_email ON sales_outreach_leads(email);
CREATE INDEX IF NOT EXISTS idx_sales_outreach_status ON sales_outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_outreach_created ON sales_outreach_leads(created_at DESC);
