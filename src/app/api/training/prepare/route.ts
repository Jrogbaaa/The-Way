import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// Store configurations globally for access across routes
// In production, you should use Redis or a proper database
if (!(global as any).temporaryConfigs) {
  (global as any).temporaryConfigs = new Map<string, {
    config: any;
    timestamp: number;
    expiresAt: number;
    used?: boolean;
    usedAt?: number;
  }>();
}

const temporaryConfigs = (global as any).temporaryConfigs;

// Clean up old entries (older than 1 hour)
const cleanupOldConfigs = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of temporaryConfigs.entries()) {
    if (value.timestamp < oneHourAgo || Date.now() > value.expiresAt) {
      temporaryConfigs.delete(key);
    }
  }
};

/**
 * POST /api/training/prepare
 * Store training configuration temporarily for unauthenticated users
 */
export async function POST(request: NextRequest) {
  console.log('POST /api/training/prepare called');
  
  try {
    const config = await request.json();
    
    // Validate required fields
    const { modelName, instancePrompt, trainingImagesZipUrl, triggerWord } = config;
    
    if (!modelName || !instancePrompt || !trainingImagesZipUrl || !triggerWord) {
      return NextResponse.json(
        { error: 'Missing required parameters: modelName, instancePrompt, trainingImagesZipUrl, triggerWord' }, 
        { status: 400 }
      );
    }

    // Generate a temporary ID
    const tempId = nanoid();
    
    // Store the configuration temporarily
    temporaryConfigs.set(tempId, {
      config,
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
    });
    
    // Clean up old configs
    cleanupOldConfigs();
    
    console.log(`Stored temporary training config with ID: ${tempId}`);
    
    return NextResponse.json({
      success: true,
      tempId,
      message: 'Training configuration stored temporarily'
    });

  } catch (error: any) {
    console.error('Error storing temporary training config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store training configuration' },
      { status: 500 }
    );
  }
} 