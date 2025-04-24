import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object to modify cookies on
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Create a Supabase client configured to use cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
              return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
              // If the cookie is set, update the request and response cookies
              request.cookies.set({ name, value, ...options });
              response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
              // If the cookie is removed, update the request and response cookies
              request.cookies.set({ name, value: '', ...options });
              response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
   
    // Refresh session if expired - required for Server Components
    // This will automatically handle reading session from cookies and refreshing tokens
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Middleware: Error getting session:', error.message);
    } else if (session) {
        console.log('Middleware: Session found and refreshed.');
    } else {
        console.log('Middleware: No active session found.');
    }
    
  } catch (error) {
      console.error('Middleware error:', error);
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