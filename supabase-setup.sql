-- PureScan AI - Supabase Database Setup
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  daily_scans INT DEFAULT 0,
  last_scan_date DATE,
  current_streak INT DEFAULT 0,
  level_xp INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. SCANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  product_name TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  harmful_chemicals JSONB DEFAULT '[]'::jsonb,
  grade TEXT,
  score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Users can read their own scans
CREATE POLICY "Users can read own scans"
  ON scans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scans
CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own scans
CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);

-- ============================================
-- 3. STORAGE BUCKET
-- ============================================
-- Create the storage bucket for product scan images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-scans', 'product-scans', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public read access
CREATE POLICY "Public read access for product scans"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-scans');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-scans'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
