import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

export async function POST() {
  console.log('API Route /api/user/onboarded: POST request received');
  
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
      console.warn(`onboarded: Rate limit exceeded for ${requesterId}`);
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
    const supabase = await createClient('OnboardedAPI');
    
    console.log('onboarded: Getting current session');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('onboarded: Session error:', sessionError.message);
      
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
      console.warn('onboarded: No active session found');
      return NextResponse.json({
        success: false,
        error: 'Auth session missing',
        message: 'You must be logged in to mark yourself as onboarded',
      }, { status: 401 });
    }
    
    const userId = sessionData.session.user.id;
    console.log(`onboarded: Marking user ${userId} as onboarded`);
    
    // Skip session refresh to avoid potential rate limit issues
    // Since this is a one-time operation, refreshing isn't critical here
    
    // Update the profile to mark as onboarded
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', userId);
    
    if (updateError) {
      console.error('onboarded: Error updating profile:', updateError.message);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: updateError.message,
      }, { status: 500 });
    }
    
    console.log(`onboarded: Successfully marked user ${userId} as onboarded`);
    return NextResponse.json({
      success: true,
      message: 'User marked as onboarded successfully',
    });
    
  } catch (error) {
    console.error('onboarded: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
} 