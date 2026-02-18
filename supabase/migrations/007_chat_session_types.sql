-- Add chat_type column to distinguish BLITZ vs outreach sessions
ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS chat_type TEXT NOT NULL DEFAULT 'agent';

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_chat_sessions_chat_type ON chat_sessions(chat_type);
