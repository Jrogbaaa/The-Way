import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/config';

export async function POST() {
  console.log('API Route /api/user/ensure-profile: POST request received.');
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

  if (authError || !user) {
    console.error('Auth Error in ensure-profile:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabase
      .from('profiles')
      .select('id, onboarded')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') {
       console.error('Error selecting profile:', selectError);
       throw selectError;
    }

    if (existingProfile) {
      // Return existing profile status
      return NextResponse.json({ 
        success: true, 
        message: 'Profile already exists.', 
        onboarded: existingProfile.onboarded
      });
    }

    // Profile doesn't exist, create it
    const newUserProfile = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url,
      onboarded: false,
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(newUserProfile);

    if (insertError) {
      console.error('Error inserting profile:', insertError);
      throw insertError;
    }

    // Return newly created profile status
    return NextResponse.json({ 
      success: true, 
      message: 'Profile created successfully.', 
      onboarded: false
    });

  } catch (error) {
    console.error('Ensure Profile Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 