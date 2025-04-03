'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ imageUrl, alt, onClose }: ImageModalProps) {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [proxiedUrl, setProxiedUrl] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [directUrlMode, setDirectUrlMode] = useState(false);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Set the proxied URL when the component mounts
    if (imageUrl) {
      setProxiedUrl(directUrlMode ? imageUrl : getProxiedImageUrl(imageUrl));
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [imageUrl, onClose, directUrlMode]);

  // Retry loading the image with a new URL when retryCount changes
  useEffect(() => {
    if (retryCount > 0) {
      setLoading(true);
      setImageError(false);
      // Add a cache-busting parameter to force a fresh request
      const cacheBuster = `?retry=${retryCount}-${Date.now()}`;
      setProxiedUrl(directUrlMode 
        ? `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cb=${Date.now()}` 
        : getProxiedImageUrl(`${imageUrl}${cacheBuster}`));
    }
  }, [retryCount, imageUrl, directUrlMode]);

  // Handle downloading the image
  const handleDownload = async () => {
    try {
      // Use original URL for download to preserve original filename
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use a default
      const filename = imageUrl.split('/').pop() || 'generated-image.png';
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleImageError = () => {
    console.error('Failed to load image:', proxiedUrl);
    setImageError(true);
    setLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const toggleUrlMode = () => {
    setDirectUrlMode(prev => !prev);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium truncate flex-1">{alt}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] bg-gray-50 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {imageError ? (
            <div className="text-center p-6 bg-red-50 border border-red-100 rounded-lg max-w-md">
              <div className="text-red-500 font-medium text-lg mb-3">Image Loading Error</div>
              <p className="text-gray-700 mb-4">The image from Replicate could not be loaded. This could be due to:</p>
              <ul className="text-left text-gray-600 mb-4 space-y-1 list-disc pl-5">
                <li>The image is still being generated</li>
                <li>The image URL has expired</li>
                <li>Network or CORS restrictions</li>
                <li>The image was deleted or is unavailable</li>
              </ul>
              
              <div className="flex flex-col gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry ({retryCount})
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={toggleUrlMode}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {directUrlMode ? 'Try with proxy' : 'Try direct URL'}
                </Button>
                
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline mt-2 inline-block"
                >
                  Open original URL in new tab
                </a>
              </div>
            </div>
          ) : (
            <img 
              src={proxiedUrl} 
              alt={alt} 
              className="max-w-full max-h-[calc(90vh-120px)] object-contain"
              onLoad={() => setLoading(false)}
              onError={handleImageError}
            />
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={handleRetry} 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <a 
            href={imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Open Original
          </a>
          <Button 
            onClick={handleDownload} 
            className="flex items-center gap-2"
            disabled={loading || imageError}
          >
            <Download className="h-4 w-4" />
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
} 