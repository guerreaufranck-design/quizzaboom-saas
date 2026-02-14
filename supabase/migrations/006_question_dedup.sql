-- ============================================
-- 006: Question Deduplication
-- Adds question_hash to prevent repeated questions
-- ============================================

-- Add hash column for deduplication
ALTER TABLE ai_questions ADD COLUMN IF NOT EXISTS question_hash TEXT;

-- Compute hashes for all existing questions
UPDATE ai_questions
SET question_hash = md5(lower(trim(question_text)) || '||' || lower(trim(correct_answer)))
WHERE question_hash IS NULL;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ai_questions_hash ON ai_questions(question_hash);

-- Create index for creator-based dedup lookups (join quiz → questions)
CREATE INDEX IF NOT EXISTS idx_ai_quizzes_creator ON ai_generated_quizzes(creator_id);
