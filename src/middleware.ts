import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Log the request path for debugging
  console.log(`Middleware: Processing ${request.method} request for ${request.nextUrl.pathname}`);
  
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
          const cookie = request.cookies.get(name);
          console.log(`Middleware: Cookie '${name}' ${cookie ? 'found' : 'not found'}`);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie directly on the response object created above
          response.cookies.set({ name, value, ...options });
          console.log(`Middleware: Set cookie '${name}'`);
        },
        remove(name: string, options: CookieOptions) {
          // Set empty cookie directly on the response object created above
          response.cookies.set({ name, value: '', ...options });
          console.log(`Middleware: Removed cookie '${name}'`);
        },
      },
    }
  );

  try {
    // Refresh session if expired - This will call `set` or `remove` above
    // if the session cookie needs to be updated or deleted.
    console.log(`Middleware: Refreshing auth session for ${request.nextUrl.pathname}`);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log(`Middleware: Valid session found for user ${session.user.id}`);
    } else {
      console.log(`Middleware: No valid session found`);
    }
  } catch (error) {
    console.error(`Middleware: Error refreshing session:`, error);
  }

  // Return the response object. It will have updated cookies if refresh occurred.
  return response;
}

// Ensure the middleware is triggered for relevant paths.
// This configuration applies the middleware to all routes except those
// starting with `_next/static`, `_next/image`, or `favicon.ico`.
// It will run for pages and API routes.
export const config = {
  matcher: [
    // Make api routes the first pattern to ensure they get prioritized
    '/api/:path*',
    
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 