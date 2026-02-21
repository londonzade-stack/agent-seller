-- Scheduled emails table — stores emails to be sent at a future time
-- Processed by Supabase pg_cron calling /api/cron/send-scheduled-emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_to TEXT NOT NULL,
  recipient_cc TEXT,
  recipient_bcc TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  thread_id TEXT,                          -- For replies
  scheduled_at TIMESTAMPTZ NOT NULL,       -- When to send
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'canceled')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_user_id ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_due ON scheduled_emails(scheduled_at)
  WHERE status = 'scheduled';

-- RLS
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scheduled emails" ON scheduled_emails
  FOR ALL USING (auth.uid() = user_id);
