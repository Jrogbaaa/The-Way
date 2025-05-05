import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server'; // Only need admin client for storage
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth'; // Import NextAuth's auth function

interface OptimizeRequestBody {
  imageUrl: string;
  targetAspectRatio: '9:16' | '1:1' | '4:5'; // Extend as needed
  outputFormat?: 'jpeg' | 'png' | 'webp';
  outputQuality?: number;
  applyCrop?: boolean; // Whether to apply aspect ratio crop or use as-is
}

// Helper to parse aspect ratio string
const parseAspectRatio = (ratio: string): number => {
  const [width, height] = ratio.split(':').map(Number);
  if (!width || !height || isNaN(width) || isNaN(height)) {
    throw new Error('Invalid aspect ratio format. Use W:H (e.g., 9:16).');
  }
  return width / height;
};

// Helper to calculate target dimensions maintaining aspect ratio
const calculateTargetDimensions = (
    originalWidth: number, 
    originalHeight: number, 
    targetAspectRatio: number
): { width: number; height: number } => {
    const originalAspectRatio = originalWidth / originalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (originalAspectRatio > targetAspectRatio) {
        // Original image is wider than target -> Crop width
        targetWidth = Math.round(originalHeight * targetAspectRatio);
    } else if (originalAspectRatio < targetAspectRatio) {
        // Original image is taller than target -> Crop height
        targetHeight = Math.round(originalWidth / targetAspectRatio);
    }
    // Else aspect ratios match, no crop needed, just return original (integer) dimensions
    targetWidth = Math.round(targetWidth);
    targetHeight = Math.round(targetHeight);

    return { width: targetWidth, height: targetHeight };
};


export async function POST(req: NextRequest) {
  // Get user session from NextAuth
  const session = await auth();
  
  // Check if user is authenticated
  if (!session || !session.user) {
    console.error('Optimize API: Auth error or no user - NextAuth session missing');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the user ID from the session
  const userId = session.user.id;
  
  if (!userId) {
    console.error('Optimize API: User ID missing in session');
    return NextResponse.json({ success: false, error: 'User ID missing' }, { status: 401 });
  }

  // Create an admin client specifically for storage operations (bypasses RLS)
  const supabaseAdmin = createAdminClient();

  try {
    const { 
        imageUrl, 
        targetAspectRatio: targetRatioString, 
        outputFormat = 'webp', // Default to webp
        outputQuality = 80, // Default quality
        applyCrop = true // Whether to apply crop or use as is
    } = await req.json() as OptimizeRequestBody;

    if (!imageUrl || !targetRatioString) {
      return NextResponse.json({ success: false, error: 'Missing imageUrl or targetAspectRatio' }, { status: 400 });
    }

    console.log(`Optimizing image: ${imageUrl.substring(0, 50)}... for user ${userId} to aspect ratio ${targetRatioString}`);

    // 1. Fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // 2. Get original dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const { width: originalWidth, height: originalHeight } = metadata;

    if (!originalWidth || !originalHeight) {
         throw new Error('Could not read image dimensions.');
    }
    
    let processedImageBuffer;
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    
    // Apply auto-crop if requested
    if (applyCrop) {
      // Calculate target dimensions for center crop
      const targetAspectRatio = parseAspectRatio(targetRatioString);
      const cropDimensions = calculateTargetDimensions(
          originalWidth, 
          originalHeight, 
          targetAspectRatio
      );
      
      targetWidth = cropDimensions.width;
      targetHeight = cropDimensions.height;
      
      console.log(`Original: ${originalWidth}x${originalHeight}, Target Crop: ${targetWidth}x${targetHeight}`);

      // Perform center crop
      processedImageBuffer = await sharp(imageBuffer)
        .extract({
            left: Math.floor((originalWidth - targetWidth) / 2),
            top: Math.floor((originalHeight - targetHeight) / 2),
            width: targetWidth,
            height: targetHeight
        })
        .toFormat(outputFormat, { quality: outputQuality })
        .toBuffer();
    } else {
      // Skip cropping, just convert to proper format
      console.log(`Using pre-cropped image with dimensions: ${originalWidth}x${originalHeight}`);
      processedImageBuffer = await sharp(imageBuffer)
        .toFormat(outputFormat, { quality: outputQuality })
        .toBuffer();
      
      // Use the original dimensions
      targetWidth = originalWidth;
      targetHeight = originalHeight;
    }
      
    console.log(`Image processed to ${targetWidth}x${targetHeight}`);

    // 5. Upload the processed image to Supabase Storage (use admin client)
    const fileExtension = outputFormat;
    const newFileName = `optimized-${uuidv4()}.${fileExtension}`;
    // Place optimized images at the root level instead of in an "optimized" folder
    const storagePath = `${userId}/${newFileName}`; 
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage // Use admin client here
      .from('gallery-uploads') 
      .upload(storagePath, processedImageBuffer, {
        contentType: `image/${outputFormat}`,
        upsert: false, 
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new Error(`Failed to upload optimized image: ${uploadError.message}`);
    }

    // 6. Get the public URL of the uploaded image (use admin client)
    const { data: urlData } = supabaseAdmin.storage // Use admin client here
       .from('gallery-uploads')
       .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
        console.error("Failed to get public URL for uploaded file:", storagePath);
         // Attempt cleanup? Or just report error.
         // await supabase.storage.from('gallery-uploads').remove([storagePath]); // Optional cleanup
        throw new Error("Failed to get public URL for the optimized image after upload.");
    }
    
    const publicUrl = urlData.publicUrl;
    console.log("Optimized image uploaded:", publicUrl);

    // 7. Return the public URL
    return NextResponse.json({ 
        success: true, 
        optimizedImageUrl: publicUrl,
        width: targetWidth,
        height: targetHeight
    });

  } catch (error: any) {
    console.error('[API /image/optimize] Error:', error);
    return NextResponse.json(
        { success: false, error: error.message || 'Failed to optimize image' }, 
        { status: 500 }
    );
  }
} 