import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Replicate webhook endpoint for real-time training updates
 * This endpoint receives updates from Replicate during training
 */
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();
    
    console.log('Received Replicate webhook:', {
      id: webhookData.id,
      status: webhookData.status,
      hasLogs: !!webhookData.logs
    });

    // Extract relevant data from webhook
    const {
      id: replicateTrainingId,
      status,
      logs,
      error,
      output,
      created_at,
      completed_at
    } = webhookData;

    if (!replicateTrainingId) {
      return NextResponse.json(
        { error: 'Missing training ID in webhook' },
        { status: 400 }
      );
    }

    // Find the corresponding training record in our database
    const { data: trainingRecord, error: findError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('replicate_training_id', replicateTrainingId)
      .single();

    if (findError || !trainingRecord) {
      console.warn(`Training record not found for Replicate ID: ${replicateTrainingId}`);
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    console.log(`Updating training record ${trainingRecord.id} with status: ${status}`);

    // Calculate progress based on status and logs
    let progress = trainingRecord.progress || 0;
    
    if (status === 'starting') {
      progress = 5;
    } else if (status === 'processing') {
      // Parse logs for progress
      if (logs) {
        // Look for flux training progress
        const progressMatches = logs.match(/flux_train_replicate:\s*(\d+)%/g);
        if (progressMatches && progressMatches.length > 0) {
          const lastMatch = progressMatches[progressMatches.length - 1];
          const percentMatch = lastMatch.match(/(\d+)%/);
          if (percentMatch) {
            const replicateProgress = parseInt(percentMatch[1]);
            progress = Math.min(95, 10 + (replicateProgress * 0.85));
          }
        }
        // Look for step-based progress
        else {
          const stepMatches = logs.match(/(\d+)\/(\d+)/g);
          if (stepMatches && stepMatches.length > 0) {
            const lastStep = stepMatches[stepMatches.length - 1];
            const [current, total] = lastStep.split('/').map(Number);
            if (current && total) {
              const stepProgress = (current / total) * 100;
              progress = Math.min(95, 10 + (stepProgress * 0.85));
            }
          }
        }
      }
    } else if (status === 'succeeded') {
      progress = 100;
    } else if (status === 'failed') {
      progress = 0;
    }

    // Prepare update data
    const updateData: any = {
      status: status === 'succeeded' ? 'completed' : status,
      progress: Math.round(progress),
      updated_at: new Date().toISOString()
    };

    // Handle completion
    if (status === 'succeeded' && output) {
      updateData.model_url = output.version ? 
        `${trainingRecord.input_data?.replicateModelName}:${output.version}` : 
        null;
      updateData.version = output.version;
      updateData.model_info = {
        ...trainingRecord.model_info,
        completedAt: completed_at || new Date().toISOString(),
        output,
        webhookUpdated: true
      };
    }

    // Handle failure
    if (status === 'failed') {
      updateData.error_message = error || 'Training failed';
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', trainingRecord.id);

    if (updateError) {
      console.error('Error updating training record:', updateError);
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully updated training ${trainingRecord.id}:`, {
      status: updateData.status,
      progress: updateData.progress
    });

    // Send real-time notification if needed (future enhancement)
    // You could integrate with Socket.io, Pusher, or similar here

    return NextResponse.json({
      success: true,
      trainingId: trainingRecord.id,
      replicateId: replicateTrainingId,
      status: updateData.status,
      progress: updateData.progress,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Replicate webhook:', error);
    return NextResponse.json(
      { error: `Webhook processing failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// Verify webhook signature (optional, for security)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Replicate webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
} 