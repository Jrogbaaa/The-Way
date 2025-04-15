import axios from 'axios';
import FormData from 'form-data';
import { Buffer } from 'buffer';
import sharp from 'sharp';

/**
 * BRIA AI SDK for Next.js
 * For use with the BRIA AI REST API endpoints
 */
export class BriaClient {
  private apiKey: string;
  private baseUrl: string = 'https://engine.prod.bria-api.com/v1';

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Validates and prepares an image for API submission
   */
  private async prepareImage(imageBuffer: Buffer): Promise<Buffer> {
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 512;
    const height = metadata.height || 512;
    const totalPixels = width * height;
    
    console.log(`Original image dimensions: ${width}x${height} (${totalPixels} pixels)`);
    
    // If the image exceeds the maximum pixel count (12MB max for BRIA), resize it
    if (totalPixels > 4000000) { // ~4MP is a safe limit
      console.log(`Image too large (${width}x${height}, ${totalPixels} pixels). Resizing...`);
      
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = width / height;
      let newWidth, newHeight;
      
      if (aspectRatio > 1) {
        // Landscape orientation
        newWidth = Math.floor(Math.sqrt(4000000 * 0.95 * aspectRatio));
        newHeight = Math.floor(newWidth / aspectRatio);
      } else {
        // Portrait orientation
        newHeight = Math.floor(Math.sqrt(4000000 * 0.95 / aspectRatio));
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
   * Common method for file uploads to BRIA endpoints
   */
  private async uploadFileAndProcess(
    endpoint: string,
    imageBuffer: Buffer,
    params: Record<string, any> = {},
    useFormData: boolean = true
  ): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      let response;
      
      if (useFormData) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
        
        // Add all other parameters to form data
        for (const [key, value] of Object.entries(params)) {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        
        response = await axios.post(
          `${this.baseUrl}${endpoint}`,
          formData,
          {
            headers: {
              'api_token': this.apiKey,
              'Accept': 'application/json'
            }
          }
        );
      } else {
        // Use JSON for API endpoints that expect it
        const imageBase64 = preparedImage.toString('base64');
        
        response = await axios.post(
          `${this.baseUrl}${endpoint}`,
          {
            file: imageBase64,
            ...params
          },
          {
            headers: {
              'api_token': this.apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
      }
      
      // Handle result based on response format
      let resultUrl;
      if (response.data.result_url) {
        resultUrl = response.data.result_url;
      } else if (response.data.urls && response.data.urls.length > 0) {
        resultUrl = response.data.urls[0];
      } else if (response.data.result && response.data.result.length > 0 && response.data.result[0].length > 0) {
        resultUrl = response.data.result[0][0];
      }
      
      // Fetch the result image
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error(`BRIA API Error (${endpoint}):`, error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Removes background from an image
   */
  async removeBackground(imageBuffer: Buffer): Promise<{ data: Buffer, contentType: string }> {
    return this.uploadFileAndProcess('/background/remove', imageBuffer);
  }

  /**
   * Blurs the background of an image
   */
  async blurBackground(imageBuffer: Buffer): Promise<{ data: Buffer, contentType: string }> {
    return this.uploadFileAndProcess('/background/blur', imageBuffer);
  }

  /**
   * Replaces the background of an image with a prompted scene
   */
  async replaceBackground(imageBuffer: Buffer, prompt: string): Promise<{ data: Buffer, contentType: string }> {
    return this.uploadFileAndProcess(
      '/background/replace',
      imageBuffer,
      {
        bg_prompt: prompt,
        num_results: 1,
        sync: true
      },
      false // Use JSON format as shown in the docs
    );
  }
  
  /**
   * Erases the foreground of an image
   */
  async eraseForeground(imageBuffer: Buffer): Promise<{ data: Buffer, contentType: string }> {
    return this.uploadFileAndProcess('/erase_foreground', imageBuffer);
  }

  /**
   * Increases the resolution of an image
   */
  async increaseResolution(imageBuffer: Buffer): Promise<{ data: Buffer, contentType: string }> {
    return this.uploadFileAndProcess('/image/increase_resolution', imageBuffer);
  }

  /**
   * Expands an image (outpainting)
   */
  async expandImage(imageBuffer: Buffer, direction: string, prompt?: string): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('direction', direction); // Ensure direction is correctly passed
      
      // Add prompt if provided
      if (prompt && prompt.trim() !== '') {
        formData.append('prompt', prompt);
      }
      
      // Add other required parameters
      formData.append('num_results', '1');
      formData.append('sync', 'true');
      
      const response = await axios.post(
        `${this.baseUrl}/image_expansion`,
        formData,
        {
          headers: {
            'api_token': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );
      
      // Get the result image from the URL
      let resultUrl = '';
      if (response.data.result_url) {
        resultUrl = response.data.result_url;
      } else if (response.data.urls && response.data.urls.length > 0) {
        resultUrl = response.data.urls[0];
      }
      
      if (!resultUrl) {
        throw new Error('No result URL found in the response');
      }
      
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Expand Image API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Erases content from an image based on a mask
   */
  async erase(imageBuffer: Buffer, maskBuffer: Buffer): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      const preparedMask = await this.prepareImage(maskBuffer);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('mask_file', preparedMask, { filename: 'mask.jpg', contentType: 'image/jpeg' });
      formData.append('mask_type', 'manual');
      
      const response = await axios.post(
        `${this.baseUrl}/eraser`,
        formData,
        {
          headers: {
            'api_token': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );
      
      // Get the result image from the URL
      const resultUrl = response.data.result_url;
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Erase API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * General image edit functionality using generative fill
   */
  async editImage(imageBuffer: Buffer, maskBuffer: Buffer, prompt: string): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      const preparedMask = await this.prepareImage(maskBuffer);
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('mask_file', preparedMask, { filename: 'mask.jpg', contentType: 'image/jpeg' });
      formData.append('mask_type', 'manual');
      formData.append('prompt', prompt);
      formData.append('num_results', '1');
      formData.append('sync', 'true');
      
      const response = await axios.post(
        `${this.baseUrl}/gen_fill`,
        formData,
        {
          headers: {
            'api_token': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );
      
      // Get the result image from the URL
      const resultUrl = response.data.urls[0];
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Edit Image API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Search and replace objects in an image (using gen_fill)
   */
  async searchReplace(imageBuffer: Buffer, searchText: string, replaceText: string): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      
      // Create a prompt that describes the replacement operation
      const prompt = `Replace ${searchText} with ${replaceText}. The image should show ${replaceText} instead of ${searchText}.`;
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('prompt', prompt);
      formData.append('num_results', '1');
      formData.append('sync', 'true');
      
      // Use the gen_fill endpoint with a special prompt for search & replace
      const response = await axios.post(
        `${this.baseUrl}/gen_fill`,
        formData,
        {
          headers: {
            'api_token': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );
      
      // Get the result image from the URL
      const resultUrl = response.data.urls[0];
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Search Replace API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Recolor objects in an image (using gen_fill)
   */
  async recolor(imageBuffer: Buffer, objectName: string, targetColor: string): Promise<{ data: Buffer, contentType: string }> {
    try {
      const preparedImage = await this.prepareImage(imageBuffer);
      
      // Create a prompt that describes the recolor operation
      const prompt = `Change the color of the ${objectName} to ${targetColor}. Make sure only the ${objectName} changes to ${targetColor} while preserving the rest of the image.`;
      
      // Create form data for API request
      const formData = new FormData();
      formData.append('file', preparedImage, { filename: 'image.jpg', contentType: 'image/jpeg' });
      formData.append('prompt', prompt);
      formData.append('num_results', '1');
      formData.append('sync', 'true');
      
      // Use the gen_fill endpoint with a special prompt for recoloring
      const response = await axios.post(
        `${this.baseUrl}/gen_fill`,
        formData,
        {
          headers: {
            'api_token': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );
      
      // Get the result image from the URL
      const resultUrl = response.data.urls[0];
      const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      
      return {
        data: Buffer.from(imageResponse.data),
        contentType: imageResponse.headers['content-type'] || 'image/png'
      };
    } catch (error: any) {
      console.error('Recolor API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Outpaint an image in the specified directions
   * @param imageBuffer The original image buffer
   * @param directions Array of directions to expand ('left', 'right', 'top', 'bottom')
   * @param prompt Optional prompt to guide the expansion
   * @param options Additional options for the outpainting
   */
  async outpaint(
    imageBuffer: Buffer, 
    directions: string[],
    prompt?: string,
    options: {
      cfgScale?: number;
      steps?: number;
      stylePreset?: string;
    } = {}
  ): Promise<{ data: Buffer, contentType: string }> {
    try {
      // Process each direction sequentially
      let currentImageBuffer = await this.prepareImage(imageBuffer);
      
      // Process one direction at a time
      for (const direction of directions) {
        console.log(`Processing outpaint in direction: ${direction}`);
        
        // Create form data for API request
        const formData = new FormData();
        formData.append('file', currentImageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        formData.append('direction', direction);
        
        // Add prompt if provided
        if (prompt && prompt.trim() !== '') {
          formData.append('prompt', prompt);
        }
        
        // Add other required parameters
        formData.append('num_results', '1');
        formData.append('sync', 'true');
        
        const response = await axios.post(
          `${this.baseUrl}/image_expansion`,
          formData,
          {
            headers: {
              'api_token': this.apiKey,
              'Accept': 'application/json'
            }
          }
        );
        
        // Get the result image from the URL
        let resultUrl = '';
        if (response.data.result_url) {
          resultUrl = response.data.result_url;
        } else if (response.data.urls && response.data.urls.length > 0) {
          resultUrl = response.data.urls[0];
        }
        
        if (!resultUrl) {
          throw new Error(`No result URL found in the response for direction: ${direction}`);
        }
        
        // Fetch the result image and use it for the next iteration
        const imageResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
        currentImageBuffer = Buffer.from(imageResponse.data);
      }
      
      // After processing all directions, return the final result
      return {
        data: currentImageBuffer,
        contentType: 'image/png'
      };
    } catch (error: any) {
      console.error('Outpaint API Error:', error);
      
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      
      throw error;
    }
  }
}

export default BriaClient; 