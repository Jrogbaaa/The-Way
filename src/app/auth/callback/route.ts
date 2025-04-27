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
              // Don't restrict by domain in development
              domain: isLocalDevelopment ? undefined : options.domain,
              // Path should always be root 
              path: '/'
            };
            
            cookieStore.set({ name, value, ...cookieOptions });
          },
          remove(name: string, options: CookieOptions) {
            // `set` is used for removal as well
            console.log(`Auth Callback: Removing cookie ${name}`);
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // CRITICAL: Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log('Auth Callback: Exchange code result:', data ? 'Session data received' : 'No session data', error ? `Error: ${error.message}` : 'No error');

    if (error) {
      console.error('Auth Callback Error exchanging code:', error.message);
      // Redirect to login with an error query param
      return NextResponse.redirect(new URL(`${ROUTES.login}?error=${encodeURIComponent(error.message)}`, origin));
    }

    // Test if session was actually created
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Auth Callback: Session check after exchange:', sessionData.session ? `Valid session exists for user ${sessionData.session.user.id}` : 'No session found');

    // Log all cookies to help debugging
    const allCookies = cookieStore.getAll();
    console.log('Auth Callback: Cookies set:', allCookies.map(c => `${c.name}: ${c.value ? 'set' : 'empty'}`));

    // IMPORTANT: Force the redirect to stay on the same origin (localhost or production) 
    // to prevent cross-origin issues with session cookies
    const redirectUrl = new URL(ROUTES.dashboard, origin);
    console.log(`Auth Callback: Redirecting to ${redirectUrl.toString()}`);
    
    // Add cache control headers to prevent caching of the redirect
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('Cache-Control', 'no-store, max-age=0, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err) {
    // Log and handle any unexpected errors
    const error = err as Error;
    console.error('Auth Callback: Unexpected error:', error.message);
    return NextResponse.redirect(new URL(`${ROUTES.login}?error=${encodeURIComponent('Authentication failed. Please try again.')}`, origin));
  }
} 