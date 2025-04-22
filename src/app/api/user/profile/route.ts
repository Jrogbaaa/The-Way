import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

export async function GET() {
  console.log('API Route /api/user/profile: GET request received');
  
  try {
    // Basic rate limiting (in production, use proper client IP or better identifier)
    const requesterId = 'anonymous'; // In production, use IP or user ID
    const now = Date.now();
    
    // Clean up old entries (to prevent memory leaks)
    for (const [id, data] of recentRequests.entries()) {
      if (now - data.lastRequest > RATE_LIMIT_WINDOW) {
        recentRequests.delete(id);
      }
    }
    
    // Get or create request tracking data
    let requestData = recentRequests.get(requesterId);
    if (!requestData) {
      requestData = { count: 0, lastRequest: now };
      recentRequests.set(requesterId, requestData);
    }
    
    // Reset counter if outside window
    if (now - requestData.lastRequest > RATE_LIMIT_WINDOW) {
      requestData.count = 0;
      requestData.lastRequest = now;
    }
    
    // Increment and check
    requestData.count += 1;
    requestData.lastRequest = now;
    
    if (requestData.count > MAX_REQUESTS_PER_WINDOW) {
      console.warn(`profile: Rate limit exceeded for ${requesterId}`);
      return NextResponse.json({
        success: false,
        error: 'Too many requests',
        message: 'Please try again later',
      }, { 
        status: 429, 
        headers: { 'Retry-After': '60' }
      });
    }
    
    // Create Supabase client with context
    const supabase = await createClient('ProfileFetchAPI');
    
    console.log('profile: Getting current session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('profile: Session error:', sessionError.message);
      
      if (sessionError.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit reached',
          message: 'Auth rate limit reached. Please try again later.',
        }, { status: 429 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Session error',
        message: sessionError.message,
      }, { status: 401 });
    }
    
    if (!sessionData.session) {
      console.warn('profile: No active session found');
      return NextResponse.json({
        success: false,
        error: 'Auth session missing',
        message: 'You must be logged in to access profile data',
      }, { status: 401 });
    }
    
    const userId = sessionData.session.user.id;
    console.log(`profile: Fetching profile for user ${userId}`);
    
    // Check if session is about to expire (5 minutes) and refresh if needed
    // But don't fail the request if refresh fails
    const sessionExpiry = new Date(sessionData.session.expires_at || 0).getTime();
    const timeUntilExpiry = sessionExpiry - now;
    const isAboutToExpire = timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
    
    if (isAboutToExpire) {
      console.log('profile: Session expiring soon, attempting refresh');
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('profile: Session refresh failed:', refreshError.message);
          // Continue with the current session
        } else {
          console.log('profile: Session refreshed successfully');
        }
      } catch (refreshErr) {
        console.error('profile: Error during refresh:', refreshErr);
        // Continue with the current session
      }
    }
    
    // Fetch profile data from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('profile: Error fetching profile:', profileError.message);
      
      // Check if this is a "not found" error
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: 'Profile not found',
          message: 'User profile not found',
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: profileError.message,
      }, { status: 500 });
    }
    
    if (!profile) {
      console.warn(`profile: No profile found for user ${userId}`);
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        message: 'User profile not found',
      }, { status: 404 });
    }
    
    console.log('profile: Successfully fetched user profile');
    return NextResponse.json({
      success: true,
      data: profile,
    });
    
  } catch (error) {
    console.error('profile: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
} 