import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '@/lib/config';

// Re-export createClient for direct import
export { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server-side operations
export const createServerClient = () => {
  return createClient(
    API_CONFIG.supabaseUrl,
    API_CONFIG.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};

export const supabaseServer = createServerClient();

export default supabaseServer; 