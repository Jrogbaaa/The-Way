/**
 * Helper functions for handling credentials in different deployment environments
 * Particularly useful for Vercel deployment where credentials are stored as environment variables
 * 
 * For Vercel deployment:
 * 1. Base64 encode your Google credentials JSON file:
 *    cat google-credentials.json | base64
 * 2. Add the encoded string as GOOGLE_CLOUD_VISION_CREDENTIALS in Vercel environment variables
 * 
 * For local development:
 * 1. You can use either:
 *    - Set GOOGLE_APPLICATION_CREDENTIALS to the path of your JSON file
 *    - Base64 encode your credentials and set GOOGLE_CLOUD_VISION_CREDENTIALS
 */

/**
 * Decodes base64 encoded Google credentials from environment variable
 * This is used for Vercel deployment where we can't store JSON files directly
 * 
 * @returns Decoded Google Cloud credentials as object or empty object if not found
 */
export const getGoogleCredentials = (): Record<string, any> => {
  try {
    // Check if we have the encoded credentials
    if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS) {
      // Check if it's already a JSON object string
      if (process.env.GOOGLE_CLOUD_VISION_CREDENTIALS.startsWith('{')) {
        return JSON.parse(process.env.GOOGLE_CLOUD_VISION_CREDENTIALS);
      }
      
      // Decode the base64 string to get the JSON credentials
      const decodedCredentials = Buffer.from(
        process.env.GOOGLE_CLOUD_VISION_CREDENTIALS,
        'base64'
      ).toString();
      
      // Parse the decoded string to get the JSON object
      return JSON.parse(decodedCredentials);
    }
    
    // If not found, log a warning
    console.warn('Google Cloud Vision credentials not found in environment variables');
    return {};
  } catch (error) {
    console.error('Error decoding Google credentials:', error);
    return {};
  }
};

/**
 * Gets the Google project ID from environment variables or decoded credentials
 * 
 * @returns Project ID string or empty string if not found
 */
export const getGoogleProjectId = (): string => {
  // First try to get from environment variable (preferred)
  if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
    return process.env.GOOGLE_CLOUD_PROJECT_ID;
  }
  
  // If not available, try to extract from credentials
  try {
    const credentials = getGoogleCredentials();
    return credentials.project_id || '';
  } catch (error) {
    console.error('Error getting Google project ID:', error);
    return '';
  }
};

/**
 * Safely get Vertex AI location from environment variables with fallback
 * 
 * @returns Vertex AI location string (defaults to us-central1)
 */
export const getVertexAILocation = (): string => {
  return process.env.VERTEX_AI_LOCATION || 'us-central1';
};

/**
 * Check if all required Google credentials are available
 * 
 * @returns Boolean indicating if valid credentials are available
 */
export const hasValidGoogleCredentials = (): boolean => {
  return !!process.env.GOOGLE_CLOUD_VISION_CREDENTIALS && 
         (!!process.env.GOOGLE_CLOUD_PROJECT_ID || !!getGoogleCredentials().project_id);
}; 