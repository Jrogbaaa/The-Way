import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import BriaClient from '@/lib/bria-sdk';

// Environment variables
const processEnv = {
  BRIA_API_KEY: process.env.BRIA_AI_API_KEY || '',
  MODELSLAB_API_KEY: process.env.MODELSLAB_API_KEY || ''
};

export async function POST(req: NextRequest) {
  // Log for debugging
  console.log("Starting outpaint request");
  
  const briaApiKey = process.env.BRIA_AI_API_KEY;
  if (!briaApiKey) {
    console.error("BRIA AI API key not configured");
    return NextResponse.json(
      { error: "BRIA AI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    
    // Handle both single direction and multiple directions
    let directions: string[] = [];
    const directionsArray = formData.getAll("directions[]");
    
    if (directionsArray && directionsArray.length > 0) {
      directions = directionsArray.map(d => d.toString());
    } else {
      // Fallback for backward compatibility
      const singleDirection = formData.get("direction") as string;
      if (singleDirection) {
        directions = [singleDirection];
      }
    }
    
    const prompt = formData.get("prompt") as string || "";

    // Validate inputs
    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate each direction
    const validDirections = ['left', 'right', 'top', 'bottom'];
    if (directions.length === 0 || !directions.every(dir => validDirections.includes(dir))) {
      return NextResponse.json(
        { error: "Invalid direction(s). Each must be one of: left, right, top, bottom" },
        { status: 400 }
      );
    }

    console.log("Image file:", {
      name: imageFile.name,
      type: imageFile.type,
      size: imageFile.size
    });
    console.log("Directions:", directions);
    console.log("Prompt:", prompt);

    // Convert the file to an ArrayBuffer and create buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Initialize the BRIA client with the API key
    const briaClient = new BriaClient(briaApiKey);
    
    // Call the outpaint method which handles all the logic internally
    console.log('Using BRIA AI outpaint API...');
    const result = await briaClient.outpaint(
      imageBuffer,
      directions,
      prompt,
      {
        cfgScale: 7.5,
        steps: 30,
        stylePreset: 'photographic'
      }
    );
    
    // Return the final image
    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.data.length.toString(),
      },
    });
    
  } catch (error: any) {
    console.error("Error in outpaint route:", error);
    
    // More detailed error information if available
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Headers:", error.response.headers);
      console.error("API Error Data:", error.response.data);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process outpaint request", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
