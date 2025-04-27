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
  
  // Handle Vercel deployment previews - IMPORTANT: Don't set domain for Vercel.app domains
  // This allows cookies to be properly set on the specific subdomain
  if (hostname.includes('.vercel.app')) {
    console.log('Using undefined cookie domain for vercel.app - allows subdomain-specific cookies');
    return undefined; // undefined allows the browser to use the current domain
  }
  
  // For Netlify previews, use the same approach
  if (hostname.includes('.netlify.app')) {
    console.log('Using undefined cookie domain for netlify.app');
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
    
    // Set up proper cookie options based on environment
    const cookieOptions = {
      domain: getCookieDomain(),
      path: '/',
      sameSite: 'lax' as const,
      secure: isBrowser ? window.location.protocol === 'https:' : true,
      maxAge: 30 * 24 * 60 * 60 // 30 days
    };
    
    console.log('Cookie options:', JSON.stringify(cookieOptions, null, 2));
    
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Explicit PKCE for OAuth security
          storageKey: 'the-way-auth', // Custom storage key to avoid conflicts
          // Prevent multiple instances from fighting for the same storage
          storage: {
            getItem: (key: string) => {
              try {
                return localStorage.getItem(key);
              } catch (error) {
                console.error('Error accessing localStorage:', error);
                return null;
              }
            }, 
            setItem: (key: string, value: string) => {
              try {
                localStorage.setItem(key, value);
              } catch (error) {
                console.error('Error writing to localStorage:', error);
              }
            },
            removeItem: (key: string) => {
              try {
                localStorage.removeItem(key);
              } catch (error) {
                console.error('Error removing from localStorage:', error);
              }
            }
          }
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