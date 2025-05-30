import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/auth';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/replicate/status/[id]
 * Check the status of a Replicate training job and update database
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  console.log(`GET /api/replicate/status/${params.id} called`);
  
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API token not configured' }, 
      { status: 500 }
    );
  }

  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const trainingId = params.id;

    // First, get the training record from our database
    const { data: dbRecord, error: dbError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', trainingId)
      .eq('user_id', session.user.id)
      .single();

    if (dbError || !dbRecord) {
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    // If we don't have a Replicate training ID, return the current database status
    if (!dbRecord.replicate_training_id) {
      return NextResponse.json({
        id: trainingId,
        status: dbRecord.status,
        progress: dbRecord.progress || 0,
        error: dbRecord.error_message
      });
    }

    // Check status with Replicate
    const training = await replicate.trainings.get(dbRecord.replicate_training_id);
    
    console.log(`Replicate training ${training.id} status: ${training.status}`);

    // Calculate more accurate progress based on status and logs
    let calculatedProgress = 0;
    let progressStage = 'initializing';

    if (training.status === 'starting') {
      calculatedProgress = 5;
      progressStage = 'starting';
    } else if (training.status === 'processing') {
      // Parse logs for more accurate progress
      if (training.logs) {
        const logs = training.logs;
        
        // Look for specific training indicators in the logs
        if (logs.includes('Loading images') || logs.includes('Preprocessing')) {
          calculatedProgress = 15;
          progressStage = 'preprocessing';
        } else if (logs.includes('Starting training') || logs.includes('Training step')) {
          // Count training steps if available
          const stepMatches = logs.match(/(\d+)\/(\d+)/g);
          if (stepMatches && stepMatches.length > 0) {
            const lastMatch = stepMatches[stepMatches.length - 1];
            const [current, total] = lastMatch.split('/').map(Number);
            if (current && total) {
              // Training is 15% (preprocessing) + 70% (training steps) + 15% (finalizing)
              const trainingProgress = (current / total) * 70;
              calculatedProgress = 15 + trainingProgress;
              progressStage = `training (${current}/${total})`;
            } else {
              calculatedProgress = 45; // Mid-training estimate
              progressStage = 'training';
            }
          } else if (logs.includes('flux_train_replicate:')) {
            // Look for percentage indicators in flux training logs
            const percentMatches = logs.match(/(\d+)%/g);
            if (percentMatches && percentMatches.length > 0) {
              const lastPercent = parseInt(percentMatches[percentMatches.length - 1]);
              // Scale the percentage to our 70% training allocation
              calculatedProgress = 15 + (lastPercent * 0.7);
              progressStage = `training (${lastPercent}%)`;
            } else {
              calculatedProgress = 45;
              progressStage = 'training';
            }
          } else {
            calculatedProgress = 35;
            progressStage = 'training';
          }
        } else if (logs.includes('Saving') || logs.includes('Uploading')) {
          calculatedProgress = 90;
          progressStage = 'finalizing';
        } else {
          calculatedProgress = 25;
          progressStage = 'processing';
        }
      } else {
        // No logs available, use time-based estimation
        const now = new Date();
        const createdAt = new Date(dbRecord.created_at);
        const elapsed = now.getTime() - createdAt.getTime();
        const estimatedDuration = 45 * 60 * 1000; // 45 minutes in milliseconds
        
        calculatedProgress = Math.min(85, (elapsed / estimatedDuration) * 100);
        progressStage = 'processing';
      }
    } else if (training.status === 'succeeded') {
      calculatedProgress = 100;
      progressStage = 'completed';
    } else if (training.status === 'failed' || training.status === 'canceled') {
      calculatedProgress = 0;
      progressStage = 'failed';
    }

    // Update our database with the latest status
    const updateData: any = {
      status: training.status,
      progress: Math.round(calculatedProgress),
      updated_at: new Date().toISOString()
    };

    // If training completed successfully, we need to get the model version
    if (training.status === 'succeeded' && training.output) {
      updateData.replicate_model_version = training.output.version;
      updateData.model_url = training.output.version; // The version ID can be used to run the model
      updateData.progress = 100;
      
      // Store additional output data if available
      if (training.output.weights) {
        updateData.weights_url = training.output.weights;
      }
    } else if (training.status === 'failed') {
      updateData.error_message = training.error || 'Training failed';
      updateData.progress = 0;
    }

    // Update the database
    const { error: updateError } = await supabase
      .from('trained_models')
      .update(updateData)
      .eq('id', trainingId);

    if (updateError) {
      console.error('Error updating training status in database:', updateError);
    }

    return NextResponse.json({
      id: trainingId,
      replicateId: training.id,
      status: training.status,
      progress: Math.round(calculatedProgress),
      progressStage,
      error: training.error,
      output: training.output,
      logs: training.logs,
      modelVersion: training.output?.version,
      estimatedTimeRemaining: calculatedProgress > 0 && calculatedProgress < 100 
        ? Math.max(1, Math.round((100 - calculatedProgress) / 2)) // Rough estimate: 2% per minute
        : null
    });

  } catch (error: any) {
    console.error('Error checking training status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check training status' },
      { status: 500 }
    );
  }
} 