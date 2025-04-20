import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

export async function POST() {
  console.log('API Route /api/user/mark-onboarded: POST request received.');
  // Await the cookies() call
  const cookieStore = await cookies();

  // Standard client creation
  const supabase = createServerClient(
    API_CONFIG.supabaseUrl!,
    API_CONFIG.supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.warn(`Failed to set cookie '${name}' from Route Handler: ${error}`);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.warn(`Failed to remove cookie '${name}' from Route Handler: ${error}`);
          }
        },
      },
    }
  );

  console.log('API Route: Attempting to get user...'); 
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('API Route: Auth error getting user:', authError.message); 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!user) {
    console.error('API Route: No user found from cookies.'); 
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('API Route: User authenticated:', user.id); 

  try {
    console.log('API Route: Attempting to update profiles table for user:', user.id); 
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('API Route: Error updating profile onboarded status:', updateError); 
      throw updateError;
    }

    console.log('API Route: Successfully updated onboarded status for user:', user.id); 
    return NextResponse.json({ success: true, message: 'User marked as onboarded.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('API Route: Mark Onboarded - Internal Server Error:', errorMessage); 
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 