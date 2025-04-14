'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, Camera, Pencil, RotateCw, Trash, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="w-full max-w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
          <ImageIcon className="w-8 h-8 mr-3 text-indigo-600" />
          AI-Powered Photo Editor
        </h1>
        <p className="text-gray-600 text-lg">
          Enhance your photos with AI and transform them with just a few clicks
        </p>
      </header>
      
      <div className="space-y-6">
        {/* Image upload area */}
        {!selectedImage && (
          <div 
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
            />
            <Upload className="h-16 w-16 mx-auto text-indigo-400" />
            <p className="mt-4 text-base text-gray-600">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500 mt-2">PNG, JPG or WEBP (max. 10MB)</p>
            <Button 
              onClick={handleUploadClick} 
              className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            >
              Select Image
            </Button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Image editing area */}
        {selectedImage && (
          <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Trash className="h-4 w-4" />
                <span>Reset</span>
              </Button>
              
              {editedImage && (
                <Button
                  variant="outline"
                  onClick={handleBackToOriginal}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to original</span>
                </Button>
              )}
            </div>
            
            {/* Image preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Original Image</h3>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                  {imagePreview && (
                    <div className="absolute inset-0">
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
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Edited Image</h3>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                  {isEditing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
                      <p className="text-base text-gray-600">Processing your image...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                    </div>
                  ) : editedImage ? (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editedImage}
                        alt="Edited image"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-base text-gray-500">Select an editing option below</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Editing options */}
            <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editing Options</h3>
              
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-700">Choose an editing preset:</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {EDITING_PRESETS.map((preset, index) => (
                    <button
                      key={preset.name}
                      onClick={() => handleEditImage(index)}
                      disabled={isEditing}
                      className={`p-4 rounded-xl transition-all ${
                        selectedPreset === index
                          ? 'bg-indigo-100 border-2 border-indigo-400 shadow-sm'
                          : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      } flex flex-col items-center justify-center text-center`}
                    >
                      <div className={`p-3 rounded-full ${selectedPreset === index ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                        {preset.icon}
                      </div>
                      <p className={`text-sm font-medium mt-2 ${selectedPreset === index ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {preset.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-base font-medium text-gray-700 mb-3">Or enter a custom editing prompt:</h4>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Make the sky more blue, increase contrast"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isEditing}
                  />
                  <Button
                    onClick={() => handleEditImage()}
                    disabled={isEditing || !customPrompt}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                  >
                    {isEditing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Apply</span>
                  </Button>
                </div>
              </div>
              
              {/* Download button */}
              {editedImage && (
                <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-5 text-base"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Edited Image</span>
                  </Button>
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