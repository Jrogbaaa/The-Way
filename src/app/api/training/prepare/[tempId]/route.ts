import { NextRequest, NextResponse } from 'next/server';

// Access the global storage that's initialized in the parent route
const getTemporaryConfigs = () => {
  return (global as any).temporaryConfigs || new Map();
};

/**
 * GET /api/training/prepare/[tempId]
 * Retrieve a temporary training configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tempId: string }> }
) {
  try {
    // Wait for params to be resolved
    const { tempId } = await params;
    console.log(`GET /api/training/prepare/${tempId} called`);
    
    const temporaryConfigs = getTemporaryConfigs();
    const stored = temporaryConfigs.get(tempId);
    
    if (!stored) {
      return NextResponse.json(
        { error: 'Training configuration not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if config has expired
    const now = Date.now();
    if (now > stored.expiresAt) {
      temporaryConfigs.delete(tempId);
      return NextResponse.json(
        { error: 'Training configuration expired' },
        { status: 410 }
      );
    }
    
    // Mark as used and schedule deletion after 5 minutes instead of immediate deletion
    // This allows for retries and debugging while still being secure
    if (!stored.used) {
      stored.used = true;
      stored.usedAt = now;
      
      // Delete after 5 minutes of being used
      setTimeout(() => {
        temporaryConfigs.delete(tempId);
        console.log(`Cleaned up used temporary config: ${tempId}`);
      }, 5 * 60 * 1000);
    }
    
    return NextResponse.json({
      success: true,
      config: stored.config,
      used: stored.used,
      usedAt: stored.usedAt
    });

  } catch (error: any) {
    console.error('Error retrieving temporary training config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve training configuration' },
      { status: 500 }
    );
  }
} 