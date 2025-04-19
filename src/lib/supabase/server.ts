import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { API_CONFIG } from '@/lib/config';

// Remove the re-export of the standard client if not needed elsewhere
// export { createClient } from '@supabase/supabase-js'; 

// Factory function to create a Supabase client for server-side operations
export const createServerClient = (cookieStore: any) => {

  // Create and return the Supabase server client instance
  return _createServerClient(
    API_CONFIG.supabaseUrl!,
    API_CONFIG.supabaseAnonKey!,
    {
      cookies: {
        // Updated cookie handler functions to directly use the passed cookieStore
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            if (typeof cookieStore.delete === 'function') {
              cookieStore.delete({ name, ...options });
            } else {
              cookieStore.set({ name, value: '', ...options });
            }
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Remove or update these if they are not the intended pattern.
// Calling createServerClient(cookies()) directly where needed is often clearer.
// export const supabaseServer = createServerClient(cookies()); // This won't work here
// export default supabaseServer; 