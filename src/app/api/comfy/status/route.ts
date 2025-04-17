import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// ComfyUI server details
const COMFY_UI_URL = 'http://127.0.0.1:8188';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'comfyui-outputs');

// Ensure output directory exists
try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }
} catch (error) {
  console.error('Error creating output directory:', error);
}

/**
 * Fetches the current status of a ComfyUI job
 */
async function checkJobStatus(promptId: string): Promise<any> {
  try {
    // Check the history endpoint for completed jobs
    const historyRes = await fetch(`${COMFY_UI_URL}/history/${promptId}`);
    
    if (!historyRes.ok) {
      throw new Error(`Failed to fetch job history: ${await historyRes.text()}`);
    }
    
    const historyData = await historyRes.json();
    
    // If job is found in history, it's completed
    if (historyData && historyData[promptId]) {
      const jobData = historyData[promptId];
      
      // Check if we have outputs
      if (jobData.outputs && Object.keys(jobData.outputs).length > 0) {
        // Look for SaveImage node outputs
        for (const nodeId in jobData.outputs) {
          const nodeOutput = jobData.outputs[nodeId];
          
          // Check for images in the output
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const imageData = nodeOutput.images[0];
            const imagePath = imageData.filename;
            const imageType = imageData.type;
            
            // Download the image to our server
            const imageRes = await fetch(`${COMFY_UI_URL}/view?filename=${encodeURIComponent(imagePath)}`);
            
            if (!imageRes.ok) {
              throw new Error(`Failed to download result image: ${await imageRes.text()}`);
            }
            
            // Save the image to our public directory
            const imageName = path.basename(imagePath);
            const localPath = path.join(OUTPUT_DIR, imageName);
            const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
            fs.writeFileSync(localPath, imageBuffer);
            
            // Return the completed status with image URL
            return {
              status: 'completed',
              output: `/comfyui-outputs/${imageName}`,
              originalFilename: imagePath
            };
          }
        }
      }
      
      // If no images found but job exists in history
      return {
        status: 'completed',
        error: 'No output images found in job results'
      };
    }
    
    // If not in history, check if it's still processing
    const queueRes = await fetch(`${COMFY_UI_URL}/prompt`);
    
    if (!queueRes.ok) {
      throw new Error(`Failed to check queue status: ${await queueRes.text()}`);
    }
    
    const queueData = await queueRes.json();
    
    // Check if our job is in the queue or executing
    if (queueData.queue_running.includes(promptId)) {
      return {
        status: 'executing',
        message: 'Job is currently running'
      };
    } else if (queueData.queue.some((item: Array<any>) => item[1] === promptId)) {
      return {
        status: 'queued',
        message: 'Job is in queue waiting to execute'
      };
    }
    
    // If not in queue or history, it might have failed
    return {
      status: 'unknown',
      error: 'Job not found in queue or history'
    };
    
  } catch (error: any) {
    console.error('Error checking ComfyUI job status:', error);
    throw error;
  }
}

/**
 * API Route: GET /api/comfy/status?id=promptId
 * Checks the status of a ComfyUI job and returns results if available
 */
export async function GET(req: NextRequest) {
  const promptId = req.nextUrl.searchParams.get('id');
  
  if (!promptId) {
    return NextResponse.json({ error: 'Missing promptId parameter' }, { status: 400 });
  }
  
  try {
    console.log(`Checking status for ComfyUI job ${promptId}`);
    const status = await checkJobStatus(promptId);
    
    return NextResponse.json(status);
    
  } catch (error: any) {
    console.error('Error checking ComfyUI status:', error);
    
    return NextResponse.json(
      { 
        error: `Failed to check ComfyUI status: ${error.message}`,
        status: 'error'
      },
      { status: 500 }
    );
  }
} 