-- Create user_email_connections table to store Gmail OAuth tokens
-- Run this migration in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_email_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gmail',
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one connection per provider per user
  UNIQUE(user_id, provider)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id
  ON user_email_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_email_connections_provider
  ON user_email_connections(user_id, provider);

-- Enable Row Level Security
ALTER TABLE user_email_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own connections
CREATE POLICY "Users can view own email connections"
  ON user_email_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own connections
CREATE POLICY "Users can insert own email connections"
  ON user_email_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own connections
CREATE POLICY "Users can update own email connections"
  ON user_email_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own connections
CREATE POLICY "Users can delete own email connections"
  ON user_email_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_email_connections_updated_at ON user_email_connections;
CREATE TRIGGER update_email_connections_updated_at
  BEFORE UPDATE ON user_email_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
