import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(debugPrefix = 'Server') {
  console.log(`${debugPrefix}: Creating Supabase client with URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20)}...`);
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(`${debugPrefix}: Missing Supabase environment variables!`);
    throw new Error('Missing Supabase environment variables');
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