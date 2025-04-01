'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    // Set the proxied URL when the component mounts
    setProxiedUrl(getProxiedImageUrl(imageUrl));
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [imageUrl, onClose]);

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-background rounded-lg overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-semibold">Image Preview</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
          {loading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {imageError ? (
            <div className="text-center p-4 text-red-500">
              <p>Failed to load image. The image might not be available or there could be a CORS issue.</p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-500 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open original image in new tab
                </a>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setImageError(false);
                    setLoading(true);
                    // Try using the direct URL as a fallback
                    setProxiedUrl(imageUrl);
                  }}
                >
                  Try direct URL
                </Button>
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
          <a 
            href={imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Open Original
          </a>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Image
          </Button>
        </div>
      </div>
    </div>
  );
} 