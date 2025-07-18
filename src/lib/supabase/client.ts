import { createBrowserClient } from '@supabase/ssr';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { isBrowser } from '@/lib/utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { CookieOptions } from '@supabase/auth-helpers-shared';

// Create a single instance of the Supabase client for browser usage
// Using a module-scoped variable to ensure true singleton pattern
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Helper to determine if we're in a local development environment
const isLocalDevelopment = () => {
  if (!isBrowser()) return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

// Helper to determine the appropriate cookie domain
const getCookieDomain = () => {
  if (!isBrowser()) return undefined;
  
  const hostname = window.location.hostname;
  
  // For localhost, don't set a domain (browser default behavior works best)
  if (isLocalDevelopment()) return undefined;
  
  // For Vercel preview deployments or Netlify, don't set a domain
  if (hostname.includes('.vercel.app') || hostname.includes('.netlify.app')) 
    return undefined;
  
  // For custom domains, you might want the root domain for cross-subdomain auth
  // This is a simple approach that works for many common domains
  // For example, if hostname is "app.example.com", this will return "example.com"
  const parts = hostname.split('.');
  if (parts.length > 2) {
    // Get the top two parts for most domains (e.g., example.com)
    return parts.slice(-2).join('.');
  }
  
  // Return the hostname itself for simple domains
  return hostname;
};

// Helper to detect Firefox and apply compatible settings
const getFirefoxCompatibleSettings = () => {
  if (!isBrowser()) return {};
  
  const isFirefox = navigator.userAgent.includes('Firefox');
  if (!isFirefox) return {};
  
  console.log('🦊 Firefox detected - applying compatible settings');
  
  return {
    cookieSettings: {
      sameSite: 'lax' as const,
      secure: window.location.protocol === 'https:',
      // Don't set domain for localhost in Firefox
      domain: isLocalDevelopment() ? undefined : getCookieDomain()
    },
    authSettings: {
      persistSession: false, // Disable for NextAuth compatibility
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'supabase-auth'
    }
  };
};

// Initialize client
function initializeClient() {
  if (!isBrowser()) return null;
  
  try {
    if (!supabaseClient) {
      console.log('Creating new Supabase browser client');
      
      // Check for required environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables');
        throw new Error('Missing required environment variables for Supabase client');
      }
      
      // Set up proper cookie options based on environment
      const hostname = window.location.hostname;
      const isVercel = hostname.includes('.vercel.app');
      const isFirefox = navigator.userAgent.includes('Firefox');
      const firefoxSettings = getFirefoxCompatibleSettings();
      
      const cookieOptions = firefoxSettings.cookieSettings || {
        domain: getCookieDomain(),
        path: '/',
        sameSite: 'lax' as const,
        secure: window.location.protocol === 'https:',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      };
      
      const authOptions = firefoxSettings.authSettings || {
        persistSession: false, // Disable Supabase auth persistence since we use NextAuth
        autoRefreshToken: false, // Disable auto refresh to avoid conflicts
        detectSessionInUrl: false, // Disable URL detection to avoid PKCE conflicts
        storageKey: 'supabase-auth', // Use default storage key
      };
      
      // Log cookie settings for debugging
      console.log('Cookie options:', JSON.stringify(cookieOptions, null, 2));
      console.log('Auth options:', JSON.stringify(authOptions, null, 2));
      console.log('Environment details:', {
        hostname,
        isVercel,
        isFirefox,
        protocol: window.location.protocol
      });
      
      supabaseClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookieOptions,
          auth: authOptions
        }
      );
      
              // Note: Auth state sync disabled since we use NextAuth.js for authentication
        // Supabase is only used for storage operations
    }
    
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

// Safely get the Supabase client - will initialize if needed
export const getSupabaseBrowserClient = () => {
  if (!isBrowser()) {
    throw new Error('getSupabaseBrowserClient should only be called in browser environment');
  }
  
  // Return existing client if available
  if (supabaseClient) return supabaseClient;
  
  // Initialize and return a new client
  return initializeClient();
};

// Export an explicit initialization function for use in _app.js or layout.js
export const initializeSupabaseClient = () => {
  if (!isBrowser()) return null;
  return initializeClient();
};

// Deprecated - use getSupabaseBrowserClient instead
export const createClient = () => {
  console.warn('Warning: createClient() is deprecated, use getSupabaseBrowserClient() instead for better consistency');
  return getSupabaseBrowserClient();
}; 