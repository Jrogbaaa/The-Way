import { NextRequest, NextResponse } from 'next/server';
import { setupGoogleAuth, verifyGoogleAuth } from '@/lib/auth-helpers';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Setup Google auth
    const setupSuccess = setupGoogleAuth();
    
    // Check verification
    const isVerified = verifyGoogleAuth();
    
    // Get credentials path
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    let fileExists = false;
    let fileContent = null;
    let absolutePath = '';
    
    if (credentialsPath) {
      absolutePath = path.isAbsolute(credentialsPath) 
        ? credentialsPath 
        : path.join(process.cwd(), credentialsPath);
      
      fileExists = fs.existsSync(absolutePath);
      
      if (fileExists) {
        // Get first few characters for preview
        const rawContent = fs.readFileSync(absolutePath, 'utf8');
        try {
          const json = JSON.parse(rawContent);
          // Safely show non-sensitive parts
          fileContent = {
            type: json.type,
            project_id: json.project_id,
            client_email: json.client_email ? json.client_email.split('@')[0] + '@...' : null
          };
        } catch (e) {
          fileContent = { error: 'Could not parse JSON' };
        }
      }
    }
    
    // Check if we can load the Vertex AI client
    let vertexClientInitialized = false;
    try {
      const { VertexAI } = require('@google-cloud/vertexai');
      const projectId = process.env.GOOGLE_PROJECT_ID;
      
      if (projectId) {
        const vertexAI = new VertexAI({
          project: projectId,
          location: 'us-central1',
        });
        vertexClientInitialized = !!vertexAI;
      }
    } catch (error) {
      console.error('Error initializing Vertex AI client:', error);
    }
    
    return NextResponse.json({
      success: true,
      authSetup: {
        setupSuccess,
        isVerified,
        credentialsPath,
        absolutePath,
        fileExists,
        fileContent,
        vertexClientInitialized,
        projectId: process.env.GOOGLE_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION || 'us-central1'
      }
    });
  } catch (error) {
    console.error('Error testing authentication:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
} 