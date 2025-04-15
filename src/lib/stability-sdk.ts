import axios from 'axios';
import FormData from 'form-data';
import { Buffer } from 'buffer';
import sharp from 'sharp';

/**
 * Stability AI SDK for Next.js
 * For use with the Stability AI REST API v2beta endpoints
 */
export class StabilityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.stability.ai';

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Validates and prepares an image for API submission
   * Handles resizing if the image exceeds the 1,048,576 pixel limit
   */
  private async prepareImage(imageBuffer: Buffer): Promise<Buffer> {
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 512;
    const height = metadata.height || 512;
    const totalPixels = width * height;
    
    console.log(`Original image dimensions: ${width}x${height} (${totalPixels} pixels)`);
    
    // If the image exceeds the maximum pixel count, resize it
    if (totalPixels > 1048576) {
      console.log(`Image too large (${width}x${height}, ${totalPixels} pixels). Resizing...`);
      
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = width / height;
      let newWidth, newHeight;
      
      if (aspectRatio > 1) {
        // Landscape orientation
        newWidth = Math.floor(Math.sqrt(1048576 * 0.95 * aspectRatio));
        newHeight = Math.floor(newWidth / aspectRatio);
      } else {
        // Portrait orientation
        newHeight = Math.floor(Math.sqrt(1048576 * 0.95 / aspectRatio));
        newWidth = Math.floor(newHeight * aspectRatio);
      }
      
      console.log(`Resizing to ${newWidth}x${newHeight} (${newWidth * newHeight} pixels)`);
      
      // Perform the resize
      return await sharp(imageBuffer)
        .resize(newWidth, newHeight)
        .toBuffer();
    }
    
    return imageBuffer;
  }

  /**
   * Text-to-image generation
   */
  async textToImage(prompt: string, options: {
    height?: number;
    width?: number;
    cfgScale?: number;
    samples?: number;
    steps?: number;
    stylePreset?: string;
    engine?: string;
  } = {}) {
    const {
      height = 1024,
      width = 1024,
      cfgScale = 7.5,
      samples = 1,
      steps = 30,
      stylePreset = 'photographic',
      engine = 'stable-diffusion-xl-1024-v1-0'
    } = options;

    const formData = new FormData();
    
    // Add text prompts
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', '1');
    
    // Add negative prompt with weight -1
    formData.append('text_prompts[1][text]', 'blurry, distorted, low quality, low resolution, artifacts');
    formData.append('text_prompts[1][weight]', '-1');
    
    // Add other parameters
    formData.append('cfg_scale', cfgScale.toString());
    formData.append('height', height.toString());
    formData.append('width', width.toString());
    formData.append('samples', samples.toString());
    formData.append('steps', steps.toString());
    
    if (stylePreset) {
      formData.append('style_preset', stylePreset);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2beta/image/edit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            ...formData.getHeaders()
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Text-to-Image API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Outpaint an image in the specified directions
   */
  async outpaint(imageBuffer: Buffer, directions: string[], prompt?: string, options: {
    cfgScale?: number;
    steps?: number;
    stylePreset?: string;
  } = {}) {
    const {
      cfgScale = 7.5,
      steps = 30,
      stylePreset = 'photographic'
    } = options;
    
    try {
      // Process each direction sequentially
      let currentImageBuffer = await this.prepareImage(imageBuffer);
      
      // Process one direction at a time
      for (const direction of directions) {
        // Get dimensions of current image
        const metadata = await sharp(currentImageBuffer).metadata();
        const width = metadata.width || 512;
        const height = metadata.height || 512;
        
        // Calculate new canvas dimensions and positioning
        const expandBy = 0.5; // Expand by 50%
        let newWidth = width;
        let newHeight = height;
        let placementLeft = 0;
        let placementTop = 0;
        
        // Expand canvas by 50% in the specified direction
        if (direction === 'left' || direction === 'right') {
          const expansionWidth = Math.round(width * expandBy);
          newWidth = width + expansionWidth;
          if (direction === 'left') {
            placementLeft = expansionWidth;
          }
        } else { // top or bottom
          const expansionHeight = Math.round(height * expandBy);
          newHeight = height + expansionHeight;
          if (direction === 'top') {
            placementTop = expansionHeight;
          }
        }
        
        console.log(`Expanding ${direction} from ${width}x${height} to ${newWidth}x${newHeight}`);
        
        // Create an extended canvas with transparent background
        const canvas = sharp({
          create: {
            width: newWidth,
            height: newHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        });
        
        // Place the original image on the extended canvas
        const compositeImage = await canvas.composite([{
          input: currentImageBuffer,
          left: placementLeft,
          top: placementTop
        }]).png().toBuffer();
        
        // Create a mask that marks the new areas as white (to be edited)
        // and existing content as black (to be preserved)
        const maskCanvas = sharp({
          create: {
            width: newWidth,
            height: newHeight,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 255 } // Start with all white
          }
        });
        
        // Create a black rectangle for the existing image area
        const blackRect = await sharp({
          create: {
            width: width,
            height: height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 255 } // Black
          }
        }).png().toBuffer();
        
        // Compose the mask with a black rectangle where the original image is
        const maskBuffer = await maskCanvas.composite([{
          input: blackRect,
          left: placementLeft,
          top: placementTop
        }]).png().toBuffer();
        
        // Prepare API request
        const formData = new FormData();
        
        // Add image and mask as blobs
        formData.append('init_image', Buffer.from(compositeImage), { filename: 'image.png', contentType: 'image/png' });
        formData.append('mask_image', Buffer.from(maskBuffer), { filename: 'mask.png', contentType: 'image/png' });
        formData.append('mask_source', 'MASK_IMAGE_WHITE');
        
        // Enhanced prompt for the direction
        const directionTerms: Record<string, string> = {
          'left': 'to the left side',
          'right': 'to the right side',
          'top': 'above',
          'bottom': 'below'
        };
        
        const defaultPrompts: Record<string, string> = {
          'left': 'extend the scene to the left with matching landscape, continuing the existing elements smoothly',
          'right': 'extend the scene to the right with matching landscape, continuing the existing elements smoothly',
          'top': 'extend the scene upward with matching sky, clouds, and atmosphere, keeping the same lighting conditions',
          'bottom': 'extend the scene downward with natural landscape elements like grass, rocks, flowing river, pine trees, and appropriate foreground that matches the terrain'
        };
        
        const enhancedPrompt = prompt || defaultPrompts[direction];
        
        formData.append('text_prompts[0][text]', enhancedPrompt);
        formData.append('text_prompts[0][weight]', '1');
        
        // Add negative prompt to avoid artifacts
        formData.append('text_prompts[1][text]', 'blurry, distorted, low quality, low resolution, artifacts, unrealistic, deformed, line, border, weird edges');
        formData.append('text_prompts[1][weight]', '-1');
        
        // Add other parameters
        formData.append('cfg_scale', cfgScale.toString());
        formData.append('steps', steps.toString());
        formData.append('samples', '1');
        
        if (stylePreset) {
          formData.append('style_preset', stylePreset);
        }
        
        // Use the standard image-to-image endpoint with inpainting capabilities
        const response = await axios.post(
          `${this.baseUrl}/v1/generation/stable-inpainting`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Accept': 'application/json',
              ...formData.getHeaders()
            }
          }
        );
        
        // Check if we have images in the response
        if (response.data && response.data.artifacts && response.data.artifacts.length > 0) {
          // Get the first image result
          const artifact = response.data.artifacts[0];
          // Convert the base64 data to a buffer
          currentImageBuffer = Buffer.from(artifact.base64, 'base64');
        } else {
          throw new Error('No image data in API response');
        }
      }
      
      return { 
        data: currentImageBuffer, 
        contentType: 'image/png'
      };
    } catch (error: any) {
      console.error('Outpaint API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        try {
          const errorText = Buffer.from(error.response.data).toString('utf8');
          console.error('Error Data:', errorText);
        } catch (e) {
          console.error('Error Data (binary):', error.response.data);
        }
      }
      
      throw error;
    }
  }

  /**
   * Perform search and replace on an image
   */
  async searchReplace(imageBuffer: Buffer, searchText: string, replaceText: string, options: {
    cfgScale?: number;
    steps?: number;
    stylePreset?: string;
  } = {}) {
    const {
      cfgScale = 7.5,
      steps = 30,
      stylePreset = 'photographic'
    } = options;
    
    try {
      // Prepare the image (resize if needed)
      const preparedImage = await this.prepareImage(imageBuffer);
      
      // Prepare API request
      const formData = new FormData();
      
      // Add the image
      formData.append('image', Buffer.from(preparedImage), { filename: 'image.png', contentType: 'image/png' });
      
      // Create a prompt that tells the AI to replace the target with the replacement
      const enhancedPrompt = `Replace ${searchText} with ${replaceText}. The image should now contain ${replaceText} instead of ${searchText}.`;
      formData.append('text_prompts[0][text]', enhancedPrompt);
      formData.append('text_prompts[0][weight]', '1');
      
      // Add negative prompt to avoid artifacts
      formData.append('text_prompts[1][text]', 'blurry, distorted, low quality, low resolution, artifacts, watermark');
      formData.append('text_prompts[1][weight]', '-1');
      
      // Add other parameters
      formData.append('cfg_scale', cfgScale.toString());
      formData.append('steps', steps.toString());
      formData.append('samples', '1');
      
      if (stylePreset) {
        formData.append('style_preset', stylePreset);
      }
      
      // Use the edit endpoint
      const response = await axios.post(
        `${this.baseUrl}/v2beta/image/edit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            ...formData.getHeaders()
          },
          responseType: 'arraybuffer'
        }
      );
      
      return { 
        data: Buffer.from(response.data), 
        contentType: 'image/png'
      };
    } catch (error: any) {
      console.error('Search/Replace API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        try {
          const errorText = Buffer.from(error.response.data).toString('utf8');
          console.error('Error Data:', errorText);
        } catch (e) {
          console.error('Error Data (binary):', error.response.data);
        }
      }
      
      throw error;
    }
  }

  /**
   * Recolor specific items in an image
   */
  async recolor(imageBuffer: Buffer, objectToRecolor: string, targetColor: string, options: {
    cfgScale?: number;
    steps?: number;
    stylePreset?: string;
  } = {}) {
    const {
      cfgScale = 7.5,
      steps = 30,
      stylePreset = 'photographic'
    } = options;
    
    try {
      // Prepare the image (resize if needed)
      const preparedImage = await this.prepareImage(imageBuffer);
      
      // Prepare API request
      const formData = new FormData();
      
      // Add the image
      formData.append('image', Buffer.from(preparedImage), { filename: 'image.png', contentType: 'image/png' });
      
      // Create a prompt that tells the AI to recolor the target to the desired color
      const enhancedPrompt = `Change the color of the ${objectToRecolor} to ${targetColor}. The ${objectToRecolor} should be ${targetColor} in color.`;
      formData.append('text_prompts[0][text]', enhancedPrompt);
      formData.append('text_prompts[0][weight]', '1');
      
      // Add negative prompt to avoid artifacts
      formData.append('text_prompts[1][text]', 'blurry, distorted, low quality, low resolution, artifacts, watermark, wrong colors');
      formData.append('text_prompts[1][weight]', '-1');
      
      // Add other parameters
      formData.append('cfg_scale', cfgScale.toString());
      formData.append('steps', steps.toString());
      formData.append('samples', '1');
      
      if (stylePreset) {
        formData.append('style_preset', stylePreset);
      }
      
      // Use the edit endpoint
      const response = await axios.post(
        `${this.baseUrl}/v2beta/image/edit`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json',
            ...formData.getHeaders()
          },
          responseType: 'arraybuffer'
        }
      );
      
      return { 
        data: Buffer.from(response.data), 
        contentType: 'image/png'
      };
    } catch (error: any) {
      console.error('Recolor API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        try {
          const errorText = Buffer.from(error.response.data).toString('utf8');
          console.error('Error Data:', errorText);
        } catch (e) {
          console.error('Error Data (binary):', error.response.data);
        }
      }
      
      throw error;
    }
  }
}

// Export a singleton instance
export default StabilityClient; 