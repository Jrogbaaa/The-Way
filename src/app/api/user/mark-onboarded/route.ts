import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Track recent requests to implement basic rate limiting
const recentRequests = new Map<string, number>();
const RATE_LIMIT_WINDOW = 30 * 1000; // 30 seconds
const MAX_REQUESTS_PER_WINDOW = 3;

export async function POST(request: NextRequest) {
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
    
    // --- Get user via Authorization header --- 
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('mark-onboarded: Missing or invalid Authorization header');
        return NextResponse.json({ error: 'Unauthorized', message: 'Missing authorization token' }, { status: 401 });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    console.log('mark-onboarded: Getting current user via provided token');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token); // Pass token to getUser
    // --- End token-based user retrieval ---
    
    console.log(`mark-onboarded: getUser result - User: ${user ? user.id : 'null'}, Error: ${userError ? userError.message : 'null'}`);

    if (userError) {
      console.error('mark-onboarded: Get user error details:', userError);
      
      // Check for rate limit errors (might be reported here too)
      if (userError.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit reached',
          message: 'Auth rate limit reached. Please try again later.',
        }, { status: 429 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Get user error',
        message: userError.message,
      }, { status: 401 });
    }
    
    if (!user) {
      console.error('mark-onboarded: No authenticated user found (using token)');
      return NextResponse.json({
        success: false,
        error: 'Auth session missing', // Keep error consistent
        message: 'Invalid or expired token provided.',
      }, { status: 401 });
    }

    const userId = user.id;
    console.log(`mark-onboarded: Updating onboarded status for user ${userId}`);
    
    // Update the user's onboarded status in the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarded: true })
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