import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind utilities
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Converts an external image URL to use our proxy API to avoid CORS issues
 */
export function getProxiedImageUrl(url: string | unknown): string {
  // Handle non-string values
  if (!url || typeof url !== 'string') {
    console.warn('Invalid URL provided to getProxiedImageUrl:', url);
    return '';
  }
  
  // Don't proxy URLs that are already on our domain
  if (url.startsWith('/') || url.startsWith(window.location.origin)) {
    return url;
  }
  
  // Encode the URL to ensure it's properly passed as a query parameter
  const encodedUrl = encodeURIComponent(url);
  return `/api/proxy?url=${encodedUrl}`;
}

/**
 * Gets a persistent URL for a Replicate image
 * This handles the fact that Replicate image URLs expire after 1 hour
 * 
 * On the server, this function should fetch the image and store it somewhere persistent
 * On the client, this function should get a proxied URL that won't have CORS issues
 */
export async function getPersistentImageUrl(url: string, options?: { 
  store?: boolean,
  storageKey?: string
}): Promise<string> {
  // On the client side, simply proxy the URL
  if (typeof window !== 'undefined') {
    return getProxiedImageUrl(url);
  }
  
  // On the server side with store option, we could implement logic
  // to store the image in a database or file system
  if (options?.store) {
    // This would be implementation specific to your storage solution
    // Example implementation would fetch the image and upload to a storage service
    
    // For now, we'll just return the original URL
    console.log('Storage of images not yet implemented, returning original URL');
    return url;
  }
  
  // Default to returning the original URL on the server
  return url;
}
