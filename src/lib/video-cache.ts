import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';
import fetch from 'node-fetch';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'public', 'video-cache');

/**
 * Ensures the cache directory exists
 */
export const ensureCacheDir = async (): Promise<void> => {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      await mkdir(CACHE_DIR, { recursive: true });
      console.log(`Created video cache directory at ${CACHE_DIR}`);
    }
  } catch (error) {
    console.error('Error creating cache directory:', error);
    throw error;
  }
};

/**
 * Generates a unique filename for the video based on the URL
 */
export const generateCacheFilename = (url: string): string => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  return `${hash}.mp4`;
};

/**
 * Downloads a video from a URL and caches it
 * Returns the public URL for the cached video
 */
export const downloadAndCacheVideo = async (url: string): Promise<string> => {
  if (!url) throw new Error('No URL provided for video download');
  
  await ensureCacheDir();
  
  const filename = generateCacheFilename(url);
  const filePath = path.join(CACHE_DIR, filename);
  const publicPath = `/video-cache/${filename}`;
  
  // Check if file already exists in cache
  if (fs.existsSync(filePath)) {
    console.log(`Video already cached at ${filePath}`);
    return publicPath;
  }
  
  try {
    console.log(`Downloading video from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Video cached successfully at ${filePath}`);
    return publicPath;
  } catch (error) {
    console.error('Error downloading and caching video:', error);
    throw error;
  }
}; 