import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds
const MAX_REQUESTS_PER_WINDOW = 3;

export async function POST() {
  console.log('API Route /api/user/mark-onboarded: POST request received');
  
  try {
    // Basic rate limiting (would use proper IP or user ID in production)
    const requesterId = 'anonymous'; // In production, use IP or user ID
    const now = Date.now();

    // Clean up old entries
    for (const [id, timestamp] of recentRequests.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW) {
        recentRequests.delete(id);
      }
    }
    
    // Check rate limit
    const requestCount = [...recentRequests.values()].filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    ).length;
    
    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      console.warn(`mark-onboarded: Rate limit exceeded for ${requesterId}`);
      return NextResponse.json({
        success: false,
        error: 'Too many requests',
        message: 'Please try again in a few seconds',
      }, { status: 429 });
    }
    
    // Record this request
    recentRequests.set(`${requesterId}-${now}`, now);
    
    // Get supabase client with custom context for better logging
    const supabase = await createClient('MarkOnboardedAPI');
    
    // Get current session data first
    console.log('mark-onboarded: Getting current session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('mark-onboarded: Session error:', sessionError.message);
      
      // Check for rate limit errors
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
      console.error('mark-onboarded: No active session found');
      return NextResponse.json({
        success: false,
        error: 'Auth session missing',
        message: 'No active session found. Please log in again.',
      }, { status: 401 });
  }

    const userId = sessionData.session.user.id;
    console.log(`mark-onboarded: Updating onboarded status for user ${userId}`);
    
    // Only refresh the session if it's close to expiry (5 minutes)
    const sessionExpiry = new Date(sessionData.session.expires_at || 0).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = sessionExpiry - currentTime;
    const isAboutToExpire = timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
    
    if (isAboutToExpire) {
      console.log('mark-onboarded: Session expiring soon, attempting refresh');
      try {
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('mark-onboarded: Session refresh failed:', refreshError.message);
          // Continue with the current session - don't fail the whole request
        } else {
          console.log('mark-onboarded: Session refreshed successfully');
        }
      } catch (refreshErr) {
        console.error('mark-onboarded: Error during refresh:', refreshErr);
        // Continue with the current session
      }
    }
    
    // Update the user's onboarded status in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarded: true, onboarded_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('mark-onboarded: Database update error:', updateError.message);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: updateError.message,
      }, { status: 500 });
    }

    console.log(`mark-onboarded: Successfully marked user ${userId} as onboarded`);
    return NextResponse.json({
      success: true,
      message: 'User marked as onboarded',
    });

  } catch (error) {
    console.error('mark-onboarded: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
} 