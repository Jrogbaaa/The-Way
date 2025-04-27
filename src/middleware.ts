import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ROUTES } from '@/lib/config';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;
  const hostname = requestUrl.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isVercelDeployment = hostname.includes('.vercel.app');
  const isCustomDomain = !isLocalhost && !isVercelDeployment;

  // Enhanced logging for debugging
  console.log(`Middleware: Called for path ${path}`);
  console.log(`Middleware: Hostname is ${hostname}`);
  console.log(`Middleware: Is localhost? ${isLocalhost}`);
  console.log(`Middleware: Is Vercel deployment? ${isVercelDeployment}`);
  console.log(`Middleware: Cookies present: ${request.cookies.size > 0}`);
  
  if(request.cookies.size > 0) {
    // Convert RequestCookies to array of names using getAll() instead of keys()
    console.log('Middleware: Cookie names:', request.cookies.getAll().map(cookie => cookie.name));
  }

  // CRITICAL: Don't interfere with auth-related routes
  if (path.startsWith('/auth/callback') || path === '/auth/callback') {
    console.log('Middleware: Skipping auth check for callback route');
    return NextResponse.next();
  }
  
  // Skip authentication check for public routes
  const isAuthRoute = path.startsWith('/auth');
  const isPublicRoute = 
    path === '/' || 
    path === ROUTES.landing || 
    path === ROUTES.login || 
    path === ROUTES.signup || 
    path.startsWith('/_next') || 
    path.startsWith('/public') ||
    path.startsWith('/api/auth');

  console.log(`Middleware: Route category - isAuthRoute: ${isAuthRoute}, isPublicRoute: ${isPublicRoute}`);

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
            const cookie = request.cookies.get(name)?.value;
            console.log(`Middleware: Getting cookie ${name}: ${cookie ? 'exists' : 'not found'}`);
            return cookie;
          },
          set(name: string, value: string, options: CookieOptions) {
            // If the cookie is set, update the request and response cookies
            console.log(`Middleware: Setting cookie ${name}`);
            
            // Set appropriate cookie options based on environment
            let cookieOptions = { ...options };
            
            // Force domain to be undefined on localhost and Vercel preview deployments
            if (isLocalhost || isVercelDeployment) {
              console.log(`Middleware: Forcing undefined domain for ${isLocalhost ? 'localhost' : 'Vercel deployment'}`);
              cookieOptions.domain = undefined;
            } else if (isCustomDomain && !cookieOptions.domain) {
              console.log(`Middleware: Setting domain to ${hostname} for custom domain`);
              cookieOptions.domain = hostname;
            }
            
            // Always set path to root
            cookieOptions.path = '/';
            
            // Set secure based on protocol
            cookieOptions.secure = process.env.NODE_ENV === 'production';
            
            // Set sameSite to lax to allow redirects from OAuth providers
            cookieOptions.sameSite = 'lax';
            
            // Set maxAge to 30 days
            if (!cookieOptions.maxAge) {
              cookieOptions.maxAge = 30 * 24 * 60 * 60;
            }
            
            console.log(`Middleware: Cookie options for ${name}:`, JSON.stringify(cookieOptions));
            
            request.cookies.set({ name, value, ...cookieOptions });
            response.cookies.set({ name, value, ...cookieOptions });
          },
          remove(name: string, options: CookieOptions) {
            // If the cookie is removed, update the request and response cookies
            console.log(`Middleware: Removing cookie ${name}`);
            
            // Force cookie domain to be undefined on localhost and Vercel preview
            const cookieOptions = {
              ...options,
              domain: (isLocalhost || isVercelDeployment) ? undefined : options.domain,
              path: '/',
              maxAge: 0
            };
            
            request.cookies.set({ name, value: '', ...cookieOptions });
            response.cookies.set({ name, value: '', ...cookieOptions });
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
      console.log(`Middleware: Session found for user ${session.user.id.substring(0, 6)}... on path ${path}`);
    } else {
      console.log('Middleware: No active session found.');
      
      // Redirect authenticated routes to login if no session
      if (!isPublicRoute && !isAuthRoute) {
        console.log(`Middleware: Redirecting unauthenticated request for ${path} to login`);
        return NextResponse.redirect(new URL(ROUTES.login, requestUrl.origin));
      }
    }
    
  } catch (error) {
    console.error('Middleware error:', error);
    // Don't redirect on error for development to prevent redirect loops
    if (isLocalhost) {
      console.log('Middleware: Skipping redirect on error in localhost');
      return NextResponse.next();
    }
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