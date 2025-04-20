import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create response ONCE at the top
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read from the incoming request
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie directly on the response object created above
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Set empty cookie directly on the response object created above
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - This will call `set` or `remove` above
  // if the session cookie needs to be updated or deleted.
  await supabase.auth.getSession();

  // Return the response object. It will have updated cookies if refresh occurred.
  return response;
}

// Ensure the middleware is triggered for relevant paths.
// This configuration applies the middleware to all routes except those
// starting with `_next/static`, `_next/image`, or `favicon.ico`.
// It will run for pages and API routes.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (this includes /api routes - adjust if you have specific public api routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path, usually public landing page)
     * - /auth (authentication specific pages like login/signup)
     */
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // More common pattern: match all paths except static/image assets
    // Let AuthProvider handle redirects for specific pages.
     '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 