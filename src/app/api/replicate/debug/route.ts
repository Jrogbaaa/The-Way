import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function GET() {
  try {
    // Get recent trainings
    const trainings = await replicate.trainings.list();
    
    return NextResponse.json({
      success: true,
      trainings: trainings.results.slice(0, 5).map((training: any) => ({
        id: training.id,
        status: training.status,
        created_at: training.created_at,
        destination: training.destination,
        model: training.model,
        completed_at: training.completed_at
      }))
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to fetch trainings'
    }, { status: 500 });
  }
} 