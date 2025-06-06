import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is missing.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get real-time training logs and progress from Replicate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Wait for params to be resolved
    const { id } = await params;

    // Get the training record from database
    const { data: dbRecord, error: dbError } = await supabase
      .from('trained_models')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError || !dbRecord) {
      return NextResponse.json(
        { error: 'Training record not found' },
        { status: 404 }
      );
    }

    // Get Replicate training ID if we have one
    const replicateTrainingId = dbRecord.replicate_id;
    
    if (!replicateTrainingId) {
      return NextResponse.json({
        id: id,
        modelName: dbRecord.model_name,
        instancePrompt: dbRecord.input_data?.instancePrompt,
        triggerWord: dbRecord.input_data?.triggerWord,
        status: dbRecord.status,
        progress: dbRecord.progress || 0,
        logs: 'Training starting... No Replicate training ID yet.',
        estimatedTimeRemaining: null,
        stage: 'initializing',
        createdAt: dbRecord.created_at,
        modelUrl: dbRecord.model_url
      });
    }

    // Get training details from Replicate
    const training = await replicate.trainings.get(replicateTrainingId);
    
    // Parse logs for detailed progress
    const logs = training.logs || '';
    let progress = 0;
    let stage = 'initializing';
    let estimatedTimeRemaining = null;
    
    // Calculate progress based on Replicate status and logs
    if (training.status === 'starting') {
      progress = 5;
      stage = 'starting';
    } else if (training.status === 'processing') {
      stage = 'training';
      
      // Parse Flux training logs for accurate progress
      if (logs.includes('flux_train_replicate:')) {
        const progressMatches = logs.match(/flux_train_replicate:\s*(\d+)%/g);
        if (progressMatches && progressMatches.length > 0) {
          const lastMatch = progressMatches[progressMatches.length - 1];
          const percentMatch = lastMatch.match(/(\d+)%/);
          if (percentMatch) {
            const replicateProgress = parseInt(percentMatch[1]);
            progress = Math.min(95, 10 + (replicateProgress * 0.85)); // Scale to 10-95%
            stage = `training (${replicateProgress}%)`;
            
            // Estimate time remaining based on progress rate
            if (replicateProgress > 0) {
              // Calculate ETA based on elapsed time and current progress
              const createdAt = new Date(training.created_at).getTime();
              const elapsed = (Date.now() - createdAt) / 1000 / 60; // minutes elapsed
              const progressRate = replicateProgress / elapsed; // progress per minute
              const remainingProgress = 100 - replicateProgress;
              estimatedTimeRemaining = progressRate > 0 ? Math.max(1, Math.round(remainingProgress / progressRate)) : null;
            }
          }
        }
      }
      
      // Look for step-based progress (e.g., 150/1000)
      else if (logs.includes('/')) {
        const stepMatches = logs.match(/(\d+)\/(\d+)/g);
        if (stepMatches && stepMatches.length > 0) {
          const lastStep = stepMatches[stepMatches.length - 1];
          const [current, total] = lastStep.split('/').map(Number);
          if (current && total) {
            const stepProgress = (current / total) * 100;
            progress = Math.min(95, 10 + (stepProgress * 0.85));
            stage = `training (${current}/${total} steps)`;
            
            const remainingSteps = total - current;
            // Calculate ETA based on elapsed time and step rate
            const createdAt = new Date(training.created_at).getTime();
            const elapsed = (Date.now() - createdAt) / 1000 / 60; // minutes elapsed
            const stepRate = current / elapsed; // steps per minute
            estimatedTimeRemaining = stepRate > 0 ? Math.max(1, Math.round(remainingSteps / stepRate)) : null;
          }
        }
      }
      
      // Generic processing progress
      else {
        const createdAt = new Date(training.created_at).getTime();
        const elapsed = (Date.now() - createdAt) / 1000 / 60; // minutes
        // More conservative progress estimation: 1.5% per minute for first 20 minutes, then 1% per minute
        const estimatedProgress = elapsed <= 20 ? elapsed * 1.5 : 30 + (elapsed - 20) * 1;
        progress = Math.min(90, 10 + estimatedProgress);
        
        // Base ETA on typical training time (30-45 minutes total)
        const typicalTotalTime = 40; // minutes
        const remainingTime = Math.max(0, typicalTotalTime - elapsed);
        estimatedTimeRemaining = Math.max(1, Math.round(remainingTime));
      }
      
    } else if (training.status === 'succeeded') {
      progress = 100;
      stage = 'completed';
      estimatedTimeRemaining = 0;
      
      // Update database if not already completed
      if (dbRecord.status !== 'completed') {
        await supabase
          .from('trained_models')
          .update({
            status: 'completed',
            progress: 100,
            model_url: training.output?.version ? `${dbRecord.input_data?.replicateModelName}:${training.output.version}` : null,
            version: training.output?.version,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }
      
    } else if (training.status === 'failed') {
      progress = 0;
      stage = 'failed';
      estimatedTimeRemaining = null;
      
      // Update database if not already failed
      if (dbRecord.status !== 'failed') {
        await supabase
          .from('trained_models')
          .update({
            status: 'failed',
            progress: 0,
            error_message: training.error || 'Training failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }
    }

    // Update progress in database if significantly changed
    if (Math.abs((dbRecord.progress || 0) - progress) >= 5) {
      await supabase
        .from('trained_models')
        .update({
          progress: Math.round(progress),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    }

    return NextResponse.json({
      id: id,
      replicateId: replicateTrainingId,
      status: training.status,
      progress: Math.round(progress),
      stage,
      logs: logs.slice(-2000), // Last 2000 characters
      error: training.error,
      estimatedTimeRemaining,
      createdAt: training.created_at,
      modelUrl: training.output?.version ? `${dbRecord.input_data?.replicateModelName}:${training.output.version}` : null,
      webhook: training.webhook,
      // Parse recent log lines for display
      recentLogs: logs ? logs.split('\n').slice(-10).filter(line => line.trim()) : [],
      modelName: dbRecord.model_name,
      instancePrompt: dbRecord.input_data?.instancePrompt,
      triggerWord: dbRecord.input_data?.triggerWord
    });

  } catch (error: any) {
    console.error('Error fetching training logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch training logs' },
      { status: 500 }
    );
  }
} 