import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';

// For client-side use (safe version with no token)
export const replicateClient = {
  v1: {
    predictions: {
      create: async () => {
        throw new Error("Replicate client is not available on the client side");
      },
    },
  },
};

// For server-side use only
export function getReplicateClient() {
  // Get token from environment
  const token = process.env.REPLICATE_API_TOKEN || '';
  
  // Log status (but not the actual token)
  if (!token) {
    console.warn("REPLICATE_API_TOKEN is not set");
  } else {
    console.log("REPLICATE_API_TOKEN is configured");
  }

  return new Replicate({
    auth: token,
  });
} 