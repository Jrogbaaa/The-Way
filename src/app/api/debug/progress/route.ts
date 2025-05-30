import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to test progress calculation logic
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const logType = url.searchParams.get('type') || 'training';

  // Sample log data for different training stages
  const sampleLogs: Record<string, string> = {
    starting: "Starting training process...\nLoading configuration...",
    preprocessing: "Loading images from ZIP file...\nPreprocessing images for training...\nResizing images to 1024x1024...",
    training: `flux_train_replicate: 15% |███▌      | 150/1000 [03:25<08:32, 1.35it/s, lr=0.0004]\nflux_train_replicate: 31% |███████▌  | 307/1000 [03:26<08:32, 1.35it/s, lr=0.0004]`,
    saving: "Training completed successfully!\nSaving model weights...\nUploading model to repository..."
  };

  const logs = sampleLogs[logType];

  // Apply the same logic as in the status endpoint
  let calculatedProgress = 0;
  let progressStage = 'initializing';

  if (logType === 'starting') {
    calculatedProgress = 5;
    progressStage = 'starting';
  } else if (logType === 'preprocessing') {
    calculatedProgress = 15;
    progressStage = 'preprocessing';
  } else if (logType === 'training') {
    // Parse logs for training progress
    if (logs.includes('flux_train_replicate:')) {
      // Look for percentage indicators in flux training logs
      const percentMatches = logs.match(/(\d+)%/g);
      if (percentMatches && percentMatches.length > 0) {
        const lastPercent = parseInt(percentMatches[percentMatches.length - 1]);
        // Scale the percentage to our 70% training allocation
        calculatedProgress = 15 + (lastPercent * 0.7);
        progressStage = `training (${lastPercent}%)`;
      }
    }
  } else if (logType === 'saving') {
    calculatedProgress = 90;
    progressStage = 'finalizing';
  }

  const estimatedTimeRemaining = calculatedProgress > 0 && calculatedProgress < 100 
    ? Math.max(1, Math.round((100 - calculatedProgress) / 2))
    : null;

  return NextResponse.json({
    logType,
    logs,
    calculatedProgress: Math.round(calculatedProgress),
    progressStage,
    estimatedTimeRemaining,
    explanation: {
      starting: "Initial setup phase (5%)",
      preprocessing: "Loading and preparing images (15%)", 
      training: "Model training in progress (15% + training% * 0.7)",
      saving: "Finalizing and uploading model (90%)"
    }
  });
} 