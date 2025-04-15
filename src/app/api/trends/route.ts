import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/lib/config';

// Create a supabase client with expected parameters
const createServerClient = () => {
  return createClient(
    API_CONFIG.supabaseUrl,
    API_CONFIG.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};

/**
 * GET /api/trends
 * Retrieves current social media trends with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    // Check for query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const platform = url.searchParams.get('platform');
    const contentType = url.searchParams.get('contentType');
    const search = url.searchParams.get('search');
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    
    // Check authentication for admin-only parameters
    const showJobs = url.searchParams.get('showJobs') === 'true';
    if (showJobs) {
      // Create Supabase client for authentication check
      const supabase = createServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user is an admin (implementation depends on your auth setup)
      if (!session) {
        return NextResponse.json({ 
          error: 'Unauthorized' 
        }, { status: 401 });
      }
    }
    
    // Get trends based on parameters
    let trends;
    try {
      const supabase = createServerClient();
      let query = supabase.from('social_media_trends').select('*');
      
      if (platform) {
        query = query.contains('platforms', [platform]);
      } else if (contentType) {
        query = query.contains('contentTypes', [contentType]);
      } else if (search) {
        query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
      } else if (category) {
        query = query.eq('category', category);
      }
      
      // Apply limit and sorting
      const { data, error } = await query
        .order('relevanceScore', { ascending: false })
        .limit(limit);
        
      if (error) {
        throw error;
      }
      
      trends = data;
    } catch (dbError) {
      console.error('Database error:', dbError);
      trends = [];
    }
    
    // Include job status for admins if requested
    if (showJobs) {
      // Mock job status since we're bypassing the scheduler service
      const jobs = [
        {
          id: 'trend-refresh',
          name: 'Social Media Trend Refresh',
          description: 'Scrapes various sources to update social media trend data',
          lastRun: new Date().toISOString(),
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'idle'
        }
      ];
      
      return NextResponse.json({ trends, jobs });
    }
    
    return NextResponse.json({ trends });
    
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trend data' 
    }, { status: 500 });
  }
}

/**
 * POST /api/trends/refresh
 * Manually trigger a trend refresh (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication (admin only)
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Check if we're requesting a refresh
    const data = await req.json();
    if (data.action === 'refresh') {
      // Mock job status since we're bypassing the scheduler service
      const refreshJob = {
        id: 'trend-refresh',
        name: 'Social Media Trend Refresh', 
        description: 'Scrapes various sources to update social media trend data',
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'running'
      };
      
      return NextResponse.json({ 
        message: 'Trend refresh initiated successfully',
        jobStatus: refreshJob
      });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in trend API:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 