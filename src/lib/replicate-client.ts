import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';

// Default token for builds - will be overridden by environment variable in production
// Using this here makes it easier for local development without compromising security
const DEFAULT_TOKEN = 'r8_W6YHRCBleZjPLLmfyrQiWseStHtumUo4TBMzb';

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
  // Get token from environment or use default (only for build/development)
  const token = process.env.REPLICATE_API_TOKEN || DEFAULT_TOKEN;
  
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