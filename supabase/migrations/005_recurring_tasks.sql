-- Recurring tasks and execution logs for scheduled email automations
-- Allows users to set up tasks that run automatically on a schedule

-- ─── recurring_tasks ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL
    CHECK (task_type IN (
      'archive_by_query', 'trash_by_query', 'unsubscribe_sweep',
      'inbox_stats', 'label_emails', 'custom'
    )),
  task_config JSONB NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INT CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6),
  day_of_month INT CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28),
  time_of_day TIME NOT NULL DEFAULT '09:00',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_executed_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id
  ON recurring_tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_run
  ON recurring_tasks(next_run_at)
  WHERE enabled = true;

-- Enable Row Level Security
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own tasks
CREATE POLICY "Users can view own recurring tasks"
  ON recurring_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring tasks"
  ON recurring_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring tasks"
  ON recurring_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring tasks"
  ON recurring_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_recurring_tasks_updated_at ON recurring_tasks;
CREATE TRIGGER update_recurring_tasks_updated_at
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ─── task_execution_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_execution_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  result JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id
  ON task_execution_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_task_logs_task_id
  ON task_execution_logs(task_id);

CREATE INDEX IF NOT EXISTS idx_task_logs_started_at
  ON task_execution_logs(started_at DESC);

-- Enable Row Level Security
ALTER TABLE task_execution_logs ENABLE ROW LEVEL SECURITY;

-- Policies: users can read their own logs
CREATE POLICY "Users can view own task logs"
  ON task_execution_logs FOR SELECT
  USING (auth.uid() = user_id);
