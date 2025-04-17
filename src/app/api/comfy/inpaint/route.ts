import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ComfyUI server details
const COMFY_UI_URL = 'http://127.0.0.1:8188';
const TEMP_DIR = path.join(os.tmpdir(), 'the-way-comfy');

// Ensure temp directory exists
try {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    console.log(`Created temp directory: ${TEMP_DIR}`);
  }
} catch (error) {
  console.error('Error creating temp directory:', error);
}

/**
 * Saves a file from a data URL to the filesystem
 * @param dataUrl - The data URL string
 * @param filename - The filename to save as
 * @returns The path to the saved file
 */
async function saveDataUrlToFile(dataUrl: string, filename: string): Promise<string> {
  // Extract the base64 data
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL format');
  }

  const data = Buffer.from(matches[2], 'base64');
  const filePath = path.join(TEMP_DIR, filename);
  
  fs.writeFileSync(filePath, data);
  return filePath;
}

/**
 * Converts a Blob/File to a data URL
 */
async function fileToDataUrl(file: File | Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/png';
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Sends a workflow to ComfyUI with the required input images
 */
async function sendToComfyUI(imageDataUrl: string, maskDataUrl: string, prompt: string): Promise<any> {
  const sessionId = uuidv4();
  
  // Save input files
  const imageFilename = `input_${sessionId}.png`;
  const maskFilename = `mask_${sessionId}.png`;
  
  try {
    // Save the input images
    const imagePath = await saveDataUrlToFile(imageDataUrl, imageFilename);
    const maskPath = await saveDataUrlToFile(maskDataUrl, maskFilename);
    
    console.log(`Saved image to ${imagePath}`);
    console.log(`Saved mask to ${maskPath}`);
    
    // Upload the images to ComfyUI
    const imageFormData = new FormData();
    imageFormData.append('image', new Blob([fs.readFileSync(imagePath)]), imageFilename);
    
    const imageUploadRes = await fetch(`${COMFY_UI_URL}/upload/image`, {
      method: 'POST',
      body: imageFormData
    });
    
    if (!imageUploadRes.ok) {
      throw new Error(`Failed to upload image to ComfyUI: ${await imageUploadRes.text()}`);
    }
    
    const imageUploadData = await imageUploadRes.json();
    const imageNodeId = imageUploadData.name;
    
    // Upload mask to ComfyUI
    const maskFormData = new FormData();
    maskFormData.append('image', new Blob([fs.readFileSync(maskPath)]), maskFilename);
    
    const maskUploadRes = await fetch(`${COMFY_UI_URL}/upload/image`, {
      method: 'POST',
      body: maskFormData
    });
    
    if (!maskUploadRes.ok) {
      throw new Error(`Failed to upload mask to ComfyUI: ${await maskUploadRes.text()}`);
    }
    
    const maskUploadData = await maskUploadRes.json();
    const maskNodeId = maskUploadData.name;
    
    // Create a basic inpainting workflow
    // This is a simplified workflow - in a production environment,
    // you'd want to load this from a template file
    const workflow = {
      "3": {
        "inputs": {
          "image": imageNodeId,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },
      "4": {
        "inputs": {
          "image": maskNodeId,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },
      "5": {
        "inputs": {
          "text": prompt || "a beautiful scene",
          "clip": ["10", 0]
        },
        "class_type": "CLIPTextEncode"
      },
      "6": {
        "inputs": {
          "text": "bad quality, blurry, distorted",
          "clip": ["10", 0]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "samples": ["9", 0],
          "vae": ["10", 2]
        },
        "class_type": "VAEDecode"
      },
      "8": {
        "inputs": {
          "filename_prefix": "inpaint_result",
          "images": ["7", 0]
        },
        "class_type": "SaveImage"
      },
      "9": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 20,
          "cfg": 7,
          "sampler_name": "euler_ancestral",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["10", 0],
          "positive": ["5", 0],
          "negative": ["6", 0],
          "latent_image": ["12", 0]
        },
        "class_type": "KSampler"
      },
      "10": {
        "inputs": {
          "ckpt_name": "sd_xl_turbo_1.0_fp16.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "12": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["10", 2],
          "mask": ["4", 0]
        },
        "class_type": "VAEEncodeForInpaint"
      }
    };
    
    // Send the workflow to ComfyUI
    const promptRes = await fetch(`${COMFY_UI_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: sessionId
      })
    });
    
    if (!promptRes.ok) {
      throw new Error(`Failed to send workflow to ComfyUI: ${await promptRes.text()}`);
    }
    
    const promptData = await promptRes.json();
    console.log('ComfyUI workflow submitted successfully:', promptData);
    
    return {
      id: promptData.prompt_id,
      sessionId,
      status: 'processing'
    };
    
  } catch (error) {
    console.error('Error in ComfyUI processing:', error);
    // Clean up temp files
    try {
      fs.unlinkSync(path.join(TEMP_DIR, imageFilename));
      fs.unlinkSync(path.join(TEMP_DIR, maskFilename));
    } catch (cleanupError) {
      console.error('Error cleaning up temp files:', cleanupError);
    }
    throw error;
  }
}

/**
 * API Route: POST /api/comfy/inpaint
 * Uses local ComfyUI for inpainting tasks
 */
export async function POST(req: NextRequest) {
  console.log('Received request for /api/comfy/inpaint POST');

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const maskFile = formData.get('mask') as File | null;
    const prompt = formData.get('prompt') as string | null;

    // Validation
    if (!imageFile || !maskFile) {
      const missingFields = [];
      if (!imageFile) missingFields.push('original image');
      if (!maskFile) missingFields.push('mask image');
      
      return NextResponse.json({ 
        error: `Missing required files: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    console.log(`Processing ComfyUI inpaint with prompt: "${prompt || '[Empty Prompt]'}"`);

    // Convert files to data URLs
    const imageDataUrl = await fileToDataUrl(imageFile);
    const maskDataUrl = await fileToDataUrl(maskFile);

    // Send to ComfyUI
    const result = await sendToComfyUI(imageDataUrl, maskDataUrl, prompt || '');

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('ComfyUI inpainting failed:', error);
    
    return NextResponse.json(
      { 
        error: `ComfyUI inpainting failed: ${error.message || 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
} 