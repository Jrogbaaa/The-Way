'use client';

import React, { useState, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import { 
  Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, 
  Camera, Pencil, RotateCw, Trash, Image as ImageIcon,
  Eraser, Move, Paintbrush, Palette, Layers, Search,
  SlidersHorizontal, Check, Info, Zap, Plus, CircleDashed,
  Wand2, AlertTriangle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

// Define editing modes
const EDITING_MODES = {
  PROMPT: 'PROMPT',
  INPAINT: 'INPAINT',
  ERASE: 'ERASE',
  GENFILL: 'GENFILL',
  INCREASE_RES: 'INCREASE_RES'
};

// Define common editing presets
const EDITING_PRESETS = [
  { name: 'Enhance', description: 'Improve quality & detail', icon: <Sparkles className="h-5 w-5" />, prompt: 'Enhance this image with more details, better lighting, and improved quality, keeping the exact same content and composition.' },
  { name: 'Portrait', description: 'Polish portrait photos', icon: <Camera className="h-5 w-5" />, prompt: 'Clean up and enhance this portrait photo with professional quality, natural skin tones, and subtle improvements.' },
  { name: 'Retouch', description: 'Remove imperfections', icon: <Pencil className="h-5 w-5" />, prompt: 'Remove spots, blemishes, and imperfections. Make the image cleaner and more polished while maintaining natural looks.' },
];

// Define edit features
const EDIT_FEATURES = [
  {
    id: EDITING_MODES.INPAINT, 
    name: 'Generative Fill', 
    description: 'Fill selected areas with AI', 
    icon: <Paintbrush className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/inpaint'
  },
  {
    id: EDITING_MODES.GENFILL, 
    name: 'GenFill', 
    description: 'Generate content in masked areas', 
    icon: <Wand2 className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/inpaint'
  },
  {
    id: EDITING_MODES.INCREASE_RES, 
    name: 'Upscale', 
    description: 'Increase resolution', 
    icon: <Zap className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/upscale'
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
  const [maskGrowAmount, setMaskGrowAmount] = useState(5);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

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
   * Updated handleImageLoad: Only record image dimensions
   */
  const handleImageLoad = useCallback(() => {
    console.log("handleImageLoad triggered.");
    if (imageRef.current) {
        setImageDimensions({
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
        });
        console.log(`handleImageLoad: Image dimensions recorded: ${imageRef.current.naturalWidth}x${imageRef.current.naturalHeight}`);
    } else {
        console.error("handleImageLoad: imageRef is null.");
    }
  }, []);

  // Effect to setup canvas context when canvas is rendered and image is loaded
  useEffect(() => {
    const needsCanvas = editingMode === EDITING_MODES.INPAINT || 
                        editingMode === EDITING_MODES.GENFILL || 
                        editingMode === EDITING_MODES.ERASE;

    // Only proceed if we need the canvas, the ref is set, and we have image dimensions
    if (needsCanvas && canvasRef.current && imageRef.current && imageDimensions) {
        console.log("Canvas setup effect: Conditions met, setting up context.");
        const canvas = canvasRef.current;
        const img = imageRef.current;

        // Calculate display dimensions based on container/image ref if needed, or use fixed logic
        // For simplicity, let's use the bounding rect again, assuming containerRef is stable
        if (!containerRef.current) {
            console.error("Canvas setup effect: containerRef is null.");
            return;
        }
        const imgRect = img.getBoundingClientRect(); // Get current display size
        canvas.width = imgRect.width;
        canvas.height = imgRect.height;

        contextRef.current = canvas.getContext('2d');
        if (contextRef.current) {
            console.log("Canvas setup effect: Context obtained.");
            contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
            contextRef.current.lineCap = 'round';
            contextRef.current.lineJoin = 'round';
            // Apply current brush settings immediately
            contextRef.current.lineWidth = brushSize;
            contextRef.current.strokeStyle = isEraser ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 0, 0, 1)'; // Still red for debug
            contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        } else {
            console.error("Canvas setup effect: Failed to get 2D context!");
        }
    } else {
        // Clear context ref if canvas is not needed or not ready
        // console.log("Canvas setup effect: Conditions not met or canvas not needed.");
        // contextRef.current = null; // Be careful with clearing this, might cause issues if mode changes quickly
    }
  }, [editingMode, imageDimensions, brushSize, isEraser]);

  // Effect to update drawing context settings (simplified, as initial setup is in above effect)
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = brushSize;
      // Use a semi-transparent red that makes it clearer this is a selection mask
      contextRef.current.strokeStyle = isEraser ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 0, 0, 0.5)'; 
      contextRef.current.fillStyle = isEraser ? 'rgba(0, 0, 0, 0)' : 'rgba(255, 0, 0, 0.2)';
      contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
      console.log(`Brush settings updated: Eraser=${isEraser}, Size=${brushSize}px`);
    }
  }, [brushSize, isEraser]);

  // Get scaled mouse/touch coordinates relative to the canvas
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
          if (e.touches.length === 0) return null; // No touch points
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = e.clientX;
          clientY = e.clientY;
      }
      
      // Calculate position relative to the element
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Adjust for the canvas's internal resolution vs. display size
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
          x: x * scaleX,
          y: y * scaleY,
      };
  };

  // Updated startPainting to use moveTo
  const startPainting = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Log context state at the start of drawing attempt
    if (contextRef.current) {
        console.log('startPainting: Context exists', {
            lineWidth: contextRef.current.lineWidth,
            strokeStyle: contextRef.current.strokeStyle,
            globalCompositeOperation: contextRef.current.globalCompositeOperation
        });
    } else {
        console.error('startPainting: Context is NULL!');
        return; // Cannot draw without context
    }
    
    const coords = getCoords(e);
    if (!coords) return;

    setIsPainting(true);
    
    // Draw initial point
    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
    contextRef.current.lineTo(coords.x, coords.y); 
    contextRef.current.stroke();
    
    // For non-eraser, fill a circle at the starting point
    if (!isEraser) {
      contextRef.current.beginPath();
      contextRef.current.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      contextRef.current.fill();
    }
    
    // Begin a new path for the next segment
    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
    
    console.log("Start painting at:", coords);

  }, [isEraser, brushSize]);
  
  // Updated paint function for continuous line
  const paint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting || !contextRef.current) return;
    const coords = getCoords(e);
    if (!coords) return;

    contextRef.current.lineTo(coords.x, coords.y); // Draw line to new point
    contextRef.current.stroke(); // Stroke the path
    
    // For non-eraser mode, fill a small circle at the current position for better visibility
    if (!isEraser && contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
      contextRef.current.fill();
    }
    
    contextRef.current.beginPath(); // Begin new path segment for smoother joining
    contextRef.current.moveTo(coords.x, coords.y); // Move to the current point

  }, [isPainting, isEraser, brushSize]);
  
  // Updated stopPainting
  const stopPainting = useCallback(() => {
    if (isPainting) {
        setIsPainting(false);
        if (contextRef.current) {
            contextRef.current.beginPath(); // Reset path after stopping
        }
        console.log("Stop painting");
    }
  }, [isPainting]);

  /**
   * Clear the mask canvas (canvasRef)
   */
  const handleClearMask = useCallback(() => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      console.log("Mask cleared");
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
   * Get mask data from the drawing canvas (canvasRef)
   */
  const getMaskBlob = async (): Promise<Blob | null> => {
    // Use canvasRef for mask generation
    if (!canvasRef.current) { 
      console.error('Drawing canvas ref not available for mask generation');
      return null;
    }
    const canvas = canvasRef.current; // Get the drawing canvas
    
    // Create a temporary canvas at original image dimensions if needed for scaling
    // Or simply export the current canvas content if scaling is handled elsewhere
    // For simplicity now, let's export the current drawing canvas directly
    
    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log("Mask blob generated from drawing canvas", blob.size, blob.type);
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from drawing canvas'));
            }
          },
          'image/png', // Ensure PNG for potential transparency
          1.0 // Max quality
        );
      });
    } catch (error) {
      console.error('Error converting drawing canvas to blob:', error);
      return null;
    }
  };

  /**
   * Function to poll prediction status
   */
  const pollPrediction = async (predictionId: string): Promise<string | null> => {
    try {
      let attempts = 0;
      const maxAttempts = 40; // ~5 min with 8s interval
      
      setIsPolling(true);
      setPollingStatus('Starting prediction...');
      
      while (attempts < maxAttempts) {
        const response = await fetch(`/api/replicate/predictions/${predictionId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch prediction status: ${response.status}`);
        }
        
        const prediction = await response.json();
        console.log(`Poll status [${attempts}]:`, prediction.status);
        
        // Check if this was a fallback prediction from a text-to-image model
        if (prediction.isFallback) {
          setPollingStatus('Using text-to-image as fallback (inpainting unavailable)...');
        } else {
          setPollingStatus(`Processing: ${prediction.status || 'unknown'}`);
        }
        
        if (prediction.status === 'succeeded') {
          // The prediction output is either a URL string or an array of URLs
          const output = prediction.output;
          
          if (!output) {
            throw new Error('Prediction succeeded but no output was returned');
          }
          
          // Handle different output formats
          let imageUrl;
          if (Array.isArray(output)) {
            imageUrl = output[0]; // Take first image if it's an array
          } else if (typeof output === 'string') {
            imageUrl = output;
          } else {
            throw new Error(`Unexpected output format: ${typeof output}`);
          }
          
          return imageUrl;
        }
        
        if (prediction.status === 'failed') {
          throw new Error(`Prediction failed: ${prediction.error || 'Unknown error'}`);
        }
        
        // Wait before polling again
        await sleep(8000); // 8 second interval
        attempts++;
      }
      
      throw new Error('Prediction timed out after multiple attempts');
    } catch (error: any) {
      console.error('Polling error:', error);
      throw new Error(`Error polling for results: ${error.message}`);
    } finally {
      setIsPolling(false);
      setPollingStatus(null);
    }
  };

  /**
   * Handles the primary edit action based on the selected mode.
   */
  const handleEditAction = async () => {
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      if (!selectedImage) {
        throw new Error('Please select an image first.');
      }
      
      // Prepare the form data (common for most actions)
      const formData = new FormData();
      formData.append('image', selectedImage);

      // Handle different editing modes
      if (editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.GENFILL) {
        // Use canvasRef for the check
        if (!canvasRef.current) { 
           throw new Error('Canvas not ready for inpainting/genfill');
        }
        // Use getMaskBlob which now reads from canvasRef
        console.log('Calling getMaskBlob. canvasRef.current is:', canvasRef.current);
        const maskBlob = await getMaskBlob(); 
        if (!maskBlob) {
           // Explicitly check if the reason was canvasRef being null INSIDE getMaskBlob
           if (!canvasRef.current) {
               throw new Error('handleEditAction Error: canvasRef became null before mask generation!');
           } else {
               // Otherwise, blob creation itself failed
               throw new Error('handleEditAction Error: Failed to generate mask blob from canvas.');
           }
        }

        formData.append('mask', maskBlob);
        
        if (!customPrompt) {
          throw new Error('Please enter a prompt describing what you want to add/change');
        }
        formData.append('prompt', customPrompt);

        console.log(`Starting ${editingMode} with:`, {
          imageSize: `${selectedImage.size} bytes`,
          maskSize: `${maskBlob.size} bytes`,
          prompt: customPrompt
        });

        // Call the Replicate inpainting endpoint
        const response = await fetch('/api/replicate/inpaint', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to process ${editingMode} request`);
        }

        const prediction = await response.json();
        console.log(`${editingMode} initiated:`, prediction);

        // Start polling for results
        setIsPolling(true);
        setPollingStatus(prediction.status);
        const imageUrl = await pollPrediction(prediction.id);

        if (imageUrl) {
          setEditedImage(imageUrl);
          setIsLoading(false);
        }

      } else if (editingMode === EDITING_MODES.PROMPT) {
        let promptToUse = customPrompt;
        if (selectedPreset !== null && selectedPreset >= 0 && selectedPreset < EDITING_PRESETS.length) {
          promptToUse = EDITING_PRESETS[selectedPreset].prompt;
        }
        
        if (!promptToUse) {
          throw new Error('Please enter an editing prompt or select a preset');
        }
        
        formData.append('prompt', promptToUse);
        console.log(`Editing with prompt: "${promptToUse}"`);
        setError("Prompt-based editing endpoint not yet implemented.");
        setIsLoading(false);

      } else if (editingMode === EDITING_MODES.INCREASE_RES) {
        console.log('Starting Upscale process...');
        
        const response = await fetch('/api/replicate/upscale', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upscale request failed');
        }

        const prediction = await response.json();
        console.log('Upscale prediction initiated:', prediction);

        setIsPolling(true);
        setPollingStatus(prediction.status);
        const imageUrl = await pollPrediction(prediction.id);

        if (imageUrl) {
          setEditedImage(imageUrl);
          setIsLoading(false);
        }

      } else if (editingMode === EDITING_MODES.ERASE) {
        console.log('Erase mode selected - implementation pending.');
        setError('Erase functionality not yet implemented.');
        setIsLoading(false);
      }

    } catch (error: any) {
      console.error('Edit action failed:', error);
      setError(error.message || 'Failed to process edit action');
      setIsLoading(false);
      setIsPolling(false);
      setPollingStatus(null);
    } finally {
       setIsPolling(false);
       setPollingStatus(null);
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
    setEditingMode(EDITING_MODES.GENFILL);
    handleClearMask();
    
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

  // Helper: sleep function
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Display polling status if polling is active
  const renderPollingStatus = () => {
      if (!isLoading && !isPolling) return null;
      const statusText = pollingStatus || 'Initializing...';
      return (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm text-blue-700">
              <p>Processing with Replicate... Status: <span className="font-semibold">{statusText}</span></p>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full animate-pulse"></div>
              </div>
          </div>
      );
  };

  // Add touch support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current || !contextRef.current) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setIsPainting(true);
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isPainting || !canvasRef.current || !contextRef.current) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  }, [isPainting]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <Loader2 className="animate-spin h-6 w-6 text-indigo-500 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Processing your image...</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
            <ImageIcon className="w-8 h-8 mr-3 text-indigo-600" />
            Replicate AI Photo Editor
          </h1>
          <p className="text-gray-600 text-lg">
            Enhance and transform your photos with Replicate AI's powerful image editing capabilities
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
            AI Editing Features (Powered by Replicate)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-white rounded border border-gray-200 flex items-start">
              <Wand2 className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-800">Generative Fill</h4>
                <p className="text-gray-600 text-xs mt-1">Fill in areas with AI-generated content based on your prompts.</p>
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
                  e.stopPropagation();
                  handleUploadClick();
                }} 
                className="mt-6 bg-indigo-600 hover:bg-indigo-700"
              >
                Select Image
              </Button>
            </div>
          )}
          
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
          
          {renderPollingStatus()}

          {selectedImage && (
            <div className="space-y-8">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Original Image</h3>
                  </div>
                  <div 
                    ref={containerRef}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm cursor-crosshair"
                  >
                    {imagePreview && (
                      <div className="absolute inset-0">
                        <img
                          ref={imageRef}
                          src={imagePreview}
                          alt="Original image"
                          className="w-full h-full object-contain pointer-events-none"
                          onLoad={handleImageLoad}
                        />
                        
                        {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL) && (
                          <canvas
                            ref={canvasRef} 
                            onMouseDown={startPainting}
                            onMouseMove={paint}
                            onMouseUp={stopPainting}
                            onMouseLeave={stopPainting}
                            onTouchStart={startPainting} 
                            onTouchMove={paint}
                            onTouchEnd={stopPainting}
                            role="img"
                            aria-label="Drawing canvas for masking area"
                            tabIndex={0}
                            className="absolute top-0 left-0 z-10 w-full h-full"
                          />
                        )}
                        
                        {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL) && !isPainting && !isLoading && !isPolling && !editedImage && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="bg-black/70 text-white py-3 px-4 rounded-lg max-w-xs text-center">
                              <p className="text-sm font-medium mb-2">Draw a mask over the area you want to replace</p>
                              <p className="text-xs">The red area will be replaced with AI-generated content</p>
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
              
              <div className="space-y-5 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Editing Options</h3>
                
                <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                   <h3 className="text-sm font-medium text-gray-700 mb-3">Select an Editing Task:</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3"> 
                     <button 
                       onClick={() => setEditingMode(EDITING_MODES.GENFILL)}
                       className={`flex flex-col items-center p-3 rounded-lg border transition-all ${ editingMode === EDITING_MODES.GENFILL ? 'bg-gradient-to-b from-purple-100 to-white border-purple-300' : 'bg-gradient-to-b from-purple-50 to-white border-purple-100 hover:border-purple-300'}`}
                     >
                       <div className="bg-purple-100 p-2 rounded-full mb-2">
                         <Wand2 className="h-4 w-4 text-purple-600" />
                       </div>
                       <span className="text-sm font-medium text-gray-800">Generative Fill</span>
                       <span className="text-xs text-gray-500 mt-1 text-center">Add or replace content</span>
                     </button>
                     
                     <button 
                       onClick={() => setEditingMode(EDITING_MODES.INCREASE_RES)}
                       className={`flex flex-col items-center p-3 rounded-lg border transition-all ${ editingMode === EDITING_MODES.INCREASE_RES ? 'bg-gradient-to-b from-green-100 to-white border-green-300' : 'bg-gradient-to-b from-green-50 to-white border-green-100 hover:border-green-300'}`}
                     >
                       <div className="bg-green-100 p-2 rounded-full mb-2">
                         <Zap className="h-4 w-4 text-green-600" />
                       </div>
                       <span className="text-sm font-medium text-gray-800">Upscale Image</span>
                       <span className="text-xs text-gray-500 mt-1 text-center">Increase resolution</span>
                     </button>

                     <button 
                       onClick={() => setEditingMode(EDITING_MODES.ERASE)} 
                       disabled // Disable if not implemented
                       className={`flex flex-col items-center p-3 rounded-lg border transition-all ${ editingMode === EDITING_MODES.ERASE ? 'bg-gradient-to-b from-red-100 to-white border-red-300' : 'bg-gradient-to-b from-red-50 to-white border-red-100 hover:border-red-300'} ${'opacity-50 cursor-not-allowed'}`} // Disable style
                     >
                       <div className="bg-red-100 p-2 rounded-full mb-2">
                         <Eraser className="h-4 w-4 text-red-600" />
                       </div>
                       <span className="text-sm font-medium text-gray-800">Erase Object</span>
                       <span className="text-xs text-gray-500 mt-1 text-center">Remove items (soon)</span>
                     </button>
                   </div>
                </div>

                {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.GENFILL) && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                        <h4 className="text-base font-medium text-purple-800 flex items-center">
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generative Fill (Inpainting)
                        </h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Replace or add content in specific areas of your image with AI-generated alternatives.
                        </p>
                        <ol className="text-xs text-purple-700 mt-2 space-y-1 list-decimal list-inside">
                          <li><span className="font-medium">Step 1:</span> Draw a red mask over the area you want to fill/replace</li>
                          <li><span className="font-medium">Step 2:</span> Provide a descriptive prompt for what should appear in the masked area</li>
                          <li><span className="font-medium">Step 3:</span> Click "Generate Fill" to replace only the masked area</li>
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
                            disabled={isLoading || isPolling}
                          />
                          <Button
                            onClick={handleEditAction}
                            disabled={isLoading || isPolling || !customPrompt || !canvasRef.current}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                          >
                            {(isLoading || isPolling) ? (
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
                  </div>
                )}

                {editingMode === EDITING_MODES.ERASE && (
                   <div className="space-y-6">
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                         <h4 className="text-base font-medium text-red-800 flex items-center">
                           <Eraser className="h-4 w-4 mr-2" />
                           Erase Objects (Coming Soon)
                         </h4>
                         <p className="text-sm text-red-700 mt-1">
                           This feature is not yet implemented. Check back later to remove unwanted objects by masking them.
                         </p>
                     </div>
                   </div>
                )}

                {editingMode === EDITING_MODES.INCREASE_RES && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                        <h4 className="text-base font-medium text-green-800 flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Increase Resolution (Upscale)
                        </h4>
                        <p className="text-sm text-green-700 mt-1">
                          Enhance your image's resolution and quality using a Replicate AI upscaling model.
                        </p>
                        <ul className="text-xs text-green-700 mt-2 space-y-1 list-disc list-inside">
                          <li>Improves details and clarity.</li>
                          <li>Enhances low-resolution photos.</li>
                          <li>Reduces noise and improves overall quality.</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200">
                      <Button
                        onClick={handleEditAction}
                        disabled={isEditing || isPolling}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                      >
                        {(isEditing || isPolling) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        <span>Apply Upscale</span> 
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
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
    </div>
  );
};

export default PhotoEditor;