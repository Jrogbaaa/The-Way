import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object to pass through
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // TEMPORARILY SIMPLIFIED: 
  // Just pass the request through. The API route's createServerClient 
  // should handle reading the cookies.
  console.log('Middleware: Running simplified version (no getSession call).');

  // We still need to create the client with cookie handlers so that 
  // if other server components *rely* on middleware setting cookies, 
  // it *could* potentially happen (though getSession is the usual trigger).
  // This is mainly to preserve the cookie handling mechanism.
  try {
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
              return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
              request.cookies.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
              request.cookies.set({ name, value: '', ...options });
              response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
  } catch (error) {
      console.error('Middleware simplified error during client creation:', error);
  }

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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     * Feel free to modify this pattern to exclude more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 