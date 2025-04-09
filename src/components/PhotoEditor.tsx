'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, Camera, Pencil, RotateCw, Trash } from 'lucide-react';

// Define common editing presets
const EDITING_PRESETS = [
  { name: 'Enhance', description: 'Enhance the photo quality', icon: <Sparkles className="h-5 w-5" />, prompt: 'Enhance this photo with better lighting, contrast, and colors' },
  { name: 'Portrait', description: 'Improve portrait features', icon: <Camera className="h-5 w-5" />, prompt: 'Enhance this portrait with better lighting, soften skin, and improve features naturally' },
  { name: 'Retouch', description: 'Remove blemishes and imperfections', icon: <Pencil className="h-5 w-5" />, prompt: 'Retouch this photo to remove blemishes, spots, and imperfections' },
  { name: 'Dramatic', description: 'Add cinematic dramatic effect', icon: <RotateCw className="h-5 w-5" />, prompt: 'Apply a dramatic cinematic effect to this photo with vibrant colors and contrast' },
];

const PhotoEditor = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles image selection from the file input
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Reset previous edits
    setEditedImage(null);
    setError(null);
    setSelectedPreset(null);
    setCustomPrompt('');
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setSelectedImage(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Edit image with selected preset or custom prompt
   */
  const handleEditImage = async (presetIndex?: number) => {
    if (!selectedImage || !imagePreview) return;
    
    let prompt = customPrompt;
    
    // If preset is selected, use that prompt
    if (presetIndex !== undefined && presetIndex >= 0 && presetIndex < EDITING_PRESETS.length) {
      prompt = EDITING_PRESETS[presetIndex].prompt;
      setSelectedPreset(presetIndex);
    }
    
    if (!prompt) {
      setError('Please enter an editing prompt or select a preset');
      return;
    }
    
    setIsEditing(true);
    setError(null);
    
    try {
      // Create form data for the API request
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('prompt', prompt);
      
      // Send to our API endpoint
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      // Get the edited image as a blob
      const imageBlob = await response.blob();
      const editedImageUrl = URL.createObjectURL(imageBlob);
      
      setEditedImage(editedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image');
      console.error('Error editing image:', err);
    } finally {
      setIsEditing(false);
    }
  };

  /**
   * Reset the editor
   */
  const handleReset = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    if (editedImage) {
      URL.revokeObjectURL(editedImage);
    }
    setSelectedImage(null);
    setImagePreview(null);
    setEditedImage(null);
    setError(null);
    setIsEditing(false);
    setCustomPrompt('');
    setSelectedPreset(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Download the edited image
   */
  const handleDownload = () => {
    if (!editedImage) return;
    
    const a = document.createElement('a');
    a.href = editedImage;
    a.download = `edited-${selectedImage?.name || 'image.jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Go back to original image
   */
  const handleBackToOriginal = () => {
    if (editedImage) {
      URL.revokeObjectURL(editedImage);
    }
    setEditedImage(null);
    setError(null);
    setIsEditing(false);
    setSelectedPreset(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-xl shadow-sm">
      <h1 className="text-2xl font-bold text-center mb-6">Photo Editor</h1>
      
      <div className="space-y-6">
        {/* Image upload area */}
        {!selectedImage && (
          <div 
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG or WEBP (max. 10MB)</p>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* Image editing area */}
        {selectedImage && (
          <div className="space-y-6">
            {/* Back button and reset */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 text-sm"
              >
                <Trash className="h-4 w-4" />
                <span>Reset</span>
              </button>
              
              {editedImage && (
                <button
                  onClick={handleBackToOriginal}
                  className="text-gray-600 hover:text-gray-900 flex items-center space-x-1 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to original</span>
                </button>
              )}
            </div>
            
            {/* Image preview */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Original Image</p>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {imagePreview && (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Original image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Edited Image</p>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {isEditing ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                      <p className="mt-2 text-sm text-gray-600">Editing image...</p>
                    </div>
                  ) : editedImage ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editedImage}
                        alt="Edited image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-gray-500">Select an editing option below</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Editing options */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Choose an editing preset:</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EDITING_PRESETS.map((preset, index) => (
                  <button
                    key={preset.name}
                    onClick={() => handleEditImage(index)}
                    disabled={isEditing}
                    className={`p-3 rounded-lg border ${
                      selectedPreset === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    } transition-colors flex flex-col items-center justify-center text-center`}
                  >
                    <div className={`${selectedPreset === index ? 'text-blue-500' : 'text-gray-600'}`}>
                      {preset.icon}
                    </div>
                    <p className={`text-sm font-medium mt-1 ${selectedPreset === index ? 'text-blue-700' : 'text-gray-700'}`}>
                      {preset.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                  </button>
                ))}
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Or enter a custom editing prompt:</p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Make the sky more blue, increase contrast"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isEditing}
                  />
                  <button
                    onClick={() => handleEditImage()}
                    disabled={isEditing || !customPrompt}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                  >
                    {isEditing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Apply</span>
                  </button>
                </div>
              </div>
              
              {/* Download button */}
              {editedImage && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Edited Image</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEditor; 