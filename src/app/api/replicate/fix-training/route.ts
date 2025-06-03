import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { trainingId, replicateTrainingId } = await request.json();
    
    if (!trainingId || !replicateTrainingId) {
      return NextResponse.json(
        { error: 'trainingId and replicateTrainingId are required' },
        { status: 400 }
      );
    }
    
    // Use admin client to update the database
    const serviceRoleClient = createAdminClient();
    
    const { error: updateError } = await serviceRoleClient
      .from('trained_models')
      .update({ 
        replicate_id: replicateTrainingId,
        status: 'processing'
      })
      .eq('id', trainingId);

    if (updateError) {
      console.error('Error updating training record:', updateError);
      return NextResponse.json(
        { error: `Failed to update database: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Training record updated successfully'
    });

  } catch (error: any) {
    console.error('Error fixing training:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fix training' },
      { status: 500 }
    );
  }
} 