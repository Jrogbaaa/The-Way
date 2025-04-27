import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/lib/config';

/**
 * Auth callback handler for OAuth providers
 * Used as a redirect URL after authentication with providers like Google
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Ensure we're using the correct origin (localhost in development, production in production)
  const hostname = requestUrl.hostname;
  const isLocalDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Force the origin to be the same as the request in development
  const origin = isLocalDevelopment
    ? `${requestUrl.protocol}//${hostname}:${requestUrl.port}`
    : requestUrl.origin;
  
  console.log('Auth Callback: Current origin is', origin);
  console.log('Auth Callback: Is local development?', isLocalDevelopment);
  console.log('Auth Callback: Full request URL is', request.url);
  console.log('Auth Callback: Dashboard route is', ROUTES.dashboard);
  
  // If there's no code, redirect to login page with error
  if (!code) {
    console.warn('Auth Callback: No code found in request URL.');
    return NextResponse.redirect(new URL(`${ROUTES.login}?error=no_code`, origin));
  }

  try {
    // Await the cookie store in Route Handlers
    const cookieStore = await cookies();
    
    // Create a response object that we'll return at the end
    const response = NextResponse.redirect(new URL(ROUTES.dashboard, origin));
    
    // Use createServerClient from @supabase/ssr
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // Now we can call .get() on the resolved cookieStore
            const cookie = cookieStore.get(name)?.value;
            console.log(`Auth Callback: Getting cookie ${name}:`, cookie ? 'exists' : 'not found');
            return cookie;
          },
          set(name: string, value: string, options: CookieOptions) {
            // `set` is available on the resolved store
            console.log(`Auth Callback: Setting cookie ${name} with options:`, JSON.stringify(options));
            
            // Ensure cookies persist properly
            const cookieOptions = {
              ...options,
              // Max age 30 days
              maxAge: 30 * 24 * 60 * 60,
              // Don't restrict by domain in development or vercel/netlify
              domain: isLocalDevelopment || hostname.includes('.vercel.app') || hostname.includes('.netlify.app') 
                ? undefined 
                : options.domain,
              // Path should always be root 
              path: '/',
              secure: process.env.NODE_ENV === 'production'
            };
            
            // Set the cookie both in the cookie store and in the response
            cookieStore.set({ name, value, ...cookieOptions });
            response.cookies.set({ name, value, ...cookieOptions });
          },
          remove(name: string, options: CookieOptions) {
            // `set` is used for removal as well
            console.log(`Auth Callback: Removing cookie ${name}`);
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            response.cookies.set({ name, value: '', ...options, maxAge: 0 });
          },
        },
      }
    );

    // CRITICAL: Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Auth Callback: Exchange code result:', data ? 'Session data received' : 'No session data', error ? `Error: ${error.message}` : 'No error');
    
    // If there's an error, redirect to the login page with the error
    if (error) {
      console.error('Auth Callback: Error exchanging code for session:', error.message);
      // Return the redirect with error information in the query params
      return NextResponse.redirect(new URL(`${ROUTES.login}?error=${error.message}`, origin));
    }
    
    if (!data.session) {
      console.error('Auth Callback: No session returned after code exchange');
      return NextResponse.redirect(new URL(`${ROUTES.login}?error=no_session`, origin));
    }
    
    console.log('Auth Callback: Successfully authenticated, redirecting to dashboard');
    
    // Make sure to manually set the essential auth cookies in the response
    const sessionCookieName = 'sb-session';
    const sessionCookie = cookieStore.get(sessionCookieName);
    if (sessionCookie) {
      response.cookies.set({
        name: sessionCookieName,
        value: sessionCookie.value,
        domain: isLocalDevelopment || hostname.includes('.vercel.app') || hostname.includes('.netlify.app') 
          ? undefined 
          : hostname,
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // Also create a profile for the user using our ensure-profile endpoint
    try {
      const profileResponse = await fetch(new URL('/api/user/ensure-profile', origin).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      if (profileResponse.ok) {
        console.log('Auth Callback: Successfully created/updated user profile');
      } else {
        console.warn('Auth Callback: Failed to create/update user profile, but continuing');
      }
    } catch (profileError) {
      console.error('Auth Callback: Error creating/updating user profile:', profileError);
      // Continue anyway, we don't want to block the login flow
    }
    
    // Redirect to the dashboard
    return response;
  } catch (catchError) {
    console.error('Auth Callback: Unexpected error:', catchError);
    return NextResponse.redirect(new URL(`${ROUTES.login}?error=unexpected`, origin));
  }
} 