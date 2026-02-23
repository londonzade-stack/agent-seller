-- Add billing_interval column to track monthly vs annual subscriptions
-- Values: 'month' (default) or 'year'
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month';
