-- ============================================================
-- 010_support_chat.sql
-- Support chat persistence: conversations + messages
-- Enables real-time human escalation and admin dashboard
-- ============================================================

-- Support conversations
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'AI_HANDLING'
    CHECK (status IN ('AI_HANDLING', 'WAITING_HUMAN', 'HUMAN_HANDLING', 'RESOLVED')),
  language TEXT DEFAULT 'en',
  user_ip TEXT,
  user_page TEXT,
  user_agent TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('USER', 'AI', 'HUMAN', 'SYSTEM')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_support_conversations_status ON support_conversations(status);
CREATE INDEX idx_support_conversations_created ON support_conversations(created_at DESC);
CREATE INDEX idx_support_conversations_updated ON support_conversations(updated_at DESC);
CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at);

-- Enable Realtime for both tables (required for postgres_changes subscriptions)
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;

-- RLS policies
-- Users (anon) can create conversations and send messages
-- Admin uses service_role key which bypasses RLS
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Anon can create conversations
CREATE POLICY "anon_insert_conversations" ON support_conversations
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can read conversations (by UUID - unguessable)
CREATE POLICY "anon_select_conversations" ON support_conversations
  FOR SELECT TO anon USING (true);

-- Anon can insert messages
CREATE POLICY "anon_insert_messages" ON support_messages
  FOR INSERT TO anon WITH CHECK (true);

-- Anon can read messages
CREATE POLICY "anon_select_messages" ON support_messages
  FOR SELECT TO anon USING (true);
