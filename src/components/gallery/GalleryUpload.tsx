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
import { supabase } from "@/lib/supabase";

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

    setIsUploading(true);
    setError(null);
    const uploadToastId = toast.loading(`Uploading to ${pathPrefix || 'root'}...`);
    
    // Generate a unique filename to prevent duplicates
    const fileExtension = selectedFile.name.match(/\.[0-9a-z]+$/i)?.[0] || '';
    const baseName = selectedFile.name.replace(/\.[0-9a-z]+$/i, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1000);
    const uniqueFileName = `${baseName}-${uniqueSuffix}${fileExtension}`;
    
    // Create a new File object with the unique name
    const uniqueFile = new File([selectedFile], uniqueFileName, { type: selectedFile.type });
    
    // Create FormData for the file upload
    const formData = new FormData();
    formData.append('file', uniqueFile);
    
    // Add path prefix if specified
    if (pathPrefix) {
      formData.append('pathPrefix', pathPrefix);
    }

    try {
      // Attempt to refresh session before upload
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Gallery Upload: Session refresh failed before upload:', refreshError.message);
      }

      // Use credentials: 'include' for cookie-based auth
      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        credentials: 'include', // Send cookies for authentication
        body: formData,
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Upload success:', data);
      toast.success('Image uploaded successfully!', { id: uploadToastId });
      
      // Clear the selected file and preview after successful upload
      setSelectedFile(null);
      setImagePreview(null);
      
      // Call the success callback if provided
      if (onUploadSuccess) {
        setTimeout(() => {
          onUploadSuccess(data);
        }, 1500);
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setError(errorMessage);
      toast.error(`Upload failed: ${errorMessage}`, { id: uploadToastId });
    } finally {
      setIsUploading(false);
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