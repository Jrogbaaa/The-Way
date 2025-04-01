import vision from '@google-cloud/vision';
import { API_CONFIG } from '../config';

// Create a client with the provided credentials
const createClient = () => {
  try {
    // For server-side usage only
    if (typeof window === 'undefined') {
      const credentials = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
      
      if (!credentials) {
        throw new Error('Google Cloud Vision credentials not found');
      }
      
      // Credentials can be either a JSON string or a path to a JSON file
      const parsedCredentials = 
        credentials.startsWith('{') 
          ? JSON.parse(credentials) 
          : credentials;
      
      return new vision.ImageAnnotatorClient({
        credentials: parsedCredentials,
      });
    }
    throw new Error('Google Cloud Vision client can only be created server-side');
  } catch (error) {
    console.error('Error creating Vision client:', error);
    throw error;
  }
};

/**
 * Analyze image and detect labels (objects, concepts)
 */
export const detectLabels = async (imageBuffer: Buffer) => {
  try {
    const client = createClient();
    const [result] = await client.labelDetection(imageBuffer);
    const labels = result.labelAnnotations;
    return labels;
  } catch (error) {
    console.error('Error detecting labels:', error);
    throw error;
  }
};

/**
 * Detect faces in an image
 */
export const detectFaces = async (imageBuffer: Buffer) => {
  try {
    const client = createClient();
    const [result] = await client.faceDetection(imageBuffer);
    const faces = result.faceAnnotations;
    return faces;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
};

/**
 * Detect text in an image (OCR)
 */
export const detectText = async (imageBuffer: Buffer) => {
  try {
    const client = createClient();
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    return detections;
  } catch (error) {
    console.error('Error detecting text:', error);
    throw error;
  }
};

/**
 * Detect landmarks in an image
 */
export const detectLandmarks = async (imageBuffer: Buffer) => {
  try {
    const client = createClient();
    const [result] = await client.landmarkDetection(imageBuffer);
    const landmarks = result.landmarkAnnotations;
    return landmarks;
  } catch (error) {
    console.error('Error detecting landmarks:', error);
    throw error;
  }
};

/**
 * Detect explicit content in an image
 */
export const detectExplicitContent = async (imageBuffer: Buffer) => {
  try {
    const client = createClient();
    const [result] = await client.safeSearchDetection(imageBuffer);
    const safeSearch = result.safeSearchAnnotation;
    return safeSearch;
  } catch (error) {
    console.error('Error detecting explicit content:', error);
    throw error;
  }
};

// Analyze video (using Video Intelligence API should be implemented separately)

export default {
  detectLabels,
  detectFaces,
  detectText,
  detectLandmarks,
  detectExplicitContent,
}; 