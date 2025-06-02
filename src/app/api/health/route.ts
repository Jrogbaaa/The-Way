import { NextRequest, NextResponse } from 'next/server';

// Simple health check endpoint to monitor deployment status
export async function GET(request: NextRequest) {
  try {
    // Test database connectivity
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let dbStatus = 'disconnected';
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
          .from('trained_models')
          .select('id')
          .limit(1);
        
        dbStatus = error ? 'error' : 'connected';
      } catch (error) {
        dbStatus = 'error';
      }
    }

    // Test environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasReplicateToken: !!process.env.REPLICATE_API_TOKEN,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    };

    const timestamp = new Date().toISOString();
    const deployment = process.env.VERCEL_URL || 'localhost';

    return NextResponse.json({
      status: 'healthy',
      timestamp,
      deployment,
      database: dbStatus,
      environment: envCheck,
      version: '1.0.0',
      uptime: process.uptime(),
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 