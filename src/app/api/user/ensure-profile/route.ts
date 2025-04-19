import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = cookies();
  // Use the custom server client helper, passing the cookie store
  const supabase = createServerClient(cookieStore); 

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