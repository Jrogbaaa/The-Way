import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// In-memory cache for simple rate limiting
const sessionValidationAttempts = new Map<string, { count: number, lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 5;

export async function GET() {
  console.log('API Route /api/auth/validate-session: GET request received');
  
  try {
    // Use a unique identifier for debug logs
    const supabase = await createClient('ValidateSessionAPI');
    
    // IP-based rate limiting
    const ipAddress = 'unknown'; // In a real implementation, get the IP from headers
    
    // Check rate limiting
    const now = Date.now();
    const attempts = sessionValidationAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
    
    // Reset count if outside window
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      attempts.count = 0;
    }
    
    // Increment count and update last attempt
    attempts.count += 1;
    attempts.lastAttempt = now;
    sessionValidationAttempts.set(ipAddress, attempts);
    
    // Check if rate limited
    if (attempts.count > MAX_ATTEMPTS_PER_WINDOW) {
      console.warn(`ValidateSessionAPI: Rate limit exceeded for IP ${ipAddress}`);
      return NextResponse.json({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - attempts.lastAttempt)) / 1000)
      }, { status: 429 });
    }

    console.log('ValidateSessionAPI: Getting session');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('ValidateSessionAPI: Error getting session:', error.message);
      
      // Special handling for rate limit errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json({ 
          error: 'Supabase rate limit reached', 
          message: 'Too many authentication requests. Please try again later.',
          isRateLimited: true
        }, { status: 429 });
      }
      
      return NextResponse.json({
        error: 'Session error',
        message: error.message,
        valid: false
      }, { status: 401 });
    }

    if (!data.session) {
      console.log('ValidateSessionAPI: No session found');
      return NextResponse.json({
        valid: false,
        message: 'No active session'
      });
    }

    const sessionExpiry = new Date(data.session.expires_at || 0).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = sessionExpiry - currentTime;
    const isAboutToExpire = timeUntilExpiry < 5 * 60 * 1000; // 5 minutes
    
    console.log(`ValidateSessionAPI: Session found for user ${data.session.user.id}, expires in ${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`);
    
    // If session is about to expire, try to refresh it
    if (isAboutToExpire) {
      console.log('ValidateSessionAPI: Session expiring soon, refreshing');
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('ValidateSessionAPI: Error refreshing session:', refreshError.message);
          // Return the original session if we can't refresh
          return NextResponse.json({
            valid: true,
            refreshed: false,
            message: 'Session valid but refresh failed',
            expiresAt: data.session.expires_at,
            user: data.session.user
          });
        }
        
        if (refreshData.session) {
          console.log(`ValidateSessionAPI: Session refreshed, new expiry: ${refreshData.session.expires_at}`);
          return NextResponse.json({
            valid: true,
            refreshed: true,
            message: 'Session refreshed',
            expiresAt: refreshData.session.expires_at,
            user: refreshData.session.user
          });
        }
      } catch (refreshErr) {
        console.error('ValidateSessionAPI: Exception during refresh:', refreshErr);
        // Return the original session if refresh throws
        return NextResponse.json({
          valid: true,
          refreshed: false,
          message: 'Session valid but refresh failed',
          expiresAt: data.session.expires_at,
          user: data.session.user
        });
      }
    }
    
    // Return the session information
    return NextResponse.json({
      valid: true,
      refreshed: false,
      message: 'Session valid',
      expiresAt: data.session.expires_at,
      user: data.session.user
    });
    
  } catch (error) {
    console.error('ValidateSessionAPI: Unexpected error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      valid: false
    }, { status: 500 });
  }
} 