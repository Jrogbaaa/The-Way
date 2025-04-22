import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function updateSession(request: NextRequest) {
  try {
    // Create a response early so we can use it for cookies
    const response = NextResponse.next();
    
    // Create a Supabase client using server-side auth
    const supabase = await createClient('AuthMiddleware');
    
    // This is critical: we must use getUser() not getSession() in middleware
    // getUser() makes an API call to validate the token
    // getSession() only reads from cookies which could be spoofed
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Middleware: Auth error:', error.message);
      return response;
    }

    // If we have a valid session, sync cookies back to the client
    if (user) {
      // Get the current session which will trigger a refresh if needed
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log(`Middleware: Valid session for user ${user.id}, syncing cookies`);
        
        // Get all auth cookies from the request
        const authCookies = request.cookies.getAll().filter(cookie => 
          cookie.name.includes('supabase') || 
          cookie.name.includes('sb-') ||
          cookie.name.startsWith('access-token') || 
          cookie.name.startsWith('refresh-token')
        );
        
        // Log found cookies for debugging
        console.log('Middleware: Found auth cookies:', authCookies.map(c => c.name).join(', '));
        
        // Copy cookies from the client request to the middleware response
        for (const cookie of authCookies) {
          response.cookies.set(cookie.name, cookie.value, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
          });
        }
      }
    } else {
      console.log('Middleware: No authenticated user found');
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
} 