'use client';

import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import { 
  Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, 
  Camera, Pencil, RotateCw, Trash, Image as ImageIcon,
  Eraser, Move, Paintbrush, Palette, Layers, Search,
  SlidersHorizontal, Check, Info, Zap, Plus, CircleDashed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

// Define editing modes
const EDITING_MODES = {
  PROMPT: 'prompt',
  INPAINT: 'inpaint',
  ERASE: 'erase',
  EXPAND_IMAGE: 'expand-image',
  REMOVE_BG: 'remove-bg',
  BLUR_BG: 'blur-bg',
  INCREASE_RES: 'increase-res'
};

// Define common editing presets
const EDITING_PRESETS = [
  { name: 'Enhance', description: 'Enhance the photo quality', icon: <Sparkles className="h-5 w-5" />, prompt: 'Enhance this photo with better lighting, contrast, and colors' },
  { name: 'Portrait', description: 'Improve portrait features', icon: <Camera className="h-5 w-5" />, prompt: 'Enhance this portrait with better lighting, soften skin, and improve features naturally' },
  { name: 'Retouch', description: 'Remove blemishes and imperfections', icon: <Pencil className="h-5 w-5" />, prompt: 'Retouch this photo to remove blemishes, spots, and imperfections' },
  { name: 'Dramatic', description: 'Add cinematic dramatic effect', icon: <RotateCw className="h-5 w-5" />, prompt: 'Apply a dramatic cinematic effect to this photo with vibrant colors and contrast' },
];

// Define edit features with only BRIA supported features
const EDIT_FEATURES = [
  { 
    id: EDITING_MODES.PROMPT, 
    name: 'Prompt Edit', 
    description: 'Edit with text prompts', 
    icon: <Sparkles className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image'
  },
  { 
    id: EDITING_MODES.INPAINT, 
    name: 'Generative Fill', 
    description: 'Fill selected areas with AI', 
    icon: <Paintbrush className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/inpaint'
  },
  { 
    id: EDITING_MODES.ERASE, 
    name: 'Eraser', 
    description: 'Remove unwanted objects', 
    icon: <Eraser className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/erase'
  },
  { 
    id: EDITING_MODES.EXPAND_IMAGE, 
    name: 'Expand Image', 
    description: 'Extend the image canvas', 
    icon: <Plus className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/expand-image'
  },
  { 
    id: EDITING_MODES.REMOVE_BG, 
    name: 'Remove BG', 
    description: 'Isolate the subject', 
    icon: <Layers className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/remove-background'
  },
  { 
    id: EDITING_MODES.BLUR_BG, 
    name: 'Blur BG', 
    description: 'Blur the background', 
    icon: <CircleDashed className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/blur-background'
  },
  { 
    id: EDITING_MODES.INCREASE_RES, 
    name: 'Upscale', 
    description: 'Increase resolution', 
    icon: <Zap className="h-5 w-5" />,
    apiEndpoint: '/api/edit-image/increase-resolution'
  }
];

const PhotoEditor = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [editingMode, setEditingMode] = useState(EDITING_MODES.PROMPT);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [outpaintDirection, setOutpaintDirection] = useState<string[]>([]);
  const [maskGrowAmount, setMaskGrowAmount] = useState(5);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setEditingMode(EDITING_MODES.PROMPT);
    
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
    
    // Reset canvas when image changes
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  /**
   * Initialize the mask canvas when the image loads
   */
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const container = containerRef.current;
    
    // Set canvas dimensions to match the displayed image size
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
    
    // Clear the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setMaskCanvas(canvas);
  }, []);

  /**
   * Handle drawing on the canvas for masking
   */
  const startPainting = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsPainting(true);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0.8)';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.fill();
  }, [brushSize, isEraser]);
  
  const paint = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 255, 255, 0.8)';
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.fill();
  }, [isPainting, brushSize, isEraser]);
  
  const stopPainting = useCallback(() => {
    setIsPainting(false);
  }, []);

  /**
   * Clear the mask canvas
   */
  const clearMask = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Get mask data from canvas
   */
  const getMaskBlob = useCallback(async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    
    return new Promise(resolve => {
      canvasRef.current?.toBlob(blob => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  /**
   * Process the edit request based on mode
   */
  const processEdit = async (mode: string, apiEndpoint: string, data: FormData) => {
    setIsEditing(true);
    setError(null);
    
    try {
      // Send to the appropriate API endpoint
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: data,
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log('Error data:', errorData);
          if (errorData.details) {
            throw new Error(`${errorData.error}: ${errorData.details}`);
          } else if (errorData.message) {
            throw new Error(`${errorData.error}: ${errorData.message}`);
          } else {
            throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
          }
        } catch (e) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
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
   * Handle edit action based on current mode
   */
  const handleEditAction = async () => {
    if (!selectedImage || !imagePreview) return;
    
    const formData = new FormData();
    formData.append('image', selectedImage);
    
    // Get the active feature object
    const activeFeature = EDIT_FEATURES.find(feature => feature.id === editingMode);
    
    if (!activeFeature) {
      setError('Invalid editing mode');
      return;
    }
    
    // Process based on mode
    switch (editingMode) {
      case EDITING_MODES.PROMPT:
        // Handle prompt-based editing
        let prompt = customPrompt;
        if (selectedPreset !== null && selectedPreset >= 0 && selectedPreset < EDITING_PRESETS.length) {
          prompt = EDITING_PRESETS[selectedPreset].prompt;
        }
        
        if (!prompt) {
          setError('Please enter an editing prompt or select a preset');
          return;
        }
        
        formData.append('prompt', prompt);
        break;
        
      case EDITING_MODES.INPAINT:
      case EDITING_MODES.ERASE:
        // For inpaint and erase, we need a mask
        const maskBlob = await getMaskBlob();
        if (!maskBlob) {
          setError('Please draw a mask on the areas you want to edit');
          return;
        }
        
        formData.append('mask', maskBlob);
        formData.append('prompt', customPrompt);
        formData.append('grow_mask', maskGrowAmount.toString());
        break;
        
      case EDITING_MODES.EXPAND_IMAGE:
        // For expand image, we need a single direction
        if (outpaintDirection.length === 0) {
          setError('Please select a direction to extend the image');
          return;
        }
        
        // BRIA only supports one direction at a time
        if (outpaintDirection.length > 1) {
          setError('BRIA only supports expanding in one direction at a time. Please select just one direction.');
          return;
        }
        
        // Add the direction
        formData.append('direction', outpaintDirection[0]);
        
        // Add prompt if provided
        if (customPrompt) {
          formData.append('prompt', customPrompt);
        }
        break;
        
      case EDITING_MODES.REMOVE_BG:
        // No additional parameters needed for background removal
        break;
        
      case EDITING_MODES.BLUR_BG:
        // No additional parameters needed for background blur
        break;
        
      case EDITING_MODES.INCREASE_RES:
        // No additional parameters needed for image upscaling
        break;
        
      default:
        setError('Unsupported editing mode');
        return;
    }
    
    await processEdit(editingMode, activeFeature.apiEndpoint, formData);
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
    setEditingMode(EDITING_MODES.PROMPT);
    clearMask();
    setOutpaintDirection([]);
    
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
    clearMask();
  };

  /**
   * Toggle direction for outpainting
   */
  const toggleDirection = (direction: string) => {
    setOutpaintDirection(prev => {
      // If direction is already selected, remove it
      if (prev.includes(direction)) {
        return prev.filter(d => d !== direction);
      }
      // Otherwise add it to the array
      return [...prev, direction];
    });
  };

  const isDirectionSelected = (direction: string) => {
    return outpaintDirection.includes(direction);
  };

  return (
    <div className="w-full max-w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
          <ImageIcon className="w-8 h-8 mr-3 text-indigo-600" />
          BRIA AI Photo Editor
        </h1>
        <p className="text-gray-600 text-lg">
          Enhance and transform your photos with BRIA AI's powerful image editing capabilities
        </p>
      </header>
      
      <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 text-sm mb-2">Quick Start Guide</h3>
        <ol className="text-sm text-indigo-700 list-decimal list-inside space-y-1">
          <li>Upload an image you want to edit</li>
          <li>Select an editing feature from the tabs below</li>
          <li>Follow the specific instructions for each feature</li>
          <li>Click the "Apply" button to transform your image</li>
          <li>Download your edited image when you're satisfied with the results</li>
        </ol>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center">
          <SlidersHorizontal className="h-4 w-4 mr-2 text-gray-600" />
          BRIA AI Editing Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
            <Sparkles className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Generative Fill</h4>
              <p className="text-gray-600 text-xs mt-1">Fill in areas with AI-generated content based on your prompts.</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
            <Eraser className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Eraser</h4>
              <p className="text-gray-600 text-xs mt-1">Remove unwanted objects or elements from your image.</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
            <Layers className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Background Tools</h4>
              <p className="text-gray-600 text-xs mt-1">Remove, blur, or replace image backgrounds automatically.</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
            <Plus className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Expand Image</h4>
              <p className="text-gray-600 text-xs mt-1">Extend your image canvas in any direction.</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
            <Zap className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">Upscale</h4>
              <p className="text-gray-600 text-xs mt-1">Increase resolution and detail of your images.</p>
            </div>
          </div>
        </div>
      </div>

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
              onClick={(e) => {
                e.stopPropagation(); // Prevent the event from bubbling up
                handleUploadClick();
              }} 
              className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            >
              Select Image
            </Button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="secondary"
                    onClick={handleEditAction} 
                    className="flex items-center text-red-800 hover:text-red-900 bg-red-100 hover:bg-red-200"
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
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
                <div 
                  ref={containerRef}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"
                >
                  {imagePreview && (
                    <div className="absolute inset-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        ref={imageRef}
                        src={imagePreview}
                        alt="Original image"
                        className="w-full h-full object-contain"
                        onLoad={handleImageLoad}
                      />
                      
                      {/* Canvas for masking - only visible in certain modes */}
                      {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE) && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 z-10 cursor-crosshair"
                          onMouseDown={startPainting}
                          onMouseMove={paint}
                          onMouseUp={stopPainting}
                          onMouseLeave={stopPainting}
                        />
                      )}
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
            
            {/* Editing features */}
            <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editing Options</h3>
              
              {/* Editing modes tabs */}
              <Tabs defaultValue={EDITING_MODES.PROMPT} onValueChange={(val) => setEditingMode(val)}>
                <TabsList className="grid grid-cols-9 mb-6">
                  {EDIT_FEATURES.map((feature) => (
                    <TabsTrigger 
                      key={feature.id} 
                      value={feature.id}
                      className="flex flex-col items-center py-3"
                    >
                      <div className="mb-1">{feature.icon}</div>
                      <span className="text-xs">{feature.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {/* Text Prompt Mode */}
                <TabsContent value={EDITING_MODES.PROMPT} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-gray-700">Choose an editing preset:</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {EDITING_PRESETS.map((preset, index) => (
                        <button
                          key={preset.name}
                          onClick={() => setSelectedPreset(index)}
                          disabled={isEditing}
                          className={`p-4 rounded-xl transition-all ${
                            editingMode === EDITING_MODES.PROMPT && selectedPreset === index
                              ? 'bg-indigo-100 border-2 border-indigo-400 shadow-sm'
                              : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                          } flex flex-col items-center justify-center text-center`}
                        >
                          <div className={`p-3 rounded-full ${editingMode === EDITING_MODES.PROMPT && selectedPreset === index ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                            {preset.icon}
                          </div>
                          <p className={`text-sm font-medium mt-2 ${editingMode === EDITING_MODES.PROMPT && selectedPreset === index ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {preset.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
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
                        onClick={handleEditAction}
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
                </TabsContent>
                
                {/* Inpaint Mode */}
                <TabsContent value={EDITING_MODES.INPAINT} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-gray-700">Fill selected areas with new content</h4>
                    <p className="text-sm text-gray-500">Draw on the original image to create a mask area, then describe what you want to add in that area.</p>
                    
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="brush-size" className="text-sm text-gray-700">Brush Size</Label>
                        <div className="w-32">
                          <input
                            type="range"
                            id="brush-size"
                            min={1}
                            max={50}
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <span className="text-xs text-gray-500">{brushSize}px</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="eraser-mode"
                          checked={isEraser}
                          onChange={(e) => setIsEraser(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="eraser-mode" className="text-sm text-gray-700">Eraser Mode</Label>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearMask}
                        className="ml-auto"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Clear Mask
                      </Button>
                    </div>
                    
                    <div className="pt-4">
                      <Label htmlFor="grow-mask" className="text-sm text-gray-700">Grow Mask Edges</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="range"
                          id="grow-mask"
                          min={0}
                          max={20}
                          value={maskGrowAmount}
                          onChange={(e) => setMaskGrowAmount(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500 min-w-[30px]">{maskGrowAmount}px</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-base font-medium text-gray-700 mb-3">Enter what to add in the masked area:</h4>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., A beautiful sunset sky"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isEditing}
                      />
                      <Button
                        onClick={handleEditAction}
                        disabled={isEditing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                      >
                        {isEditing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paintbrush className="h-4 w-4" />
                        )}
                        <span>Apply Inpaint</span>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Erase Mode */}
                <TabsContent value={EDITING_MODES.ERASE} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-base font-medium text-gray-700">Remove unwanted objects</h4>
                    <p className="text-sm text-gray-500">Draw on the objects you want to remove from the image.</p>
                    
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="erase-brush-size" className="text-sm text-gray-700">Brush Size</Label>
                        <div className="w-32">
                          <input
                            type="range"
                            id="erase-brush-size"
                            min={1}
                            max={50}
                            value={brushSize}
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <span className="text-xs text-gray-500">{brushSize}px</span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearMask}
                        className="ml-auto"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Clear Mask
                      </Button>
                    </div>
                    
                    <div className="pt-4">
                      <Label htmlFor="erase-grow-mask" className="text-sm text-gray-700">Grow Mask Edges</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="range"
                          id="erase-grow-mask"
                          min={0}
                          max={20}
                          value={maskGrowAmount}
                          onChange={(e) => setMaskGrowAmount(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500 min-w-[30px]">{maskGrowAmount}px</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleEditAction}
                      disabled={isEditing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    >
                      {isEditing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eraser className="h-4 w-4" />
                      )}
                      <span>Erase Selected Areas</span>
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Expand Image Mode */}
                <TabsContent value={EDITING_MODES.EXPAND_IMAGE} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 mb-4">
                      <h4 className="text-base font-medium text-teal-800 flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Expand Image Canvas
                      </h4>
                      <p className="text-sm text-teal-700 mt-1">
                        BRIA's Image Expansion allows you to extend your image in any direction.
                      </p>
                      <ul className="text-xs text-teal-700 mt-2 space-y-1 list-disc list-inside">
                        <li>Select one direction to extend the image at a time</li>
                        <li>Provide a descriptive prompt for what should be added in those areas</li>
                        <li>Example: "Continue the beach scene with palm trees" or "Extend the mountain landscape with a flowing river"</li>
                      </ul>
                    </div>

                    <h4 className="text-base font-medium text-gray-700">Extend image boundaries</h4>
                    <p className="text-sm text-gray-500">
                      Select the direction to extend your image.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 my-6">
                      <div className="col-start-2">
                        <Button
                          variant={isDirectionSelected('top') ? 'default' : 'outline'}
                          className={`w-full ${isDirectionSelected('top') ? 'bg-indigo-600' : ''}`}
                          onClick={() => toggleDirection('top')}
                        >
                          <span className="flex items-center justify-center">
                            Top {isDirectionSelected('top') && <Check className="h-3 w-3 ml-1" />}
                          </span>
                        </Button>
                      </div>
                      <div className="col-start-1 col-span-1 row-start-2">
                        <Button
                          variant={isDirectionSelected('left') ? 'default' : 'outline'}
                          className={`w-full ${isDirectionSelected('left') ? 'bg-indigo-600' : ''}`}
                          onClick={() => toggleDirection('left')}
                        >
                          <span className="flex items-center justify-center">
                            Left {isDirectionSelected('left') && <Check className="h-3 w-3 ml-1" />}
                          </span>
                        </Button>
                      </div>
                      <div className="col-start-3 col-span-1 row-start-2">
                        <Button
                          variant={isDirectionSelected('right') ? 'default' : 'outline'}
                          className={`w-full ${isDirectionSelected('right') ? 'bg-indigo-600' : ''}`}
                          onClick={() => toggleDirection('right')}
                        >
                          <span className="flex items-center justify-center">
                            Right {isDirectionSelected('right') && <Check className="h-3 w-3 ml-1" />}
                          </span>
                        </Button>
                      </div>
                      <div className="col-start-2 row-start-3">
                        <Button
                          variant={isDirectionSelected('bottom') ? 'default' : 'outline'}
                          className={`w-full ${isDirectionSelected('bottom') ? 'bg-indigo-600' : ''}`}
                          onClick={() => toggleDirection('bottom')}
                        >
                          <span className="flex items-center justify-center">
                            Bottom {isDirectionSelected('bottom') && <Check className="h-3 w-3 ml-1" />}
                          </span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-700 mb-3">Describe what to add in the extended area:</h4>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="e.g., Continue the beach scene with palm trees"
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={isEditing}
                        />
                        <Button
                          onClick={handleEditAction}
                          disabled={isEditing || !customPrompt || outpaintDirection.length === 0}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                        >
                          {isEditing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          <span>Expand Image</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Remove Background Mode */}
                <TabsContent value={EDITING_MODES.REMOVE_BG} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-violet-50 p-4 rounded-lg border border-violet-100 mb-4">
                      <h4 className="text-base font-medium text-violet-800 flex items-center">
                        <Layers className="h-4 w-4 mr-2" />
                        Background Removal
                      </h4>
                      <p className="text-sm text-violet-700 mt-1">
                        This will automatically remove the background from your image, leaving only the subject.
                      </p>
                      <ul className="text-xs text-violet-700 mt-2 space-y-1 list-disc list-inside">
                        <li>Perfect for product photography, portraits, and creating cutouts</li>
                        <li>Works best with images where the subject is clearly distinct from the background</li>
                        <li>The result will have a transparent background (PNG format)</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleEditAction}
                      disabled={isEditing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    >
                      {isEditing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Layers className="h-4 w-4" />
                      )}
                      <span>Remove Background</span>
                    </Button>
                  </div>
                </TabsContent>

                {/* Blur Background Mode */}
                <TabsContent value={EDITING_MODES.BLUR_BG} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                      <h4 className="text-base font-medium text-blue-800 flex items-center">
                        <CircleDashed className="h-4 w-4 mr-2" />
                        Background Blur
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This will automatically detect and blur the background while keeping the subject in focus.
                      </p>
                      <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                        <li>Perfect for portrait shots, product photography, and creating depth-of-field effects</li>
                        <li>Works best with images where the subject is clearly distinct from the background</li>
                        <li>Creates a professional bokeh effect with a single click</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleEditAction}
                      disabled={isEditing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    >
                      {isEditing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CircleDashed className="h-4 w-4" />
                      )}
                      <span>Blur Background</span>
                    </Button>
                  </div>
                </TabsContent>

                {/* Increase Resolution Mode */}
                <TabsContent value={EDITING_MODES.INCREASE_RES} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                      <h4 className="text-base font-medium text-green-800 flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Increase Resolution
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        This will enhance your image's resolution and quality using AI upscaling.
                      </p>
                      <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
                        <li>Improve details and clarity in your images</li>
                        <li>Enhance low-resolution photos for better printing or display</li>
                        <li>Reduce noise and enhance overall image quality</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      onClick={handleEditAction}
                      disabled={isEditing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    >
                      {isEditing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      <span>Increase Resolution</span>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Edit result controls */}
            {editedImage && (
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleBackToOriginal}
                  className="flex items-center gap-2"
                >
                  <Undo className="h-4 w-4" />
                  <span>Reset</span>
                </Button>
                <Button
                  onClick={handleDownload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEditor;