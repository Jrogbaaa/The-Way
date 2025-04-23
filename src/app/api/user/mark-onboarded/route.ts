import { NextResponse, NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
    
    // Create standard client ONLY to get user ID from token
    const supabaseUserClient = await createClient('MarkOnboardedUserCheck');
    
    // --- Get user via Authorization header --- 
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('mark-onboarded: Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Unauthorized', message: 'Missing authorization token' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    
    console.log('mark-onboarded: Getting current user via provided token');
    // Use the STANDARD client to validate the token and get user
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser(token); 
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
    console.log(`mark-onboarded: Updating onboarded status for user ${userId} using ADMIN client`);
    
    // Check if service role key is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('mark-onboarded: SUPABASE_SERVICE_ROLE_KEY environment variable is not set!');
      return NextResponse.json({ 
        success: false, 
        error: 'Configuration error', 
        message: 'Service role key is not configured'
      }, { status: 500 });
    }
    
    console.log('mark-onboarded: Service role key is set, creating admin client');
    
    // --- Use ADMIN client for the update --- 
    const supabaseAdmin = createAdminClient(); // Create the admin client instance
    
    // Debugging: First check if profile exists
    console.log(`mark-onboarded: Checking if profile exists for user ${userId}`);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('mark-onboarded: Failed to retrieve profile:', JSON.stringify(profileError));
      return NextResponse.json({ 
        success: false, 
        error: 'Database query error', 
        message: profileError.message,
        details: JSON.stringify(profileError)
      }, { status: 500 });
    }
    
    if (!profile) {
      console.error(`mark-onboarded: No profile found for user ${userId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found', 
        message: 'User profile does not exist'
      }, { status: 404 });
    }
    
    console.log(`mark-onboarded: Found profile for user ${userId}:`, JSON.stringify(profile));
    
    // Now attempt the update
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', userId);
    // --- End admin client update --- 

    if (updateError) {
      console.error('mark-onboarded: Database update error (using ADMIN client):', JSON.stringify(updateError));
      return NextResponse.json({ 
        success: false, 
        error: 'Database error', 
        message: updateError.message,
        details: JSON.stringify(updateError)
      }, { status: 500 });
    }

    // Verify the update was successful
    const { data: verifyProfile, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('onboarded')
      .eq('id', userId)
      .single();
      
    if (verifyError) {
      console.error('mark-onboarded: Verification query error:', JSON.stringify(verifyError));
      return NextResponse.json({ 
        success: false, 
        error: 'Verification error', 
        message: 'Update appeared successful but verification failed',
        details: JSON.stringify(verifyError)
      }, { status: 500 });
    }
    
    console.log(`mark-onboarded: Verification result:`, JSON.stringify(verifyProfile));
    
    if (!verifyProfile || verifyProfile.onboarded !== true) {
      console.error('mark-onboarded: Update did not take effect!');
      return NextResponse.json({ 
        success: false, 
        error: 'Update ineffective', 
        message: 'Database update did not change the onboarded status',
        currentValue: verifyProfile?.onboarded
      }, { status: 500 });
    }

    console.log(`mark-onboarded: Successfully marked user ${userId} as onboarded (using ADMIN client)`);
    return NextResponse.json({ success: true, message: 'User marked as onboarded' });

  } catch (error) {
    console.error('mark-onboarded: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 