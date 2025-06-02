-- Create tables for Social Media Trends System
-- This fixes the 404 errors for trend_sources and social_media_trends tables

-- ===========================================
-- 1. Create trend_sources table
-- ===========================================

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

-- ===========================================
-- 2. Create social_media_trends table
-- ===========================================

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

-- ===========================================
-- 3. Enable RLS on trend tables
-- ===========================================

-- Enable RLS on trend_sources (admin/system only)
ALTER TABLE trend_sources ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage trend sources
CREATE POLICY "Service role can manage trend sources"
  ON trend_sources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read trend sources
CREATE POLICY "Authenticated users can read trend sources"
  ON trend_sources
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Enable RLS on social_media_trends
ALTER TABLE social_media_trends ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage trends
CREATE POLICY "Service role can manage trends"
  ON social_media_trends
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access to active trends
CREATE POLICY "Public can read active trends"
  ON social_media_trends
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > NOW());

-- ===========================================
-- 4. Insert initial trend sources
-- ===========================================

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
-- 5. Create updated_at trigger function
-- ===========================================

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

-- ===========================================
-- 6. Add comments for documentation
-- ===========================================

COMMENT ON TABLE trend_sources IS 'Sources for scraping social media trend data';
COMMENT ON COLUMN trend_sources.url IS 'URL of the trend source website';
COMMENT ON COLUMN trend_sources.category IS 'Category of trends from this source (marketing, research, etc.)';
COMMENT ON COLUMN trend_sources.last_scraped IS 'Timestamp of last successful scrape';
COMMENT ON COLUMN trend_sources.is_active IS 'Whether this source is active for scraping';

COMMENT ON TABLE social_media_trends IS 'Scraped and processed social media trend data';
COMMENT ON COLUMN social_media_trends.id IS 'Unique identifier for the trend';
COMMENT ON COLUMN social_media_trends.title IS 'Title of the trend';
COMMENT ON COLUMN social_media_trends.summary IS 'Description of the trend';
COMMENT ON COLUMN social_media_trends.source IS 'Source website hostname';
COMMENT ON COLUMN social_media_trends.source_url IS 'Full URL where trend was discovered';
COMMENT ON COLUMN social_media_trends.category IS 'Category of the trend';
COMMENT ON COLUMN social_media_trends.platforms IS 'Array of social media platforms this trend applies to';
COMMENT ON COLUMN social_media_trends.content_types IS 'Array of content types for this trend';
COMMENT ON COLUMN social_media_trends.relevance_score IS 'Relevance score from 1-10';
COMMENT ON COLUMN social_media_trends.expires_at IS 'When this trend expires and should be hidden';

-- ===========================================
-- Verification queries (optional)
-- ===========================================

-- Check tables were created
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name IN ('trend_sources', 'social_media_trends');

-- Check initial data
-- SELECT url, category, is_active FROM trend_sources;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies 
-- WHERE tablename IN ('trend_sources', 'social_media_trends')
-- ORDER BY tablename, policyname; 