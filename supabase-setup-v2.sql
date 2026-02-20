-- PureScan AI - Extended Schema for Event State Machine
-- Run this in the Supabase SQL Editor AFTER the initial setup

-- ============================================
-- SCAN LOGS TABLE (Event State Machine)
-- ============================================
CREATE TYPE scan_state AS ENUM (
  'IDLE',
  'SCANNING',
  'API_FETCHING',
  'VALIDATING',
  'AI_PROCESSING',
  'DISPLAY_RESULT',
  'ERROR'
);

CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('food', 'cosmetics')),
  method TEXT NOT NULL CHECK (method IN ('barcode', 'ingredient', 'item')),
  barcode TEXT,
  product_name TEXT,
  current_state scan_state DEFAULT 'IDLE',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan_logs"
  ON scan_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan_logs"
  ON scan_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scan_logs"
  ON scan_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_scan_logs_user ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created ON scan_logs(created_at DESC);

-- Add scan_type and method columns to existing scans table (optional, for tracking)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'food';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'item';
ALTER TABLE scans ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE scans ADD COLUMN IF NOT EXISTS brand TEXT;
