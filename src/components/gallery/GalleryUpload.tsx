import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from "react-hot-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface GalleryUploadProps {
  onUploadSuccess?: (data: any) => void;
  pathPrefix: string;
  className?: string;
  maxSizeMB?: number;
}

const GalleryUpload: React.FC<GalleryUploadProps> = ({
  onUploadSuccess,
  pathPrefix,
  className,
  maxSizeMB = 10,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback((file: File): boolean => {
    setError(null);
    
    if (!file.type.startsWith('image/')) {
      setError(`Only image files are allowed. Selected file is ${file.type}`);
      return false;
    }
    
    if (file.size > maxSizeBytes) {
      setError(`File size should not exceed ${maxSizeMB}MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return false;
    }
    
    return true;
  }, [maxSizeBytes, maxSizeMB]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          toast.success(`${file.name} selected. Ready to upload.`);
        }
      }
    },
    [validateFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          toast.success(`${file.name} selected. Ready to upload.`);
        }
      }
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [validateFile]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected for upload.');
      return;
    }

    // Check if we have an authenticated user
    if (!user) {
      toast.error('Please sign in to upload files.');
      setError('Authentication required. Please sign in to upload files.');
      return;
    }

    // Extract user ID with more comprehensive approach
    let userIdToUse = null;
    
    try {
      if (user.id) {
        userIdToUse = user.id;
      } else if (user.sub) {
        userIdToUse = user.sub;
      } else if (user.uid) {
        userIdToUse = user.uid;
      } else if ((user as any).userId) {
        userIdToUse = (user as any).userId;
      }
      
      // If we still don't have an ID, try to get it from Supabase directly
      if (!userIdToUse && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            userIdToUse = data.session.user.id;
            console.log('GalleryUpload: Found user ID from Supabase session:', userIdToUse);
          }
        } catch (e) {
          console.error('GalleryUpload: Error getting Supabase session:', e);
        }
      }
      
      // Last resort - create a deterministic ID from the email
      if (!userIdToUse && user.email) {
        userIdToUse = `email-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
        console.log('GalleryUpload: Created user ID from email:', userIdToUse);
      }
    } catch (err) {
      console.error('GalleryUpload: Error extracting user ID:', err);
    }
    
    console.log(`GalleryUpload: Using user ID for upload: ${userIdToUse || 'MISSING'}`);

    if (!userIdToUse) {
      console.error('GalleryUpload: User ID missing in:', JSON.stringify(user));
      toast.error('Authentication error: Missing user ID');
      setError('Unable to upload: Your account is missing required information.');
      return;
    }

    setIsUploading(true);
    setError(null);
    const uploadToastId = toast.loading(`Uploading to ${pathPrefix || 'root'}...`);
    
    // Generate a unique filename to prevent duplicates
    const fileExtension = selectedFile.name.match(/\.[0-9a-z]+$/i)?.[0] || '';
    const baseName = selectedFile.name.replace(/\.[0-9a-z]+$/i, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000);
    
    // Create a more storage-friendly filename
    let sanitizedBaseName = baseName
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9\-_.]/g, '') // Remove any other special characters
      .toLowerCase();                  // Convert to lowercase for consistency
    
    // Ensure the base name isn't empty after sanitization
    if (sanitizedBaseName === '') {
      sanitizedBaseName = 'file';
    }
    
    const uniqueFileName = `${sanitizedBaseName}-${uniqueSuffix}${fileExtension.toLowerCase()}`;
    console.log(`GalleryUpload: Original filename: "${selectedFile.name}"`);
    console.log(`GalleryUpload: Sanitized filename: "${uniqueFileName}"`);
    console.log(`GalleryUpload: File type: ${selectedFile.type}, size: ${selectedFile.size} bytes`);
    
    try {
      const bucketName = 'gallery-uploads';
      
      // Try server-side upload first to bypass RLS issues
      try {
        console.log('GalleryUpload: Attempting server-side file upload');
        
        // Create form data for the file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', userIdToUse);
        formData.append('path', pathPrefix);
        formData.append('fileName', uniqueFileName);
        formData.append('bucketName', bucketName);
        
        // Call the server-side API endpoint
        const response = await fetch('/api/gallery/upload-file', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('GalleryUpload: Server API upload failed:', errorData);
          
          // Fall back to client-side upload if server API fails
          console.log('GalleryUpload: Falling back to client-side upload');
          await uploadFileClientSide(userIdToUse, bucketName, pathPrefix, uniqueFileName, selectedFile);
          
          // Get URL after client-side upload
          const { data: clientUrlData, error: clientUrlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(`${userIdToUse}/${pathPrefix}${uniqueFileName}`, 3600);
          
          if (!clientUrlError) {
            const uploadData = {
              success: true,
              file: {
                name: uniqueFileName,
                path: `${pathPrefix}${uniqueFileName}`,
                url: clientUrlData?.signedUrl || null,
              }
            };
            
            console.log('Upload success (client-side):', uploadData);
            toast.success('Image uploaded successfully!', { id: uploadToastId });
            
            setSelectedFile(null);
            setImagePreview(null);
            
            if (onUploadSuccess) {
              setTimeout(() => onUploadSuccess(uploadData), 1500);
            }
          } else {
            console.warn('GalleryUpload: Could not generate signed URL after client upload:', clientUrlError);
            toast.success('Image uploaded, but preview is not available.', { id: uploadToastId });
            setSelectedFile(null);
            setImagePreview(null);
            if (onUploadSuccess) setTimeout(() => onUploadSuccess({ success: true }), 1500);
          }
        } else {
          // Server API succeeded
          const result = await response.json();
          console.log('GalleryUpload: Server API upload succeeded:', result);
          
          const uploadData = {
            success: true,
            file: {
              name: uniqueFileName,
              path: `${pathPrefix}${uniqueFileName}`,
              url: result.url || null,
            }
          };
          
          toast.success('Image uploaded successfully!', { id: uploadToastId });
          setSelectedFile(null);
          setImagePreview(null);
          
          if (onUploadSuccess) {
            setTimeout(() => onUploadSuccess(uploadData), 1500);
          }
        }
      } catch (error: any) {
        // Log and rethrow to be caught by outer try-catch
        console.error('Upload failed completely:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = typeof error === 'object' ? 
        (error.message || JSON.stringify(error, Object.getOwnPropertyNames(error))) : 
        String(error);
      setError(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`, { id: uploadToastId });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Helper function for client-side file upload
  const uploadFileClientSide = async (
    userId: string, 
    bucketName: string, 
    currentPath: string, 
    fileName: string, 
    fileData: File
  ): Promise<void> => {
    console.log(`GalleryUpload: Uploading file to ${bucketName} at path: ${userId}/${currentPath}${fileName}`);
    
    // Ensure the content type is properly set
    let contentType = fileData.type;
    
    // If the browser didn't properly detect the content type from the file, try to infer it from extension
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension) {
        // Map common extensions to MIME types
        const extensionMap: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'bmp': 'image/bmp'
        };
        
        if (extension in extensionMap) {
          contentType = extensionMap[extension];
          console.log(`GalleryUpload: Inferred content type from extension: ${contentType}`);
        }
      }
    }
    
    // Verify bucket access first
    try {
      const { data: listData, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
        
      if (listError) {
        console.error('GalleryUpload: Error verifying bucket access:', listError);
        if (listError.message && listError.message.includes('permission denied') || listError.message.includes('row-level security')) {
          throw new Error('Storage permission denied. Please check RLS policies.');
        } else if (listError.message && listError.message.includes('bucket') && listError.message.includes('not found')) {
          throw new Error(`Storage bucket '${bucketName}' does not exist.`);
        } else {
          let errorDetails;
          try {
            errorDetails = JSON.stringify(listError, Object.getOwnPropertyNames(listError));
          } catch (e) {
            errorDetails = String(listError);
          }
          throw new Error(`Storage error: ${errorDetails}`);
        }
      }
    } catch (verifyError) {
      console.error('GalleryUpload: Bucket verification error:', verifyError);
      throw verifyError;
    }
    
    // Proceed with upload
    const filePath = `${userId}/${currentPath}${fileName}`;
    
    try {
      // Log upload attempt details
      console.log(`GalleryUpload: Uploading file with content type: ${contentType}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileData, {
          cacheControl: '3600',
          upsert: true,
          contentType: contentType || 'application/octet-stream'
        });
        
      if (error) {
        // Enhanced error logging
        let errorDetails;
        try {
          errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch (e) {
          errorDetails = String(error);
        }
        
        console.error('GalleryUpload: Upload error details:', errorDetails, 'Path:', filePath);
        
        // Check for specific error types
        if (error.message && error.message.includes('row-level security policy')) {
          throw new Error('Permission denied due to RLS policy. Please check your Supabase policies.');
        } else if (error.statusCode === 404 || (error.message && error.message.includes('not found'))) {
          throw new Error('Storage bucket not found. Please create the gallery-uploads bucket.');
        } else if (error.statusCode === 409) {
          throw new Error('A file with this name already exists. Please try again.');
        } else if (error.message) {
          throw new Error(error.message);
        } else {
          throw new Error(`Upload failed: ${errorDetails || 'Unknown error'}`);
        }
      }
      
      console.log('GalleryUpload: File uploaded successfully:', data);
      return;
    } catch (uploadError) {
      console.error('GalleryUpload: File upload failed:', uploadError);
      throw uploadError;
    }
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        accept="image/*"
        className="hidden"
        id="gallery-upload-input"
        aria-label="Upload image to gallery"
      />

      <Card
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? "border-primary bg-primary/10"
            : selectedFile
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop area for image upload"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleButtonClick();
          }
        }}
      >
        <CardContent className="flex flex-col items-center p-6 text-center">
          {!selectedFile ? (
            <>
              <Upload
                className="h-12 w-12 text-gray-400 mb-4"
                aria-hidden="true"
              />
              <p className="text-lg font-medium mb-1">
                Drag and drop your image
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Upload images to your gallery (max {maxSizeMB}MB)
              </p>
              <Button 
                onClick={handleButtonClick}
                type="button"
                variant="secondary"
                className="mt-2"
              >
                Select Image
              </Button>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">
                    Image selected
                  </span>
                </div>
                <Button 
                  onClick={handleClearSelection}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
              
              {imagePreview && (
                <div className="mb-4 relative w-full h-[200px] overflow-hidden rounded-md">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
              
              {selectedFile && (
                <div className="flex items-center justify-between p-2 rounded bg-background hover:bg-muted/50 mb-4">
                  <div className="flex items-center overflow-hidden">
                    <ImageIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm truncate">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload to Gallery"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GalleryUpload; 