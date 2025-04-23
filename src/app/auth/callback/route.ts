import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ROUTES } from '@/lib/config';

/**
 * Auth callback handler for OAuth providers
 * Used as a redirect URL after authentication with providers like Google
 */
export async function GET(request: NextRequest) {
  // Extract the code and state from the URL
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  
  if (code) {
    // Create a Supabase client for this specific route handler
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);
    
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(new URL(ROUTES.dashboard, requestUrl.origin));
  }
  
  // If there's no code in the URL, redirect to login page
  return NextResponse.redirect(new URL(ROUTES.login, requestUrl.origin));
} 