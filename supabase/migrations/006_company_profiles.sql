-- Company profiles for Pro users
-- Stores company context that gets injected into the AI agent's system prompt
-- so BLITZ always knows who the user is and what they sell.

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT,
  description TEXT,
  user_role TEXT,
  target_customer TEXT,
  industry TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id
  ON company_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can CRUD their own profile
CREATE POLICY "Users can view own company profile"
  ON company_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own company profile"
  ON company_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own company profile"
  ON company_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at (reuses function from 002_subscriptions.sql)
DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
