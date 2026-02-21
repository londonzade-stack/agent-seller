-- Add metadata JSONB column to chat_messages for storing tool call details
-- This column stores tool invocation summaries (name, input, output) for assistant messages
-- Nullable — existing messages will have NULL metadata (no tool calls displayed)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
