import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Create a single instance of the Supabase client for browser usage
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Helper to determine if we're in a local development environment
const isLocalDevelopment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Helper to determine the cookie domain
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined;
  
  // CRITICAL: For localhost or development environments, NEVER set domain
  // This ensures cookies work properly in the local dev environment
  if (isLocalDevelopment()) {
    console.log('Using undefined cookie domain for localhost');
    return undefined;
  }
  
  const hostname = window.location.hostname;
  
  // For deployment preview environments, also don't set domain
  if (hostname.includes('.vercel.app') || hostname.includes('.netlify.app')) {
    console.log('Using undefined cookie domain for deployment preview');
    return undefined;
  }
  
  // For production custom domains, use the base domain
  console.log('Using cookie domain:', hostname);
  return hostname;
};

export const getSupabaseBrowserClient = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!supabaseClient && isBrowser) {
    console.log('Creating new Supabase browser client');
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: {
          // Get the appropriate domain for cookies
          domain: getCookieDomain(),
          path: '/',
          sameSite: 'lax',
          secure: isBrowser ? window.location.protocol === 'https:' : true,
          // Set a longer max age to prevent frequent re-authentications
          maxAge: 30 * 24 * 60 * 60 // 30 days
        },
        // Enable storage persistence for better session handling
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        // Add debug flag in development to log auth events
        ...(isLocalDevelopment() && { debug: true }),
      }
    );
    
    // Log whether cookies are working
    if (isBrowser) {
      // Add a handler to detect authentication state changes
      supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        console.log(`Auth state changed: ${event}`, session ? `Has session for user ${session.user.id}` : 'No session');
        
        // Log cookie information to help debugging
        const cookies = document.cookie.split(';').map(c => c.trim());
        console.log('Current cookies:', cookies.length ? cookies : 'No cookies found');
        
        // Call ensure-profile on sign-in to guarantee profile exists
        if (event === 'SIGNED_IN' && session) {
          try {
            fetch('/api/user/ensure-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              }
            }).then(response => {
              if (response.ok) {
                console.log('Automatically called ensure-profile after sign-in');
              }
            }).catch(error => {
              console.error('Failed to call ensure-profile after sign-in:', error);
            });
          } catch (e) {
            console.error('Error calling ensure-profile:', e);
          }
        }
      });
      
      // Verify if we have an existing session
      supabaseClient.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
        console.log('Initial session check:', data.session ? `Found session for ${data.session.user.id}` : 'No session found');
      });
    }
  }
  return supabaseClient;
}; 