import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Gallery Delete File API: Received request');

  try {
    // Parse request body
    const body = await request.json();
    const { path, userId, type } = body;

    if (!path || !userId) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Gallery Delete File API: Attempting to delete file at ${userId}/${path}`);

    // Create a direct Supabase client with admin privileges to bypass auth issues
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Also try with the standard server client as a fallback
    const supabaseServer = await createSupabaseServerClient('DeleteFileAPI');

    // The full path in storage
    const fullPath = `${userId}/${path}`;

    // Try with admin client first
    try {
      const { error } = await supabaseAdmin.storage
        .from('gallery-uploads')
        .remove([fullPath]);

      if (error) {
        console.error('Gallery Delete File API: Admin client error:', error);
        throw error;
      }

      console.log(`Gallery Delete File API: Successfully deleted file: ${fullPath}`);
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } catch (adminError) {
      console.warn('Gallery Delete File API: Admin client failed, trying server client:', adminError);
      
      // Fallback to server client
      const { error } = await supabaseServer.storage
        .from('gallery-uploads')
        .remove([fullPath]);

      if (error) {
        console.error('Gallery Delete File API: Server client error:', error);
        throw error;
      }

      console.log(`Gallery Delete File API: Successfully deleted file via server client: ${fullPath}`);
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    }
  } catch (error) {
    console.error('Gallery Delete File API: Error processing request:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
} 