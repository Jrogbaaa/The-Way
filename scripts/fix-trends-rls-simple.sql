-- Simple RLS Fix for Trends System
-- This script avoids "already exists" errors by dropping everything first

-- ===========================================
-- 1. Completely reset social_media_trends policies
-- ===========================================

-- Drop ALL existing policies (using different variations of names)
DROP POLICY IF EXISTS "Anyone can read social media trends" ON social_media_trends;
DROP POLICY IF EXISTS "Service role can insert trends" ON social_media_trends;
DROP POLICY IF EXISTS "Service role can update trends" ON social_media_trends;
DROP POLICY IF EXISTS "Service role can delete trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can read trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can insert trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can update trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can delete trends" ON social_media_trends;

-- Temporarily disable RLS to clear any issues
ALTER TABLE social_media_trends DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE social_media_trends ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policies
CREATE POLICY "Public read access" ON social_media_trends FOR SELECT USING (true);
CREATE POLICY "Service insert access" ON social_media_trends FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update access" ON social_media_trends FOR UPDATE USING (true);
CREATE POLICY "Service delete access" ON social_media_trends FOR DELETE USING (true);

-- ===========================================
-- 2. Completely reset trend_sources policies  
-- ===========================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can read trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Service role can manage trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can read trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can insert trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can update trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can delete trend sources" ON trend_sources;

-- Temporarily disable RLS
ALTER TABLE trend_sources DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS  
ALTER TABLE trend_sources ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policies
CREATE POLICY "Public read trend sources" ON trend_sources FOR SELECT USING (true);
CREATE POLICY "Service manage trend sources" ON trend_sources FOR ALL USING (true);

-- ===========================================
-- 3. Verify the fix
-- ===========================================

-- Check that policies are created correctly
SELECT tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename IN ('social_media_trends', 'trend_sources')
ORDER BY tablename, policyname; 