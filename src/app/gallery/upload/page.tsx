'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import GalleryUpload from '@/components/gallery/GalleryUpload';
import { Button } from '@/components/ui/button';
import { FolderIcon, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { ROUTES } from '@/lib/config';
import { toast } from 'react-hot-toast';

export default function GalleryUploadPage() {
  const [uploadPathPrefix, setUploadPathPrefix] = useState('');
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session) {
      toast.error('Please sign in to access the gallery.');
      router.push(ROUTES.login);
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const prefix = params.get('prefix') || '';
    setUploadPathPrefix(prefix);
    
    setIsLoading(false);
  }, [session, authLoading, router]);

  const handleUploadSuccess = () => {
    const returnPath = uploadPathPrefix 
      ? `/gallery?prefix=${encodeURIComponent(uploadPathPrefix)}` 
      : '/gallery';
    
    setTimeout(() => {
      router.push(returnPath);
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Upload to Gallery</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Gallery
          </Button>
        </div>
        
        {!isLoading && (
          <>
            {uploadPathPrefix && (
              <div className="mb-6 p-4 bg-muted rounded-lg flex items-center">
                <FolderIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Uploading to folder:
                  </p>
                  <p className="font-medium">
                    {uploadPathPrefix || 'Root'}
                  </p>
                </div>
              </div>
            )}
            
            <GalleryUpload 
              pathPrefix={uploadPathPrefix}
              onUploadSuccess={handleUploadSuccess}
              className="mb-8"
            />
            
            <div className="mt-8 bg-muted/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Tips</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">•</span>
                  <span>Images are stored in your personal gallery space and are only visible to you.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">•</span>
                  <span>Maximum file size is 10MB per image.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">•</span>
                  <span>Supported formats include JPG, PNG, GIF, and WebP.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">•</span>
                  <span>For optimal performance, consider resizing very large images before uploading.</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 