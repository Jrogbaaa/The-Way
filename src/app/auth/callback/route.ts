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
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? ROUTES.dashboard; // Default redirect

  // Use the URL from the request to ensure we're using the same origin/port
  const origin = requestUrl.origin;
  
  // Debug output to help diagnose issues
  console.log('AUTH CALLBACK DEBUG:', {
    url: request.url,
    hasCode: !!code,
    origin,
    cookies: request.cookies.getAll().map(c => c.name),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...',
    }
  });
  
  console.log(`Auth Callback: Received code. Origin: ${origin}. Will redirect to: ${next}`);

  if (code) {
    // Await cookies() here to get the resolved store
    const resolvedCookieStore = await cookies();

    // Define cookie options consistent with your middleware/client setup
    const cookieOptions: Omit<CookieOptions, 'name'> = {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // Max age of 30 days, matching client configuration
      maxAge: 30 * 24 * 60 * 60,
    };

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions,
        cookies: {
          // Handlers use the resolvedCookieStore directly
          get(name: string) {
            return resolvedCookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            console.log(`Auth Callback: [Supabase Client] Setting cookie ${name}`);
            try {
              resolvedCookieStore.set({ name, value, ...options });
            } catch (error) {
              // In case setting fails in Route Handler context
              console.error(`Auth Callback: Failed to set cookie ${name} via resolvedCookieStore`, error);
            }
          },
          remove(name: string, options: CookieOptions) {
            console.log(`Auth Callback: [Supabase Client] Removing cookie ${name}`);
            try {
              resolvedCookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error(`Auth Callback: Failed to remove cookie ${name} via resolvedCookieStore`, error);
            }
          },
        },
      }
    );

    try {
      console.log('Auth Callback: Exchanging code for session...');
      // exchangeCodeForSession should automatically handle setting the necessary cookies
      // via the 'set' handler provided above.
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        console.log('Auth Callback: Code exchange successful. Redirecting...');
        
        // Log all cookies after exchange
        console.log('Auth Callback: Cookies after exchange:', 
          resolvedCookieStore.getAll().map(c => c.name));
          
        // Redirect on success using the same origin from the request
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.error('Auth Callback: Error exchanging code:', error.message);
        // Redirect to login with error
        const redirectUrl = new URL(ROUTES.login, origin);
        redirectUrl.searchParams.set('error', 'auth_code_exchange_failed');
        redirectUrl.searchParams.set('error_description', error.message || 'Could not exchange code for session.');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (e) {
      console.error('Auth Callback: Exception during code exchange:', e);
      const redirectUrl = new URL(ROUTES.login, origin);
      redirectUrl.searchParams.set('error', 'auth_callback_exception');
      redirectUrl.searchParams.set('error_description', 'An unexpected error occurred during authentication.');
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // Redirect to login if no code is present
    console.error('Auth Callback: No code found in search parameters.');
    const redirectUrl = new URL(ROUTES.login, origin);
    redirectUrl.searchParams.set('error', 'auth_callback_missing_code');
    redirectUrl.searchParams.set('error_description', 'Authorization code was missing from the callback.');
    return NextResponse.redirect(redirectUrl);
  }
} 