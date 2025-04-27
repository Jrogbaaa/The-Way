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
  if (!url) {
    console.warn('Invalid URL provided to getProxiedImageUrl: empty or null value');
    return '';
  }
  
  // Special handling for object URLs that were incorrectly serialized
  if (typeof url === 'object') {
    console.error('Object provided instead of URL string:', JSON.stringify(url));
    
    // Try to extract a URL if it's in a common response format
    if (url && typeof url === 'object') {
      // Check for common URL fields in API responses
      const possibleUrlFields = ['url', 'image_path', 'output', 'image'];
      for (const field of possibleUrlFields) {
        // Use safe property access with Record<string, unknown> type
        const urlObj = url as Record<string, unknown>;
        if (urlObj[field] && typeof urlObj[field] === 'string') {
          console.log(`Found URL in object field '${field}':`, urlObj[field]);
          return getProxiedImageUrl(urlObj[field] as string);
        }
      }
      
      // Check for array output (common in Replicate responses)
      if (Array.isArray(url) && url.length > 0 && typeof url[0] === 'string') {
        console.log('Found URL in array:', url[0]);
        return getProxiedImageUrl(url[0]);
      }
    }
    
    console.warn('Unable to extract valid URL from object');
    return '';
  }
  
  if (typeof url !== 'string') {
    console.warn('Invalid URL type provided to getProxiedImageUrl:', typeof url);
    return '';
  }
  
  // Don't proxy URLs that are already on our domain
  if (url.startsWith('/') || (typeof window !== 'undefined' && url.startsWith(window.location.origin))) {
    return url;
  }
  
  // Don't proxy data URLs
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Validate the URL before proxying
  try {
    // This will throw if the URL is malformed
    new URL(url);
  } catch (error) {
    console.error('Invalid URL format:', url, error);
    return '';
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

/**
 * Check if the code is running in a browser environment
 */
export const isBrowser = () => typeof window !== 'undefined';
