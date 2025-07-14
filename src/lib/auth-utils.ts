import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

/**
 * Utility functions for authentication in API routes
 */

/**
 * Get user session from API route with improved reliability
 * This works in both development and production environments
 */
export async function getSessionFromRequest(request?: NextRequest): Promise<{ user: any; userId: string | null }> {
  try {
    // Method 1: Try using NextAuth's auth() function (works in App Router)
    const session = await auth();
    if (session?.user?.id) {
      console.log('Session detected via auth():', session.user.id);
      return {
        user: session.user,
        userId: session.user.id
      };
    }

    // Method 2: Try using cookies directly if auth() doesn't work
    if (request) {
      try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get('next-auth.session-token') || 
                           cookieStore.get('__Secure-next-auth.session-token') ||
                           cookieStore.get('authjs.session-token');
        
        if (sessionToken) {
          console.log('Session token found in cookies, attempting to validate...');
          // For now, we'll fall back to the original method
        }
      } catch (cookieError) {
        console.warn('Error accessing cookies:', cookieError);
      }
    }

    // Method 3: Fallback to checking authorization header
    if (request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        console.log('Bearer token found in Authorization header');
        // This would require additional implementation to validate the token
      }
    }

    console.log('No session found via any method');
    return { user: null, userId: null };
    
  } catch (error) {
    console.error('Error getting session from request:', error);
    return { user: null, userId: null };
  }
}

/**
 * Alternative session detection by fetching the session endpoint
 * This is more reliable for API routes in production
 */
export async function getSessionViaEndpoint(request: NextRequest): Promise<{ user: any; userId: string | null }> {
  try {
    const cookieHeader = request.headers.get('cookie');
    
    if (!cookieHeader) {
      console.log('No cookies found in request header');
      return { user: null, userId: null };
    }

    // Get the base URL for the session endpoint
    const baseUrl = process.env.NEXTAUTH_URL || 
                   process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get('origin') || 
                   'http://localhost:3000';

    console.log('Fetching session from:', `${baseUrl}/api/auth/session`);

    const response = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { 
        cookie: cookieHeader,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const session = await response.json();
      const userId = session?.user?.id || session?.user?.sub;
      
      if (userId) {
        console.log('Session successfully fetched via endpoint:', userId);
        return {
          user: session.user,
          userId: userId
        };
      } else {
        console.log('Session endpoint returned no user ID');
      }
    } else {
      console.warn('Session endpoint returned error:', response.status);
    }

    return { user: null, userId: null };
    
  } catch (error) {
    console.error('Error fetching session via endpoint:', error);
    return { user: null, userId: null };
  }
}

/**
 * Comprehensive session detection that tries multiple methods
 * Use this in API routes for the most reliable session detection
 */
export async function detectUserSession(request: NextRequest): Promise<{ user: any; userId: string | null; method: string }> {
  console.log('=== Starting comprehensive session detection ===');
  
  // Method 1: Try NextAuth's auth() function
  const authResult = await getSessionFromRequest(request);
  if (authResult.userId) {
    return { ...authResult, method: 'auth()' };
  }

  // Method 2: Try fetching session endpoint
  const endpointResult = await getSessionViaEndpoint(request);
  if (endpointResult.userId) {
    return { ...endpointResult, method: 'endpoint' };
  }

  console.log('=== No session detected via any method ===');
  return { user: null, userId: null, method: 'none' };
} 