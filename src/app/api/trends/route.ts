import { NextRequest, NextResponse } from 'next/server';
import { 
  getCurrentTrends, 
  getPlatformTrends, 
  getContentTypeTrends,
  searchTrends
} from '@/lib/services/trends';
import { 
  runManualTrendRefresh, 
  getJobsStatus 
} from '@/lib/services/scheduler';
import { createClient } from '@/lib/supabase/server';

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
      const supabase = createClient();
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
    if (platform) {
      trends = await getPlatformTrends(platform, limit);
    } else if (contentType) {
      trends = await getContentTypeTrends(contentType, limit);
    } else if (search) {
      trends = await searchTrends(search as string, limit);
    } else {
      trends = await getCurrentTrends(category, limit);
    }
    
    // Include job status for admins if requested
    if (showJobs) {
      const jobs = getJobsStatus();
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
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    // Check if we're requesting a refresh
    const data = await req.json();
    if (data.action === 'refresh') {
      // Trigger manual refresh
      await runManualTrendRefresh();
      
      return NextResponse.json({ 
        message: 'Trend refresh initiated successfully',
        jobStatus: getJobsStatus().find(job => job.id === 'trend-refresh')
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