/**
 * Social Media Trends Service
 * Handles scraping, processing, and management of social media trend data for talent agencies
 */

import { scrapeUrl, webSearch, crawlWebsite, extractData } from './firecrawl';
import { supabase } from '@/lib/supabase';

// Sources to track for social media trends
const TREND_SOURCES = [
  // Marketing reports and industry resources
  { url: 'https://blog.hubspot.com/marketing/social-media', category: 'marketing' },
  { url: 'https://sproutsocial.com/insights/social-media-trends/', category: 'marketing' },
  { url: 'https://www.socialmediaexaminer.com/category/research/', category: 'research' },
  
  // Platform-specific trends
  { url: 'https://creators.instagram.com/blog', category: 'instagram' },
  { url: 'https://newsroom.tiktok.com/en-us/', category: 'tiktok' },
  { url: 'https://blog.youtube/inside-youtube/tags/creator-updates/', category: 'youtube' },
  
  // Celebrity and influencer news
  { url: 'https://www.adweek.com/category/influencers/', category: 'influencers' },
  { url: 'https://www.hollywoodreporter.com/tags/influencers/', category: 'influencers' },
  
  // Industry statistics
  { url: 'https://www.emarketer.com/topics/topic/social-media', category: 'statistics' },
  { url: 'https://www.statista.com/topics/1164/social-networks/', category: 'statistics' }
];

// Types for trend data
export type TrendSource = {
  url: string;
  category: string;
  lastScraped?: Date;
};

export type TrendItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: string;
  platforms: string[];
  contentTypes: string[];
  discoveredAt: Date;
  relevanceScore: number;
  expiresAt: Date;
};

/**
 * Scrape all configured trend sources and process the results
 */
export async function refreshAllTrendSources() {
  console.log('Starting trend refresh job');
  
  const results = [];
  
  for (const source of TREND_SOURCES) {
    try {
      console.log(`Scraping trend source: ${source.url}`);
      const data = await scrapeUrl(source.url, { 
        onlyMainContent: true,
        includeLinks: true
      });
      
      // Process the scraped content
      const processedTrends = await processTrendContent(data, source);
      results.push(...processedTrends);
      
      // Update the last scraped timestamp
      await updateSourceLastScraped(source.url);
      
      // Avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error scraping trend source ${source.url}:`, error);
    }
  }
  
  // Store the processed trends
  await storeTrendItems(results);
  
  console.log(`Trend refresh complete. Processed ${results.length} trend items.`);
  return results;
}

/**
 * Process scraped content from a trend source
 */
async function processTrendContent(scrapedData: any, source: TrendSource): Promise<TrendItem[]> {
  try {
    // Extract meaningful content using AI
    const extracted = await extractData(
      [source.url], 
      "Extract the latest social media trends, including platform trends, content formats, engagement tactics, and statistics relevant for celebrity social media management.", 
      {
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              platforms: { type: "array", items: { type: "string" } },
              contentTypes: { type: "array", items: { type: "string" } },
              relevanceScore: { type: "number", minimum: 1, maximum: 10 }
            },
            required: ["title", "summary"]
          }
        }
      }
    );
    
    if (!extracted || !extracted.data || !Array.isArray(extracted.data)) {
      console.warn(`No structured data extracted from ${source.url}`);
      return [];
    }
    
    // Transform extracted data into trend items
    return extracted.data.map((item: any, index: number) => ({
      id: `trend_${Date.now()}_${index}`,
      title: item.title,
      summary: item.summary,
      source: new URL(source.url).hostname,
      sourceUrl: source.url,
      category: source.category,
      platforms: item.platforms || [],
      contentTypes: item.contentTypes || [],
      discoveredAt: new Date(),
      relevanceScore: item.relevanceScore || 5,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiration
    }));
  } catch (error) {
    console.error(`Error processing trend content from ${source.url}:`, error);
    return [];
  }
}

/**
 * Store trend items in the database
 */
async function storeTrendItems(trends: TrendItem[]) {
  if (!trends.length) return;
  
  try {
    // Store in Supabase
    const { error } = await supabase
      .from('social_media_trends')
      .upsert(trends, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
      
    if (error) {
      throw error;
    }
    
    console.log(`Successfully stored ${trends.length} trend items`);
  } catch (error) {
    console.error('Error storing trend items:', error);
  }
}

/**
 * Update the last scraped timestamp for a source
 */
async function updateSourceLastScraped(sourceUrl: string) {
  try {
    // Update in Supabase
    const { error } = await supabase
      .from('trend_sources')
      .update({ last_scraped: new Date().toISOString() })
      .eq('url', sourceUrl);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`Error updating last scraped timestamp for ${sourceUrl}:`, error);
  }
}

/**
 * Get current social media trends, filtered by category if provided
 */
export async function getCurrentTrends(category?: string, limit: number = 20) {
  try {
    let query = supabase
      .from('social_media_trends')
      .select('*')
      .order('relevanceScore', { ascending: false })
      .limit(limit);
      
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching current trends:', error);
    return [];
  }
}

/**
 * Initialize the trend system - create necessary tables if they don't exist
 */
export async function initializeTrendSystem() {
  try {
    // Ensure database tables exist
    // (In a real implementation, you would use migrations for this)
    
    // Store trend sources
    await supabase
      .from('trend_sources')
      .upsert(
        TREND_SOURCES.map(source => ({
          url: source.url,
          category: source.category,
          last_scraped: null
        })),
        { onConflict: 'url' }
      );
    
    console.log('Trend system initialized successfully');
  } catch (error) {
    console.error('Error initializing trend system:', error);
  }
}

/**
 * Get trends specific to a certain platform
 */
export async function getPlatformTrends(platform: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('social_media_trends')
      .select('*')
      .contains('platforms', [platform])
      .order('relevanceScore', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching trends for platform ${platform}:`, error);
    return [];
  }
}

/**
 * Get content type trends (Reels, Stories, TikToks, etc.)
 */
export async function getContentTypeTrends(contentType: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('social_media_trends')
      .select('*')
      .contains('contentTypes', [contentType])
      .order('relevanceScore', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching trends for content type ${contentType}:`, error);
    return [];
  }
}

/**
 * Search for trends based on a keyword
 */
export async function searchTrends(keyword?: string | null, limit: number = 20) {
  try {
    if (!keyword) {
      // Return empty array or default trends if no keyword provided
      return [];
    }
    
    const { data, error } = await supabase
      .from('social_media_trends')
      .select('*')
      .or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
      .order('relevanceScore', { ascending: false })
      .limit(limit);
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error searching trends for keyword ${keyword}:`, error);
    return [];
  }
} 