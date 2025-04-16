'use client';

import React, { useState, useRef, ChangeEvent, useCallback } from 'react';
import { 
  Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, 
  Camera, Pencil, RotateCw, Trash, Image as ImageIcon,
  Eraser, Move, Paintbrush, Palette, Layers, Search,
  SlidersHorizontal, Check, Info, Zap, Plus, CircleDashed,
  Wand2
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
  INCREASE_RES: 'increase-res',
  GENFILL: 'genfill'
};

// Define common editing presets
const EDITING_PRESETS = [
  { name: 'Enhance', description: 'Enhance the photo quality', icon: <Sparkles className="h-5 w-5" />, prompt: 'Enhance this photo with better lighting, contrast, and colors' },
  { name: 'Portrait', description: 'Improve portrait features', icon: <Camera className="h-5 w-5" />, prompt: 'Enhance this portrait with better lighting, soften skin, and improve features naturally' },
  { name: 'Retouch', description: 'Remove blemishes and imperfections', icon: <Pencil className="h-5 w-5" />, prompt: 'Retouch this photo to remove blemishes, spots, and imperfections' },
  { name: 'Dramatic', description: 'Add cinematic dramatic effect', icon: <RotateCw className="h-5 w-5" />, prompt: 'Apply a dramatic cinematic effect to this photo with vibrant colors and contrast' },
];

