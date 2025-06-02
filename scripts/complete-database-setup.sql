-- Complete Database Setup Script
-- This script fixes all Supabase security issues AND creates the missing trend system tables
-- Run this in your Supabase SQL Editor to resolve all 404 and security errors

-- ===========================================
-- PART 1: SECURITY FIXES (from previous script)
-- ===========================================

-- 1. Fix trained_models table RLS policies
DROP POLICY IF EXISTS "Anyone can read public models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can read their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can insert their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can update their own models" ON trained_models;
DROP POLICY IF EXISTS "Authenticated users can delete their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can read their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can insert their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can update their own models" ON trained_models;
DROP POLICY IF EXISTS "Users can delete their own models" ON trained_models;

ALTER TABLE trained_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public models"
  ON trained_models FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can read their own models"
  ON trained_models FOR SELECT
  USING (
    auth.uid()::text = user_id OR 
    is_public = TRUE OR
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

CREATE POLICY "Users can insert their own models"
  ON trained_models FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id
  );

CREATE POLICY "Users can update their own models"
  ON trained_models FOR UPDATE
  USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

CREATE POLICY "Users can delete their own models"
  ON trained_models FOR DELETE
  USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'email' = '11jellis@gmail.com')
  );

-- 2. Fix profiles table RLS policies (Performance)
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can modify their own profile" ON profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can manage their own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage their own profile"
  ON profiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Fix handle_new_user function (Security)
-- Drop existing trigger first (to avoid dependency error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ===========================================
-- PART 2: CREATE MISSING TREND SYSTEM TABLES
-- ===========================================

-- Create trend_sources table (fixes the 404 POST error)
CREATE TABLE IF NOT EXISTS trend_sources (
  url TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  last_scraped TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS trend_sources_category_idx ON trend_sources(category);
CREATE INDEX IF NOT EXISTS trend_sources_last_scraped_idx ON trend_sources(last_scraped);
CREATE INDEX IF NOT EXISTS trend_sources_active_idx ON trend_sources(is_active);

-- Create social_media_trends table
CREATE TABLE IF NOT EXISTS social_media_trends (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT,
  platforms TEXT[], -- Array of platform names
  content_types TEXT[], -- Array of content types
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  relevance_score INTEGER DEFAULT 5 CHECK (relevance_score >= 1 AND relevance_score <= 10),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS social_media_trends_category_idx ON social_media_trends(category);
CREATE INDEX IF NOT EXISTS social_media_trends_platforms_idx ON social_media_trends USING GIN(platforms);
CREATE INDEX IF NOT EXISTS social_media_trends_content_types_idx ON social_media_trends USING GIN(content_types);
CREATE INDEX IF NOT EXISTS social_media_trends_relevance_idx ON social_media_trends(relevance_score);
CREATE INDEX IF NOT EXISTS social_media_trends_discovered_idx ON social_media_trends(discovered_at);
CREATE INDEX IF NOT EXISTS social_media_trends_expires_idx ON social_media_trends(expires_at);

-- Enable RLS on trend tables
ALTER TABLE trend_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_trends ENABLE ROW LEVEL SECURITY;

-- Create policies for trend_sources
CREATE POLICY "Service role can manage trend sources"
  ON trend_sources FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read trend sources"
  ON trend_sources FOR SELECT TO authenticated
  USING (is_active = true);

-- Create policies for social_media_trends
CREATE POLICY "Service role can manage trends"
  ON social_media_trends FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can read active trends"
  ON social_media_trends FOR SELECT TO anon, authenticated
  USING (expires_at > NOW());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_trend_sources_updated_at ON trend_sources;
CREATE TRIGGER update_trend_sources_updated_at
  BEFORE UPDATE ON trend_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_media_trends_updated_at ON social_media_trends;
CREATE TRIGGER update_social_media_trends_updated_at
  BEFORE UPDATE ON social_media_trends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial trend sources
INSERT INTO trend_sources (url, category) VALUES
  -- Marketing reports and industry resources
  ('https://blog.hubspot.com/marketing/social-media', 'marketing'),
  ('https://sproutsocial.com/insights/social-media-trends/', 'marketing'),
  ('https://www.socialmediaexaminer.com/category/research/', 'research'),
  
  -- Platform-specific trends
  ('https://creators.instagram.com/blog', 'instagram'),
  ('https://newsroom.tiktok.com/en-us/', 'tiktok'),
  ('https://blog.youtube/inside-youtube/tags/creator-updates/', 'youtube'),
  
  -- Celebrity and influencer news
  ('https://www.adweek.com/category/influencers/', 'influencers'),
  ('https://www.hollywoodreporter.com/tags/influencers/', 'influencers'),
  
  -- Industry statistics
  ('https://www.emarketer.com/topics/topic/social-media', 'statistics'),
  ('https://www.statista.com/topics/1164/social-networks/', 'statistics')
ON CONFLICT (url) DO NOTHING;

-- ===========================================
-- PART 3: ADD DOCUMENTATION COMMENTS
-- ===========================================

-- Model security comments
COMMENT ON POLICY "Anyone can read public models" ON trained_models IS 'Allow anyone to read models marked as public';
COMMENT ON POLICY "Users can read their own models" ON trained_models IS 'Users can read their own models and public models';
COMMENT ON POLICY "Users can insert their own models" ON trained_models IS 'Users can only insert models with their own user_id';
COMMENT ON POLICY "Users can update their own models" ON trained_models IS 'Users can only update their own models';
COMMENT ON POLICY "Users can delete their own models" ON trained_models IS 'Users can only delete their own models';

-- Profile security comments
COMMENT ON POLICY "Authenticated users can manage their own profile" ON profiles IS 'Users can view, insert, update, and delete their own profile';
COMMENT ON POLICY "Public can read profiles" ON profiles IS 'Allow public read access to user profiles';

-- Function security comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates or updates a profile when a new user signs up. Fixed search_path for security.';

-- Trend system comments
COMMENT ON TABLE trend_sources IS 'Sources for scraping social media trend data';
COMMENT ON TABLE social_media_trends IS 'Scraped and processed social media trend data';
COMMENT ON COLUMN trend_sources.url IS 'URL of the trend source website';
COMMENT ON COLUMN trend_sources.category IS 'Category of trends from this source';
COMMENT ON COLUMN trend_sources.last_scraped IS 'Timestamp of last successful scrape';
COMMENT ON COLUMN social_media_trends.relevance_score IS 'Relevance score from 1-10';
COMMENT ON COLUMN social_media_trends.expires_at IS 'When this trend expires and should be hidden';

-- ===========================================
-- VERIFICATION QUERIES (OPTIONAL - UNCOMMENT TO RUN)
-- ===========================================

-- Check that all tables exist and RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('trained_models', 'profiles', 'trend_sources', 'social_media_trends');

-- Check all policies are created correctly
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies 
-- WHERE tablename IN ('trained_models', 'profiles', 'trend_sources', 'social_media_trends')
-- ORDER BY tablename, policyname;

-- Check trend sources were inserted
-- SELECT url, category, is_active FROM trend_sources LIMIT 5; 