-- Team Mode Support
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT false;
ALTER TABLE session_players ADD COLUMN IF NOT EXISTS team_name TEXT DEFAULT NULL;
