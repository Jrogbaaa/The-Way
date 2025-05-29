import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * GET /api/replicate/debug-user
 * Debug endpoint to find the correct Replicate username
 */
export async function GET(request: NextRequest) {
  console.log('GET /api/replicate/debug-user called');
  
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'Replicate API token not configured' }, 
      { status: 500 }
    );
  }

  try {
    // Get user's account info to find correct username
    console.log('Fetching account information...');
    
    // Try to list user's models to see what username is used
    const userModels = await replicate.models.list();
    
    // Try to list user's trainings to see account details
    const userTrainings = await replicate.trainings.list();
    
    return NextResponse.json({
      success: true,
      debug: {
        userModels: {
          total: userModels.results?.length || 0,
          models: userModels.results?.slice(0, 3).map(model => ({
            owner: model.owner,
            name: model.name,
            url: model.url
          })) || []
        },
        userTrainings: {
          total: userTrainings.results?.length || 0,
          trainings: userTrainings.results?.slice(0, 3).map(training => ({
            id: training.id,
            status: training.status,
            // @ts-ignore
            owner: training.model?.owner || 'unknown'
          })) || []
        },
        suggestedUsernameFormats: [
          'Your actual Replicate username should appear in the models/trainings above',
          'Common formats: username, username-suffix, email-prefix'
        ]
      }
    });

  } catch (error: any) {
    console.error('Error getting account info:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get account info',
        details: error.response?.data || error
      },
      { status: 500 }
    );
  }
} 