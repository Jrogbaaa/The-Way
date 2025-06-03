import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const serviceRoleClient = createAdminClient();
    
    // Get the first record to see available columns
    const { data, error } = await serviceRoleClient
      .from('trained_models')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: `Database error: ${error.message}`,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      columns: data && data.length > 0 ? Object.keys(data[0]) : [],
      sampleRecord: data && data.length > 0 ? data[0] : null
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to check schema'
    }, { status: 500 });
  }
} 