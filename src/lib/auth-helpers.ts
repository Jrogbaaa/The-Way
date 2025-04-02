/**
 * Google Authentication Helpers
 * Utilities for managing Google API authentication
 */

import fs from 'fs';
import path from 'path';
import { getGoogleProjectId } from './credentials';

/**
 * Explicitly sets up Google authentication environment
 * This handles common authentication issues with Google Cloud APIs
 */
export const setupGoogleAuth = () => {
  try {
    // Check if we're in a browser context
    if (typeof window !== 'undefined') {
      console.warn('Google authentication cannot be set up in browser context');
      return false;
    }

    // Get the credentials path from environment variable
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    // If no credentials path is set, we can't proceed
    if (!credentialsPath) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
      return false;
    }
    
    // Make sure the credentials file exists
    const absolutePath = path.isAbsolute(credentialsPath) 
      ? credentialsPath 
      : path.join(process.cwd(), credentialsPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(`Credentials file not found at: ${absolutePath}`);
      return false;
    }
    
    // Read in the credentials JSON directly
    try {
      const credentialsJson = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
      
      // Create a temporary credentials file without spaces in the path
      const tempDir = path.join(process.cwd(), '.temp');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempPath = path.join(tempDir, 'google-credentials-temp.json');
      
      // Write credentials to temp file
      fs.writeFileSync(tempPath, JSON.stringify(credentialsJson, null, 2));
      
      // Set the environment variable to use this path instead
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
      
      console.log('Created temporary credentials file at:', tempPath);
    } catch (error) {
      console.error('Error creating temporary credentials file:', error);
      // Fall back to original path
      process.env.GOOGLE_APPLICATION_CREDENTIALS = absolutePath;
    }
    
    // Make sure project ID is set
    const projectId = getGoogleProjectId();
    if (!projectId) {
      console.error('Google project ID not found');
      return false;
    }
    
    console.log('Google authentication setup complete');
    console.log('Project ID:', projectId);
    
    return true;
  } catch (error) {
    console.error('Error setting up Google authentication:', error);
    return false;
  }
};

/**
 * Verifies that Google authentication is working by checking credentials file
 */
export const verifyGoogleAuth = () => {
  try {
    // Check if we're in a browser context
    if (typeof window !== 'undefined') {
      return false;
    }
    
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) return false;
    
    const absolutePath = path.isAbsolute(credentialsPath) 
      ? credentialsPath 
      : path.join(process.cwd(), credentialsPath);
    
    if (!fs.existsSync(absolutePath)) return false;
    
    // Try to read and parse the credentials file
    const credentials = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    
    // Verify it's a service account key file and return the client email for debugging
    return credentials && 
           credentials.type === 'service_account' && 
           credentials.project_id && 
           credentials.client_email ? 
           credentials.client_email : false;
  } catch (error) {
    console.error('Error verifying Google authentication:', error);
    return false;
  }
}; 