import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Standard Supabase SSR middleware function.
 * Reads the session from cookies in the request, refreshes it if necessary,
 * and writes updated cookies to the response.
 *
 * @param request The incoming Next.js request object.
 * @returns A Next.js response object, potentially with updated auth cookies.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Debug info
  const path = request.nextUrl.pathname;
  console.log(`Middleware updateSession: Processing ${path}`);
  console.log('Middleware updateSession: Incoming cookies:', request.cookies.getAll().map(c => c.name));
  
  // Create a NextResponse object early to modify cookies on it
  let response = NextResponse.next({
    request: {
      headers: request.headers, // Pass request headers through
    },
  })

  // Define cookie options - MUST match the options used in createSupabaseBrowserClient
  // EXCEPT for the name, which is handled internally by the library in middleware.
  const cookieOptions: Omit<CookieOptions, 'name'> = {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 // 30 days, matching client side
  }

  // Verify the environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Middleware updateSession: Missing environment variables!', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });
    return response;
  }

  // Create a Supabase client configured for server-side rendering with cookie handling.
  // Crucially, pass request and response objects to enable automatic cookie management.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions, // Pass the defined cookie options (without name)
      cookies: {
        // Function to get a cookie from the request
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Function to set a cookie on the response
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the response with it
          console.log(`Middleware updateSession: Setting cookie ${name}`);
          request.cookies.set({ name, value, ...options }) // Update request cookies for potential chaining
          response = NextResponse.next({ // Recreate response to apply the new cookie set
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        // Function to remove a cookie from the response
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the response accordingly
          console.log(`Middleware updateSession: Removing cookie ${name}`);
          request.cookies.set({ name, value: '', ...options }) // Update request cookies
          response = NextResponse.next({ // Recreate response
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // IMPORTANT: Calling supabase.auth.getUser() ensures the session is validated
    // and refreshed if necessary. It handles reading/writing cookies automatically
    // via the 'cookies' handlers provided above.
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      console.log(`Middleware updateSession: Valid session found for user ${user.id}. Cookies updated/refreshed if needed.`);
    } else {
      console.log('Middleware updateSession: No valid session found.');
    }
    
    // Log outgoing cookies
    console.log('Middleware updateSession: Outgoing cookies:', response.cookies.getAll().map(c => c.name));

  } catch (error) {
     console.error('Middleware Error getting user:', error instanceof Error ? error.message : String(error));
     // Even if there's an error, return the response object,
     // potentially allowing access to public pages.
  }

  // Return the response object, which now contains any necessary Set-Cookie headers
  // applied by the createServerClient helpers.
  return response
} 