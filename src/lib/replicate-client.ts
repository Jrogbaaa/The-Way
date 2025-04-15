import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';

// For client-side use
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
  if (!API_CONFIG.replicateApiToken) {
    console.warn("REPLICATE_API_TOKEN is not set");
  }

  return new Replicate({
    auth: API_CONFIG.replicateApiToken || "",
  });
} 