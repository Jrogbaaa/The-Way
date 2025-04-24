import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient, createAdminClient } from '@/lib/supabase/server'; // Import both client creators
import { v4 as uuidv4 } from 'uuid';

interface OptimizeRequestBody {
  imageUrl: string;
  targetAspectRatio: '9:16' | '1:1' | '4:5'; // Extend as needed
  outputFormat?: 'jpeg' | 'png' | 'webp';
  outputQuality?: number;
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
  // Create a client instance scoped to this request to read cookies
  const supabase = await createClient();
  
  // Get user session from the request cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('Optimize API: Auth error or no user', authError);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Create an admin client specifically for storage operations (bypasses RLS)
  const supabaseAdmin = createAdminClient();

  try {
    const { 
        imageUrl, 
        targetAspectRatio: targetRatioString, 
        outputFormat = 'webp', // Default to webp
        outputQuality = 80 // Default quality
    } = await req.json() as OptimizeRequestBody;

    if (!imageUrl || !targetRatioString) {
      return NextResponse.json({ success: false, error: 'Missing imageUrl or targetAspectRatio' }, { status: 400 });
    }

    console.log(`Optimizing image: ${imageUrl} for user ${user.id} to aspect ratio ${targetRatioString}`);

    const targetAspectRatio = parseAspectRatio(targetRatioString);

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
    
    // 3. Calculate target dimensions for center crop
    const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
        originalWidth, 
        originalHeight, 
        targetAspectRatio
    );
    
    console.log(`Original: ${originalWidth}x${originalHeight}, Target Crop: ${targetWidth}x${targetHeight}`);

    // 4. Perform center crop and resize (optional resize step removed for now, just cropping)
    const processedImageBuffer = await sharp(imageBuffer)
      .extract({
          left: Math.floor((originalWidth - targetWidth) / 2),
          top: Math.floor((originalHeight - targetHeight) / 2),
          width: targetWidth,
          height: targetHeight
      })
      .toFormat(outputFormat, { quality: outputQuality })
      .toBuffer();
      
    console.log(`Image processed to ${targetWidth}x${targetHeight}`);

    // 5. Upload the processed image to Supabase Storage (use admin client)
    const fileExtension = outputFormat;
    const newFileName = `optimized-${uuidv4()}.${fileExtension}`;
    const storagePath = `${user.id}/optimized/${newFileName}`; 
    
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