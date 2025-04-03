'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/utils';
import { AlertCircle, ImageIcon, RefreshCw } from 'lucide-react';

interface ImageDisplayProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackText?: string;
  showPlaceholder?: boolean;
  onClick?: () => void;
}

export function ImageDisplay({
  src,
  alt = 'Generated image',
  width = 512,
  height = 512,
  className = '',
  fallbackText = 'Image failed to load',
  showPlaceholder = true,
  onClick
}: ImageDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proxiedSrc, setProxiedSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [useDirectUrl, setUseDirectUrl] = useState(false);
  
  // Get the proxied URL when the component mounts or src changes
  useEffect(() => {
    if (!src) {
      setError('No image source provided');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Processing image source:', typeof src, src);
      const url = useDirectUrl ? src : getProxiedImageUrl(src);
      
      if (!url) {
        setError('Failed to generate proxied URL');
        setLoading(false);
        return;
      }
      
      setProxiedSrc(url);
      setLoading(true);
      setError(null);
    } catch (err) {
      console.error('Error setting up image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [src, useDirectUrl, retryCount]);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };
  
  const toggleUrlMode = () => {
    setUseDirectUrl(prev => !prev);
  };

  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    console.error('Image failed to load:', proxiedSrc);
    setError('Failed to load image');
    setLoading(false);
  };
  
  // If we don't have a source, show placeholder
  if (!src && showPlaceholder) {
    return (
      <div className="relative flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg overflow-hidden" 
           style={{ width: width || '100%', height: height || 'auto', minHeight: '200px' }}>
        <div className="flex flex-col items-center justify-center p-4 text-center text-gray-500">
          <ImageIcon className="w-12 h-12 mb-2 text-gray-400" />
          <p>No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ width: width || '100%', height: height || 'auto', minHeight: '200px' }}
    >
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600 mt-2">Loading image...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 border border-red-100 rounded-lg p-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-600 font-medium mb-1">{fallbackText}</p>
          <p className="text-gray-600 text-sm mb-3">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <button 
              onClick={handleRetry} 
              className="flex items-center justify-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry ({retryCount})
            </button>
            
            <button 
              onClick={toggleUrlMode} 
              className="flex items-center justify-center px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {useDirectUrl ? 'Try with proxy' : 'Try direct URL'}
            </button>
          </div>
          
          {src && typeof src === 'string' && (
            <div className="mt-4 w-full max-w-xs overflow-hidden">
              <p className="text-xs text-gray-500 truncate">Source: {src.slice(0, 50)}...</p>
            </div>
          )}
        </div>
      )}

      {/* Actual Image */}
      {proxiedSrc && (
        <Image
          src={proxiedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`rounded-lg ${loading || error ? 'invisible' : 'visible'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ objectFit: 'cover', cursor: onClick ? 'pointer' : 'default' }}
          unoptimized={useDirectUrl} // Skip Next.js image optimization for direct URLs
          onClick={onClick}
        />
      )}
    </div>
  );
} 