// Define edit features
const EDIT_FEATURES = [
  // {
  //   id: EDITING_MODES.PROMPT, 
  //   name: 'Prompt Edit', 
  //   description: 'Edit with text prompts', 
  //   icon: <Sparkles className="h-5 w-5" />,
  //   apiEndpoint: '/api/edit-image' // Needs Gemini endpoint?
  // },
  {
    // NOTE: The UI shows two tabs ("Generative Fill" and "GenFill"), 
    // but they both use the INPAINT mode internally and now point to the same Replicate API.
    // Consider consolidating the UI if their functionality is identical.
    id: EDITING_MODES.INPAINT, 
    name: 'Generative Fill', // UI Label for this tab
    description: 'Fill selected areas with AI', 
    icon: <Paintbrush className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/inpaint' // Use Replicate
  },
  // {
  //   id: EDITING_MODES.ERASE, 
  //   name: 'Eraser', 
  //   description: 'Remove unwanted objects', 
  //   icon: <Eraser className="h-5 w-5" />,
  //   apiEndpoint: '/api/edit-image/erase' // No backend?
  // },
  // {
  //   id: EDITING_MODES.EXPAND_IMAGE, 
  //   name: 'Expand Image', 
  //   description: 'Extend the image canvas', 
  //   icon: <Plus className="h-5 w-5" />,
  //   apiEndpoint: '/api/bria/expand' // No backend?
  // },
  {
    // NOTE: See INPAINT mode comment above.
    id: EDITING_MODES.GENFILL, 
    name: 'GenFill', // UI Label for this tab
    description: 'Generate content in masked areas', 
    icon: <Wand2 className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/inpaint' // Use Replicate
  },
  // {
  //   id: EDITING_MODES.REMOVE_BG, 
  //   name: 'Remove BG', 
  //   description: 'Isolate the subject', 
  //   icon: <Layers className="h-5 w-5" />,
  //   apiEndpoint: '/api/edit-image/remove-background' // No backend?
  // },
  // {
  //   id: EDITING_MODES.BLUR_BG, 
  //   name: 'Blur BG', 
  //   description: 'Blur the background', 
  //   icon: <CircleDashed className="h-5 w-5" />,
  //   apiEndpoint: '/api/edit-image/blur-background' // No backend?
  // },
  // {
  //   id: EDITING_MODES.INCREASE_RES, 
  //   name: 'Upscale', 
  //   description: 'Increase resolution', 
  //   icon: <Zap className="h-5 w-5" />,
  //   apiEndpoint: '/api/edit-image/increase-resolution' // No backend?
  // }
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
  const [expandDirection, setExpandDirection] = useState<string>('');
  const [maskGrowAmount, setMaskGrowAmount] = useState(5);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  
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
  const handleClearMask = useCallback(() => {
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
   * Handles the primary edit action based on the selected mode.
   * This function orchestrates the entire process from preparing data,
   * calling the appropriate backend API, handling potential asynchronous 
   * operations like Replicate polling, and updating the UI with the result or error.
   */
  const handleEditAction = useCallback(async () => {
    if (!selectedImage || !imagePreview) return;
    
    setIsEditing(true);
    setError(null);
    setEditedImage(null);
    setIsPolling(false);
    setPollingStatus(null);

    try {
      const isReplicateInpaint = editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.GENFILL;

      const formData = new FormData();
      formData.append('image', selectedImage);
      
      // Get the active feature object
      const activeFeature = EDIT_FEATURES.find(feature => feature.id === editingMode);
      
      if (!activeFeature) {
        throw new Error('Invalid editing mode');
      }
      
      console.log(`Starting ${activeFeature.name} operation using ${activeFeature.apiEndpoint}`);
      
      // Process based on mode
      switch (editingMode) {
        case EDITING_MODES.PROMPT:
          let prompt = customPrompt;
          if (selectedPreset !== null && selectedPreset >= 0 && selectedPreset < EDITING_PRESETS.length) {
            prompt = EDITING_PRESETS[selectedPreset].prompt;
          }
          
          if (!prompt) {
            throw new Error('Please enter an editing prompt or select a preset');
          }
          
          formData.append('prompt', prompt);
          console.log(`Using prompt: "${prompt}"`);
          break;
          
        case EDITING_MODES.INPAINT:
        case EDITING_MODES.ERASE:
          const maskBlob = await getMaskBlob();
          if (!maskBlob) {
            const modeName = editingMode === EDITING_MODES.GENFILL ? 'GenFill' : 'Inpaint/Erase';
            throw new Error(`Please draw a mask for ${modeName}`);
          }
          
          formData.append('mask', maskBlob);
          
          if (editingMode === EDITING_MODES.INPAINT && customPrompt) {
            formData.append('prompt', customPrompt);
            console.log(`Using inpaint prompt: "${customPrompt}"`);
          }
          
          if (maskGrowAmount > 0) {
            formData.append('grow_mask', maskGrowAmount.toString());
            console.log(`Growing mask by ${maskGrowAmount} pixels`);
          }
          break;
          
        case EDITING_MODES.GENFILL:
          const genfillMaskBlob = await getMaskBlob();
          if (!genfillMaskBlob) {
            throw new Error('Please draw a mask on the areas you want to fill with AI');
          }
          
          formData.append('mask', genfillMaskBlob);
          
          if (customPrompt) {
            formData.append('prompt', customPrompt);
            console.log(`Using genfill prompt: "${customPrompt}"`);
          } else {
            throw new Error('Please enter a prompt for GenFill');
          }
          
          if (maskGrowAmount > 0) {
            formData.append('grow_mask', maskGrowAmount.toString());
            console.log(`Growing mask by ${maskGrowAmount} pixels`);
          }
          break;
          
        case EDITING_MODES.EXPAND_IMAGE:
          if (!expandDirection) {
            throw new Error('Please select a direction to extend the image');
          }
          
          formData.append('direction', expandDirection);
          console.log(`Expanding image in direction: ${expandDirection}`);
          
          if (customPrompt) {
            const sanitizedPrompt = customPrompt.trim()
              .replace(/\r?\n|\r/g, ' ')
              .replace(/["\\]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
              
            formData.append('prompt', sanitizedPrompt);
            console.log(`Using sanitized expansion prompt: "${sanitizedPrompt}"`);
          }
          break;
          
        case EDITING_MODES.REMOVE_BG:
        case EDITING_MODES.BLUR_BG:
        case EDITING_MODES.INCREASE_RES:
          console.log(`Executing simple operation: ${activeFeature.name}`);
          break;
          
        default:
          throw new Error('Unsupported editing mode');
      }
      
      if (isReplicateInpaint) {
        console.log(`Sending Replicate request to: ${activeFeature.apiEndpoint}`);
        const createResponse = await fetch(activeFeature.apiEndpoint, {
          method: 'POST',
          body: formData,
        });

        if (!createResponse.ok || createResponse.status !== 201) {
            let errorData;
            const contentType = createResponse.headers.get('content-type');
            try {
                if (contentType && contentType.includes('application/json')) {
                    errorData = await createResponse.json();
                } else {
                    errorData = { raw: await createResponse.text() };
                }
                console.error('Replicate prediction creation failed:', createResponse.status, errorData);
                const detail = errorData.detail || errorData.error || errorData.raw || 'Unknown error';
                throw new Error(`Replicate prediction creation failed: ${detail}`);
            } catch (parseError) {
                 console.error('Error parsing Replicate error response:', parseError);
                 throw new Error(`Replicate prediction creation failed: ${createResponse.status} ${createResponse.statusText}`);
            }
        }

        let prediction = await createResponse.json();
        console.log(`Started Replicate prediction: ${prediction.id} ${prediction.status}`);
        setIsPolling(true);
        setPollingStatus(prediction.status);

        while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
          await sleep(1500);
          try {
              const pollResponse = await fetch(`/api/replicate/predictions/${prediction.id}`);
              if (!pollResponse.ok) {
                  console.error(`Polling error for ${prediction.id}: ${pollResponse.status} ${pollResponse.statusText}`);
                  await sleep(3000);
                  continue;
              }
              
              const polledPrediction = await pollResponse.json();
              prediction = polledPrediction;
              setPollingStatus(prediction.status);
              console.log(`Polling prediction ${prediction.id}... Status: ${prediction.status}`);

          } catch(pollError) {
             console.error(`Error during fetch for polling ${prediction.id}:`, pollError);
             setError(`Network error while polling prediction status.`);
             setIsPolling(false);
             return;
          }
        }
        setIsPolling(false);

        if (prediction.status === "succeeded") {
          console.log("Prediction succeeded! Output URL:", prediction.output[0]);
          const proxiedUrl = `/api/proxy?url=${encodeURIComponent(prediction.output[0])}`;
          setEditedImage(proxiedUrl); 
          console.log('Replicate Edit operation completed successfully via polling.');
        } else {
          throw new Error(`Replicate prediction failed or was canceled. Status: ${prediction.status}. Error: ${prediction.error || 'No error details'}`);
        }

      } else {
        console.log(`Sending request to non-Replicate endpoint: ${activeFeature.apiEndpoint}`);
        const response = await fetch(activeFeature.apiEndpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get('content-type');
            try {
              if (contentType && contentType.includes('application/json')) { errorData = await response.json(); }
              else { errorData = { raw: await response.text() }; }
              console.log('Error response:', response.status, errorData);
              let errorMessage = `Error ${response.status}: `;
              if (errorData.error) { errorMessage += errorData.error; if (errorData.details) errorMessage += ` - ${errorData.details}`; if (errorData.message) errorMessage += ` - ${errorData.message}`; }
              else if (errorData.raw) { errorMessage += errorData.raw.substring(0, 100); }
              else { errorMessage += response.statusText; }
              throw new Error(errorMessage);
            } catch (parseError) {
              console.error('Error parsing error response:', parseError);
              throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }
        
        const imageBlob = await response.blob();
        const objectUrl = URL.createObjectURL(imageBlob);
        setEditedImage(objectUrl);
        console.log('Non-Replicate Edit operation completed successfully');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit image';
      setError(errorMessage);
      console.error('Error in handleEditAction:', err);
    } finally {
      setIsEditing(false);
      setIsPolling(false);
    }
  }, [selectedImage, editingMode, customPrompt, selectedPreset, getMaskBlob, maskGrowAmount, expandDirection]);

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
    handleClearMask();
    setExpandDirection('');
    
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
    handleClearMask();
  };

  /**
   * Set the direction for image expansion
   */
  const setDirection = (direction: string) => {
    setExpandDirection(direction);
  };

  const isDirectionSelected = (direction: string) => {
    return expandDirection === direction;
  };

  // Helper: sleep function
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Display polling status if polling is active
  const renderPollingStatus = () => {
      if (!isPolling || !pollingStatus) return null;
      return (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm text-blue-700">
              <p>Processing with Replicate... Status: <span className="font-semibold">{pollingStatus}</span></p>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
              </div>
          </div>
      );
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
        
        {/* Polling Status Display */} 
        {renderPollingStatus()}

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
                      {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL) && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 z-10 cursor-crosshair"
                          onMouseDown={startPainting}
                          onMouseMove={paint}
                          onMouseUp={stopPainting}
                          onMouseLeave={stopPainting}
                        />
                      )}
                      
                      {/* Mask instruction overlay */}
                      {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL) && !isEditing && !editedImage && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <div className="bg-black/70 text-white py-3 px-4 rounded-lg max-w-xs text-center">
                            <p className="text-sm font-medium mb-2">Draw on the image to select an area</p>
                            <p className="text-xs">Use the brush tools below to create a mask</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Result</h3>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
                  {(isEditing || isPolling) && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
                      <p className="text-sm font-medium text-indigo-700">Processing your image...</p>
                      {isPolling && pollingStatus && (
                         <p className="text-xs text-indigo-600 mt-1">Status: {pollingStatus}</p>
                      )}
                    </div>
                  )}
                  {editedImage && !isEditing && !isPolling && (
                    // Use Next Image for optimized loading if preferred, otherwise standard img
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={editedImage} 
                      alt="Edited Result"
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {!editedImage && !isEditing && !isPolling && !error && (
                     <div className="text-center text-gray-500">
                       <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                       <p className="mt-2 text-sm">Your edited image will appear here.</p>
                     </div>
                  )}
                </div>
                {editedImage && !isEditing && !isPolling && (
                  <Button 
                    onClick={handleDownload}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Result</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Editing features */}
            <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Editing Options</h3>
              
              {/* Task-based selector */}
              <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">What do you want to do?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button 
                    onClick={() => setEditingMode(EDITING_MODES.GENFILL)}
                    className="flex flex-col items-center p-3 bg-gradient-to-b from-purple-50 to-white rounded-lg border border-purple-100 hover:border-purple-300 transition-all"
                  >
                    <div className="bg-purple-100 p-2 rounded-full mb-2">
                      <Wand2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">Add an object</span>
                    <span className="text-xs text-gray-500 mt-1">Add objects to your image</span>
                  </button>
                  
                  <button 
                    onClick={() => setEditingMode(EDITING_MODES.ERASE)}
                    className="flex flex-col items-center p-3 bg-gradient-to-b from-red-50 to-white rounded-lg border border-red-100 hover:border-red-300 transition-all"
                  >
                    <div className="bg-red-100 p-2 rounded-full mb-2">
                      <Eraser className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">Remove an object</span>
                    <span className="text-xs text-gray-500 mt-1">Erase unwanted items</span>
                  </button>
                  
                  <button 
                    onClick={() => setEditingMode(EDITING_MODES.EXPAND_IMAGE)}
                    className="flex flex-col items-center p-3 bg-gradient-to-b from-blue-50 to-white rounded-lg border border-blue-100 hover:border-blue-300 transition-all"
                  >
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">Expand the canvas</span>
                    <span className="text-xs text-gray-500 mt-1">Make image wider or taller</span>
                  </button>
                  
                  <button 
                    onClick={() => setEditingMode(EDITING_MODES.PROMPT)}
                    className="flex flex-col items-center p-3 bg-gradient-to-b from-green-50 to-white rounded-lg border border-green-100 hover:border-green-300 transition-all"
                  >
                    <div className="bg-green-100 p-2 rounded-full mb-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">Enhance overall</span>
                    <span className="text-xs text-gray-500 mt-1">Improve the entire image</span>
                  </button>
                </div>
              </div>
              
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
                        onClick={handleClearMask}
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
                        onClick={handleClearMask}
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
                
                {/* GenFill Mode */}
                <TabsContent value={EDITING_MODES.GENFILL} className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                      <h4 className="text-base font-medium text-purple-800 flex items-center">
                        <Wand2 className="h-4 w-4 mr-2" />
                        GenFill
                      </h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Generate content in masked areas of your image using AI.
                      </p>
                      <ol className="text-xs text-purple-700 mt-2 space-y-1 list-decimal list-inside">
                        <li><span className="font-medium">Step 1:</span> Use the brush to mask areas you want to fill</li>
                        <li><span className="font-medium">Step 2:</span> Provide a descriptive prompt for what should appear in that area</li>
                        <li><span className="font-medium">Step 3:</span> Click "Generate Fill" to create the content</li>
                      </ol>
                    </div>

                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-base font-medium text-gray-700 flex items-center">
                          <span className="flex items-center justify-center bg-purple-100 text-purple-800 w-5 h-5 rounded-full text-xs mr-2">1</span>
                          Mask Selection Tools
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleClearMask}
                          className="text-xs"
                        >
                          Clear Mask
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="brush-size" className="text-sm text-gray-700">Brush Size</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="range"
                              id="brush-size"
                              min={5}
                              max={50}
                              value={brushSize}
                              onChange={(e) => setBrushSize(parseInt(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-xs text-gray-500 min-w-[30px]">{brushSize}px</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="mask-grow" className="text-sm text-gray-700">Grow/Shrink Mask</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="range"
                              id="mask-grow"
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
                      
                      <div className="flex items-center space-x-3 mt-1">
                        <button
                          onClick={() => setIsEraser(false)}
                          className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${!isEraser ? 'bg-purple-100 text-purple-800 font-medium' : 'bg-gray-100 text-gray-700'}`}
                        >
                          <Paintbrush className="h-4 w-4" />
                          Draw Mask
                        </button>
                        <button
                          onClick={() => setIsEraser(true)}
                          className={`px-3 py-2 text-sm rounded-md flex items-center gap-2 ${isEraser ? 'bg-purple-100 text-purple-800 font-medium' : 'bg-gray-100 text-gray-700'}`}
                        >
                          <Eraser className="h-4 w-4" />
                          Erase Mask
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                        <span className="flex items-center justify-center bg-purple-100 text-purple-800 w-5 h-5 rounded-full text-xs mr-2">2</span>
                        Describe what to generate in the masked area:
                      </h4>
                      <div className="flex space-x-3">
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="e.g., A beautiful mountain landscape with trees and clouds"
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
                            <Wand2 className="h-4 w-4" />
                          )}
                          <span>Generate Fill</span>
                        </Button>
                      </div>
                      
                      <div className="mt-3 bg-blue-50 p-3 border border-blue-100 rounded-md">
                        <p className="text-xs text-blue-700">
                          <strong>Tips:</strong> Be specific about what you want to add. Include details like style, colors, or objects.
                          <br />
                          Example: "A serene lake with mountains in the background, realistic style" rather than just "lake".
                        </p>
                      </div>
                    </div>
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
                        BRIA's Image Expansion allows you to extend your image in one direction at a time.
                      </p>
                      <ul className="text-xs text-teal-700 mt-2 space-y-1 list-disc list-inside">
                        <li>Select one direction to extend the image</li>
                        <li>Provide a descriptive prompt for what should be added in that area</li>
                        <li>Example: "Continue the beach scene with palm trees" or "Extend the mountain landscape with a flowing river"</li>
                      </ul>
                    </div>

                    <h4 className="text-base font-medium text-gray-700">Select direction to extend image</h4>
                    <p className="text-sm text-gray-500">
                      Choose one direction to expand your image.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-4 my-6">
                      <div className="col-start-2">
                        <Button
                          variant={isDirectionSelected('top') ? 'default' : 'outline'}
                          className={`w-full ${isDirectionSelected('top') ? 'bg-indigo-600' : ''}`}
                          onClick={() => setDirection('top')}
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
                          onClick={() => setDirection('left')}
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
                          onClick={() => setDirection('right')}
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
                          onClick={() => setDirection('bottom')}
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
                          disabled={isEditing || !customPrompt || !expandDirection}
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