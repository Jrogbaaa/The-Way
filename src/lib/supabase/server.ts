import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createBrowserClient } from '@supabase/supabase-js' // Import the standard client

// Function to create a standard server client using cookies
export async function createClient(debugPrefix = 'Server') {
  console.log(`${debugPrefix}: Creating Supabase server client with URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)}...`);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(`${debugPrefix}: Missing Supabase environment variables for server client!`);
    throw new Error('Missing Supabase environment variables for server client');
  }
  
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          console.log(`${debugPrefix}: Cookie '${name}' ${cookie ? 'found' : 'not found'}`);
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
            console.log(`${debugPrefix}: Set cookie '${name}'`);
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn(`${debugPrefix}: Failed to set cookie '${name}': ${error}`);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
            console.log(`${debugPrefix}: Removed cookie '${name}'`);
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.warn(`${debugPrefix}: Failed to remove cookie '${name}': ${error}`);
          }
        },
      },
    }
  )
}

// Function to create an admin client using the service role key (bypasses RLS)
export function createAdminClient(debugPrefix = 'Admin') {
  console.log(`${debugPrefix}: Creating Supabase admin client with URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)}...`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(`${debugPrefix}: Missing Supabase URL or Service Role Key for admin client!`);
    throw new Error('Missing Supabase URL or Service Role Key for admin client');
  }

  // Use the standard createClient from @supabase/supabase-js for service role
  return createBrowserClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false, // Typically false for service roles
      persistSession: false,    // Typically false for service roles
    },
  });
} 