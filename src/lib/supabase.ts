import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from './config';

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
    },
  }
);

// Create a Supabase admin client for server-side operations
// Only use this client in server components or API routes
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}; 