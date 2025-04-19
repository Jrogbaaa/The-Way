import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log(`Function "ensure-profile" initializing...`);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  console.log(`Handling ${req.method} request`);

  try {
    // Create Supabase client using the user's Auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
        auth: { persistSession: false } // No need to persist session server-side here
      }
    );

    // Get user from the provided token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error('Auth Error in ensure-profile function:', authError.message);
      return new Response(JSON.stringify({ error: `Authentication error: ${authError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    if (!user) {
      console.error('No user found for the provided token.');
      return new Response(JSON.stringify({ error: 'Unauthorized: No user found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User verified in Edge Function:', user.id);

    // Check if profile already exists
    const { data: existingProfile, error: selectError } = await supabaseClient
      .from('profiles')
      .select('id, onboarded')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found, which is expected for new users
      console.error('Error selecting profile in Edge Function:', selectError);
      return new Response(JSON.stringify({ error: 'Database error checking profile.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (existingProfile) {
      console.log('Profile exists for user:', user.id, 'Onboarded:', existingProfile.onboarded);
      return new Response(JSON.stringify({
        success: true,
        message: 'Profile already exists.',
        onboarded: existingProfile.onboarded
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Profile doesn't exist, create it
    console.log('Profile does not exist for user:', user.id, 'Creating profile...');
    const newUserProfile = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || user.email || `User_${user.id.substring(0, 6)}`, // Add fallback
      avatar_url: user.user_metadata?.avatar_url,
      onboarded: false,
    };

    const { error: insertError } = await supabaseClient
      .from('profiles')
      .insert(newUserProfile);

    if (insertError) {
      console.error('Error inserting profile in Edge Function:', insertError);
      return new Response(JSON.stringify({ error: 'Database error creating profile.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Profile created successfully for user:', user.id);
    return new Response(JSON.stringify({
      success: true,
      message: 'Profile created successfully.',
      onboarded: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201, // Use 201 Created status
    });

  } catch (error) {
    console.error('Generic Error in ensure-profile Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 