import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Create a single instance of the Supabase client for browser usage
// Using a module-scoped variable to ensure true singleton pattern
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
const clientPromise = typeof window !== 'undefined' ? initializeClient() : null;

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

// Initialize client once and return a promise to await
async function initializeClient() {
  if (typeof window === 'undefined') return null;
  
  if (!supabaseClient) {
    console.log('Creating new Supabase browser client');
    
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing required environment variables for Supabase client');
    }
    
    // Set up proper cookie options based on environment
    const cookieOptions = {
      domain: getCookieDomain(),
      path: '/',
      sameSite: 'lax' as const,
      secure: window.location.protocol === 'https:',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    };
    
    console.log('Cookie options:', JSON.stringify(cookieOptions, null, 2));
    
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookieOptions,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Explicit PKCE for OAuth security
          storageKey: 'the-way-auth', // Custom storage key to avoid conflicts
        }
      }
    );
    
    // Set up cross-tab auth state sync
    window.addEventListener('storage', (event) => {
      if (event.key === 'the-way-auth') {
        supabaseClient?.auth.refreshSession();
      }
    });
  }
  
  return supabaseClient;
}

// Safely get the Supabase client - will initialize if needed
export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be called in browser environment');
  }
  
  // Return existing client if available
  if (supabaseClient) return supabaseClient;
  
  // Initialize client if needed
  if (!clientPromise) {
    return initializeClient() as any;
  }
  
  return clientPromise;
};

// Export an explicit initialization function for use in _app.js or layout.js
export const initializeSupabaseClient = async () => {
  if (typeof window === 'undefined') return null;
  if (!clientPromise) return initializeClient();
  return clientPromise;
}; 