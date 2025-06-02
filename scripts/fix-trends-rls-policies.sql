-- Fix RLS Policies for Trends System
-- This allows API operations while maintaining security

-- ===========================================
-- 1. Fix social_media_trends table RLS policies
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can insert trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can update trends" ON social_media_trends;
DROP POLICY IF EXISTS "Authenticated users can delete trends" ON social_media_trends;

-- Create more permissive policies that allow API operations
-- Allow anon role to read trends (public data)
CREATE POLICY "Anyone can read social media trends"
  ON social_media_trends
  FOR SELECT
  USING (true);

-- Allow service role to insert trends (for API operations)
CREATE POLICY "Service role can insert trends"
  ON social_media_trends
  FOR INSERT
  WITH CHECK (
    -- Allow if using service role key OR if user is authenticated
    auth.role() = 'service_role' OR 
    auth.uid() IS NOT NULL
  );

-- Allow service role to update trends
CREATE POLICY "Service role can update trends"
  ON social_media_trends
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR 
    auth.uid() IS NOT NULL
  );

-- Allow service role to delete trends
CREATE POLICY "Service role can delete trends"
  ON social_media_trends
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR 
    auth.uid() IS NOT NULL
  );

-- ===========================================
-- 2. Fix trend_sources table RLS policies
-- ===========================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can insert trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can update trend sources" ON trend_sources;
DROP POLICY IF EXISTS "Authenticated users can delete trend sources" ON trend_sources;

-- Create permissive policies for trend_sources
-- Allow anon role to read trend sources
CREATE POLICY "Anyone can read trend sources"
  ON trend_sources
  FOR SELECT
  USING (true);

-- Allow service role to manage trend sources
CREATE POLICY "Service role can manage trend sources"
  ON trend_sources
  FOR ALL
  USING (
    auth.role() = 'service_role' OR 
    auth.uid() IS NOT NULL
  );

-- ===========================================
-- 3. Alternative: Temporarily disable RLS for testing
-- ===========================================

-- UNCOMMENT THESE LINES IF ABOVE POLICIES STILL DON'T WORK:
-- ALTER TABLE social_media_trends DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE trend_sources DISABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. Verify policies
-- ===========================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('social_media_trends', 'trend_sources')
ORDER BY tablename, policyname; 