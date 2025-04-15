import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';

// Create a client-side instance with empty auth that will be configured in API routes
export const replicateClient = new Replicate({
  auth: ''
});

// If REPLICATE_API_TOKEN is not set, use this hardcoded token as fallback
const FALLBACK_TOKEN = 'r8_H7A15ebpGoc5vXVn76lgmF14IQZmR5c3tNd93';

/**
 * Returns a configured Replicate client for server-side use
 */
export const getReplicateClient = async () => {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.warn('REPLICATE_API_TOKEN is not set.');
    return null;
  }
  
  try {
    // Initialize with environment variable or fallback to the hardcoded token
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN || FALLBACK_TOKEN
    });
    
    return replicate;
  } catch (error) {
    console.error('Error creating Replicate client:', error);
    return null;
  }
}; 