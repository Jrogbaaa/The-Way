import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Upload, Check, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface TrainingDataUploadProps {
  onFileUpload?: (file: File) => void;
  onFilesChange?: (files: File[]) => void;
  error?: string;
  className?: string;
}

const TrainingDataUpload: React.FC<TrainingDataUploadProps> = ({
  onFileUpload,
  onFilesChange,
  error,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Check if it's a zip file or an image
      if (
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed" ||
        file.name.endsWith('.zip') ||
        file.type.startsWith("image/")
      ) {
        validFiles.push(file);
      } else {
        console.warn(`Invalid file type: ${file.type}`);
      }
    }

    return validFiles;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setUploadStatus('uploading');

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = validateFiles(e.dataTransfer.files);
        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
          // Use the first valid file for single file upload
          onFileUpload && onFileUpload(validFiles[0]);
          onFilesChange && onFilesChange(validFiles);
          setUploadStatus('success');
        } else {
          setUploadStatus('error');
        }
      }
    },
    [onFileUpload, onFilesChange, validateFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setUploadStatus('uploading');
      
      if (e.target.files && e.target.files.length > 0) {
        const validFiles = validateFiles(e.target.files);
        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
          // Use the first valid file for single file upload
          onFileUpload && onFileUpload(validFiles[0]);
          onFilesChange && onFilesChange(validFiles);
          setUploadStatus('success');
        } else {
          setUploadStatus('error');
        }
      }
    },
    [onFileUpload, onFilesChange, validateFiles]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    if (newFiles.length > 0) {
      // If there are still files, use the first one
      onFileUpload && onFileUpload(newFiles[0]);
      onFilesChange && onFilesChange(newFiles);
    }
    
    if (newFiles.length === 0) {
      setUploadStatus('idle');
    }
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        accept=".zip,image/*"
        className="hidden"
        id="file-upload-input"
        aria-label="Upload training data files"
      />

      <Card
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive
            ? "border-primary bg-primary/10"
            : selectedFiles.length > 0
            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
            : "border-gray-300 dark:border-gray-700"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop area for file upload"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleButtonClick();
          }
        }}
      >
        <CardContent className="flex flex-col items-center p-6 text-center">
          {selectedFiles.length === 0 ? (
            <>
              <Upload
                className="h-12 w-12 text-gray-400 mb-4"
                aria-hidden="true"
              />
              <p className="text-lg font-medium mb-1">
                Drag and drop your training data
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Upload ZIP files or individual images for model training
              </p>
              <Button 
                onClick={handleButtonClick}
                type="button"
                variant="secondary"
                className="mt-2"
              >
                Select Files
              </Button>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <Button 
                  onClick={handleButtonClick}
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  Add More Files
                </Button>
              </div>
              
              {/* Clear upload status notification */}
              {uploadStatus === 'success' && (
                <Alert variant="success" className="mb-4">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>
                    Your files have been uploaded successfully.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-background/50 rounded border">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-2 rounded bg-background hover:bg-muted/50"
                  >
                    <div className="flex items-center overflow-hidden">
                      <File className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      aria-label={`Remove ${file.name}`}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TrainingDataUpload; 