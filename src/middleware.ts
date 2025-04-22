import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // It's generally safe to remove this explicit forwarding.
  // The createServerClient handles reading from request cookies.
  // const requestCookies = request.cookies.getAll();
  // for (const cookie of requestCookies) {
  //   response.cookies.set(cookie.name, cookie.value);
  // }

  try {
    // Create a Supabase client configured to use request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
            return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
            // The library will set cookies on the response object for us
            // Ensure request object is also updated for subsequent server actions/reads
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
        },
        remove(name: string, options: CookieOptions) {
            // Ensure request object is also updated
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
        },
      },
    }
  );

    // Refresh the session if needed. This will automatically update cookies
    // on the response object via the `set` and `remove` handlers passed to createServerClient.
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Middleware session error:", error.message);
      // Don't block request flow on session error, just log it.
    }
    
    if (session) {
       console.log("Middleware: Valid session found and potentially refreshed.");
    } else {
       console.log("Middleware: No active session found.");
    }

    // Remove the explicit cookie re-setting logic.
    // The createServerClient + getSession pattern handles cookie updates.
    // if (session) {
    //   const authCookies = response.cookies.getAll().filter(cookie => 
    //     cookie.name.includes('supabase') || 
    //     cookie.name.includes('sb-') ||
    //     cookie.name.startsWith('access-token') || 
    //     cookie.name.startsWith('refresh-token')
    //   );
    //   console.log('Middleware: Found auth cookies:', authCookies.map(c => c.name).join(', '));
    //   for (const cookie of authCookies) {
    //     const cookieValue = response.cookies.get(cookie.name)?.value;
    //     if (cookieValue) {
    //       response.cookies.set({
    //         name: cookie.name,
    //         value: cookieValue,
    //         path: '/',
    //         maxAge: 60 * 60 * 24 * 7, // 1 week
    //         sameSite: 'lax',
    //         secure: process.env.NODE_ENV === 'production',
    //       });
    //     }
    //   }
    // }

    // Return the response object, potentially modified by supabase.auth.getSession()
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return the original response even if middleware has an error
    return response; 
  }
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