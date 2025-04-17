'use client';

import React, { useState, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import { 
  Loader2, Upload, ArrowLeft, Download, Sparkles, Undo, 
  Camera, Pencil, RotateCw, Trash, Image as ImageIcon,
  Eraser, Move, Paintbrush, Palette, Layers, Search,
  SlidersHorizontal, Check, Info, Zap, Plus, CircleDashed,
  Wand2, AlertTriangle, X, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Constants for editing modes
const EDITING_MODES = {
  PROMPT: 'prompt',
  INPAINT: 'inpaint',
  ERASE: 'erase',
  GENFILL: 'genfill',
  INCREASE_RES: 'increase_res',
  COMFY_INPAINT: 'comfy_inpaint',
  REMOVE_BG: 'remove_bg',
} as const;

type EditingMode = typeof EDITING_MODES[keyof typeof EDITING_MODES];

// Define common editing presets
const EDITING_PRESETS = [
  { name: 'Enhance', description: 'Improve quality & detail', icon: <Sparkles className="h-5 w-5" />, prompt: 'Enhance this image with more details, better lighting, and improved quality, keeping the exact same content and composition.' },
  { name: 'Portrait', description: 'Polish portrait photos', icon: <Camera className="h-5 w-5" />, prompt: 'Clean up and enhance this portrait photo with professional quality, natural skin tones, and subtle improvements.' },
  { name: 'Retouch', description: 'Remove imperfections', icon: <Pencil className="h-5 w-5" />, prompt: 'Remove spots, blemishes, and imperfections. Make the image cleaner and more polished while maintaining natural looks.' },
];

// Define edit features
const EDIT_FEATURES = [
  {
    id: EDITING_MODES.COMFY_INPAINT, 
    name: 'ComfyUI Inpaint', 
    description: 'Local inpainting using ComfyUI', 
    icon: <Paintbrush className="h-5 w-5" />,
    apiEndpoint: '/api/comfy/inpaint'
  },
  {
    id: EDITING_MODES.INPAINT, 
    name: 'Generative Fill', 
    description: 'Fill selected areas with AI', 
    icon: <Paintbrush className="h-5 w-5" />,
    apiEndpoint: '/api/stability/inpaint'
  },
  {
    id: EDITING_MODES.GENFILL, 
    name: 'GenFill', 
    description: 'Generate content in masked areas', 
    icon: <Wand2 className="h-5 w-5" />,
    apiEndpoint: '/api/stability/inpaint'
  },
  {
    id: EDITING_MODES.INCREASE_RES, 
    name: 'Upscale', 
    description: 'Increase resolution', 
    icon: <Zap className="h-5 w-5" />,
    apiEndpoint: '/api/replicate/upscale'
  }
];

// Helper function to convert Blob to Data URL
const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper function to convert File to Data URL
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as Data URL.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Helper function to resize image for SDXL requirements
const resizeImageForSDXL = (
  file: File,
  targetWidth: number = 1024,
  targetHeight: number = 1024
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(
            new Error('Could not get canvas context for resizing.')
          );
        }

        // Calculate scaling factor to maintain aspect ratio
        const scale = Math.min(
          targetWidth / img.width,
          targetHeight / img.height
        );
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Calculate positioning to center the image
        const dx = (targetWidth - scaledWidth) / 2;
        const dy = (targetHeight - scaledHeight) / 2;

        // Optional: Fill background if padding is added (e.g., white)
        // ctx.fillStyle = 'white';
        // ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw the scaled image onto the canvas
        ctx.drawImage(img, dx, dy, scaledWidth, scaledHeight);

        // Export canvas as a PNG data URL
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (error) =>
        reject(new Error(`Image loading failed for resizing: ${error}`));

      if (event.target?.result && typeof event.target.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('FileReader did not return a valid string result.'));
      }
    };
    reader.onerror = (error) =>
      reject(new Error(`FileReader error during resizing setup: ${error}`));
    reader.readAsDataURL(file); // Read file to get Data URL for Image src
  });
};

// Allowed dimensions for Stability AI SDXL v1.0
const ALLOWED_SDXL_DIMENSIONS = new Set([
  '1024x1024',
  '1152x896',
  '1216x832',
  '1344x768',
  '1536x640',
  '640x1536',
  '768x1344',
  '832x1216',
  '896x1152',
]);

const PhotoEditor = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [editingMode, setEditingMode] = useState<EditingMode>(EDITING_MODES.GENFILL);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isEraser, setIsEraser] = useState(false);
  const [maskGrowAmount, setMaskGrowAmount] = useState(5);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [maskDataUrlForDownload, setMaskDataUrlForDownload] = useState<string | null>(null);
  
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
                        editingMode === EDITING_MODES.ERASE ||
                        editingMode === EDITING_MODES.COMFY_INPAINT;

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
  
  /**
   * Core function to generate the final black & white mask canvas.
   */
  const generateFinalMaskCanvas = useCallback(async (
    targetWidth: number = 1024,
    targetHeight: number = 1024
  ): Promise<HTMLCanvasElement | null> => {
    if (!canvasRef.current || !imageDimensions || !contextRef.current) {
      console.error("Cannot generate final mask canvas: Missing refs or dimensions.");
      return null;
    }

    const originalMaskCanvas = canvasRef.current;
    const originalMaskCtx = contextRef.current;

    // Check if the drawing canvas is empty
    let isEmpty = true;
    try {
      const imageData = originalMaskCtx.getImageData(0, 0, originalMaskCanvas.width, originalMaskCanvas.height);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
          isEmpty = false;
          break;
        }
      }
    } catch (e) {
      console.error("Could not check if mask canvas is empty:", e);
      isEmpty = false; // Assume not empty if check fails
    }

    if (isEmpty) {
      console.log("Skipping final mask generation: Drawing canvas is empty.");
      return null; // Return null if empty
    }

    // Create the final mask canvas
    const finalMaskCanvas = document.createElement('canvas');
    finalMaskCanvas.width = targetWidth;
    finalMaskCanvas.height = targetHeight;
    const finalCtx = finalMaskCanvas.getContext('2d');
    if (!finalCtx) {
      console.error('Could not get context for final mask canvas');
      return null;
    }

    // Fill white
    finalCtx.fillStyle = 'white';
    finalCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Transfer drawing as black
    finalCtx.fillStyle = 'black';
    const scaleX = targetWidth / imageDimensions.width;
    const scaleY = targetHeight / imageDimensions.height;

    try {
      const originalImageData = originalMaskCtx.getImageData(0, 0, originalMaskCanvas.width, originalMaskCanvas.height);
      for (let y = 0; y < originalImageData.height; y++) {
        for (let x = 0; x < originalImageData.width; x++) {
          const index = (y * originalImageData.width + x) * 4;
          const alpha = originalImageData.data[index + 3];
          if (alpha > 10) {
            const finalX = Math.floor(x * scaleX);
            const finalY = Math.floor(y * scaleY);
            const finalW = Math.ceil(scaleX);
            const finalH = Math.ceil(scaleY);
            finalCtx.fillRect(finalX, finalY, finalW, finalH);
          }
        }
      }
      console.log('Final B&W mask canvas generated.');
      return finalMaskCanvas; // Return the canvas element
    } catch (error) {
      console.error("Error transferring drawing to final mask canvas:", error);
      return null;
    }
  }, [imageDimensions]); // Depends only on imageDimensions

  /**
   * Prepares the mask for download by generating the canvas and setting the state.
   */
  const prepareMaskForDownload = useCallback(async () => {
    console.log("Attempting to prepare mask for download...");
    const finalMaskCanvas = await generateFinalMaskCanvas(); // Call the core generator

    if (finalMaskCanvas) {
      try {
        const maskDataUrl = finalMaskCanvas.toDataURL('image/png');
        setMaskDataUrlForDownload(maskDataUrl);
        console.log("Mask data URL set for download.");
      } catch (dataUrlError) {
        console.error("Error creating data URL from final mask canvas:", dataUrlError);
        setMaskDataUrlForDownload(null);
      }
    } else {
      // If canvas generation failed or was skipped (empty), ensure state is null
      console.log("Final mask canvas not generated (likely empty), clearing download URL.");
      setMaskDataUrlForDownload(null);
    }
  }, [generateFinalMaskCanvas]); // Depends on the generator function

  // stopPainting calls prepareMaskForDownload (definition order is correct now)
  const stopPainting = useCallback(() => {
    if (isPainting) {
      setIsPainting(false);
      if (contextRef.current) {
        contextRef.current.beginPath();
      }
      console.log("Stop painting");
      prepareMaskForDownload(); // Call the prep function
    }
  }, [isPainting, prepareMaskForDownload]);

  // handleClearMask clears the state
  const handleClearMask = useCallback(() => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      console.log("Mask cleared");
    }
    setMaskDataUrlForDownload(null); // Clear download state
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
   * Get mask data, create B&W mask, and prepare download link.
   */
  const getMaskBlob = async (
    targetWidth: number = 1024,
    targetHeight: number = 1024
  ): Promise<Blob | null> => {
    const finalMaskCanvas = await generateFinalMaskCanvas(targetWidth, targetHeight); // Call the core generator

    if (!finalMaskCanvas) {
      console.error("Failed to generate final mask canvas for blob creation.");
      return null;
    }

    // Convert the generated canvas to Blob
    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        finalMaskCanvas.toBlob((blob) => {
          if (blob) {
            console.log(`Final B&W Mask blob generated (${finalMaskCanvas.width}x${finalMaskCanvas.height})`, blob.size, blob.type);
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from final mask canvas'));
          }
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error converting final mask canvas to blob:', error);
      return null;
    }
  };

  /**
   * Function to poll prediction status
   */
  const pollPrediction = async (predictionId: string): Promise<string | null> => {
    setPollingStatus('Checking status...');
    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes (60 attempts * 5 seconds)

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(`/api/replicate/predictions/${predictionId}`);
        if (!response.ok) {
          // Handle non-2xx responses during polling if needed
          console.error(`Polling error: Status ${response.status}`);
          setPollingStatus(`Error fetching status (Attempt ${attempts})`);
          await sleep(5000); // Wait before retrying on error
          continue;
        }

        const predictionResult = await response.json();
        setPollingStatus(`Status: ${predictionResult.status} (Attempt ${attempts})`);

        if (predictionResult.status === 'succeeded') {
          console.log('Prediction succeeded:', predictionResult);
          setPollingStatus('Success!');
          setIsPolling(false);
          setIsProcessing(false); // Processing ends on success
          setProcessingMessage(null);
          setCurrentPredictionId(null); // Clear ID after completion
          if (predictionResult.output && predictionResult.output.length > 0) {
            // Assuming the first output is the image URL
             setEditedImage(predictionResult.output[0]);
             toast.success('Image processing complete!');
             return predictionResult.output[0]; 
          } else {
              setError('Prediction succeeded but no output image found.');
              toast.error('Processing finished, but no image was returned.');
              return null;
          }
        } else if (predictionResult.status === 'failed') {
          console.error('Prediction failed:', predictionResult);
          setError(`Prediction failed: ${predictionResult.error || 'Unknown reason'}`);
          setPollingStatus('Failed.');
          toast.error('Image processing failed.');
          setIsPolling(false);
          setIsProcessing(false); // Processing ends on failure
          setProcessingMessage(null);
          setCurrentPredictionId(null); // Clear ID after failure
          return null;
        } else if (predictionResult.status === 'canceled') {
           console.log('Prediction canceled:', predictionResult);
           setError('Prediction was canceled.');
           setPollingStatus('Canceled.');
           toast.error('Image processing was canceled.');
           setIsPolling(false);
           setIsProcessing(false); 
           setProcessingMessage(null);
           setCurrentPredictionId(null);
           return null;
        }
        // If still processing or starting, wait and poll again
        await sleep(5000); // Poll every 5 seconds

      } catch (err) {
        console.error('Polling fetch error:', err);
        setError('Error checking prediction status.');
        setPollingStatus('Polling error, retrying...');
        // Add more robust retry logic if needed
        await sleep(7000); // Longer wait on fetch error
      }
    }

    // Max attempts reached
    setError('Prediction timed out after 5 minutes.');
    setPollingStatus('Timed out.');
    toast.error('Image processing timed out.');
    setIsPolling(false);
    setIsProcessing(false); // Processing ends on timeout
    setProcessingMessage(null);
    setCurrentPredictionId(null); // Clear ID after timeout
    return null;
  };

  /**
   * Handles the primary edit action based on the selected mode.
   */
  const handleEditAction = async () => {
    setError(null);
    setWarning(null);
    setIsProcessing(true);
    setProcessingMessage('Preparing image and mask...');

    const finalPrompt = typeof selectedPreset === 'number' && selectedPreset < EDITING_PRESETS.length
      ? `${EDITING_PRESETS[selectedPreset].prompt}, ${customPrompt}` 
      : customPrompt;

    let body: any = {};
    let apiEndpoint = '';
    let imageDataUrl = ''; // Variable to hold the final image data URL
    let targetWidth = 1024; // Default target for SDXL
    let targetHeight = 1024;

    // --- Mode-Specific Preparation ---
    try {
      if (editingMode === EDITING_MODES.GENFILL) {
          if (!imageDimensions || !selectedImage) {
             throw new Error('Image dimensions or selected image not available.');
          }
          
          const currentDimensions = `${imageDimensions.width}x${imageDimensions.height}`;
          const isDimensionValid = ALLOWED_SDXL_DIMENSIONS.has(currentDimensions);

          // *** Resize if dimensions are invalid, otherwise convert directly ***
          if (!isDimensionValid) {
              console.log(`Resizing image from ${currentDimensions} to ${targetWidth}x${targetHeight} for Stability AI.`);
              setProcessingMessage('Resizing image for AI...');
              imageDataUrl = await resizeImageForSDXL(selectedImage, targetWidth, targetHeight); 
          } else {
              imageDataUrl = await fileToDataURL(selectedImage);
              // If original dimensions *are* valid, use them as target for mask
              targetWidth = imageDimensions.width; 
              targetHeight = imageDimensions.height;
          }
          
          // Process mask, passing the target dimensions
          setProcessingMessage('Preparing mask...'); // Update status
          const maskBlob = await getMaskBlob(targetWidth, targetHeight);
          if (!maskBlob) {
              throw new Error('Could not generate or resize mask.');
          }
          const maskDataUrl = await blobToDataURL(maskBlob);
          
          body = { image: imageDataUrl, mask: maskDataUrl, prompt: finalPrompt };
          apiEndpoint = '/api/stability/inpaint'; 

      } else if (editingMode === EDITING_MODES.REMOVE_BG) { // *** Check against added mode ***
          if (!selectedImage) {
               throw new Error('Missing image for background removal.');
          }
          const imageDataUrl = await fileToDataURL(selectedImage);
          body = { image: imageDataUrl };
          apiEndpoint = '/api/replicate/remove-background'; // Example

      } else if (editingMode === EDITING_MODES.INCREASE_RES) {
          const imageSourceForConversion = editedImage ? null : selectedImage; // Prefer edited Blob URL if exists
          if (!editedImage && !imageSourceForConversion) { // Check both editedImage (blob URL) and selectedImage (File)
               throw new Error('Missing image for upscaling.');
          }
          // If editedImage exists, assume it's a Blob URL and we need to fetch and convert it.
          // If only selectedImage exists, convert that File.
          let imageDataUrl: string;
          if (editedImage) {
             // Fetch the blob URL content and convert
             const response = await fetch(editedImage);
             const blob = await response.blob();
             imageDataUrl = await blobToDataURL(blob);
          } else if (imageSourceForConversion) {
             imageDataUrl = await fileToDataURL(imageSourceForConversion);
          } else {
             // This case should theoretically not be reached due to the check above, but added for safety
             throw new Error('Could not determine image source for upscaling.');
          }
          body = { image: imageDataUrl };
          apiEndpoint = '/api/replicate/upscale'; // Example

      } else {
          // Fallback or unhandled modes
          throw new Error(`Editing mode "${editingMode}" is not fully implemented for API calls.`);
      }

    } catch (preparationError) {
        // --- Catch errors during image/mask preparation/conversion ---
        console.error("Error preparing data for API call:", preparationError);
        const message = preparationError instanceof Error ? preparationError.message : 'Unknown preparation error';
        setError(`Failed to prepare data: ${message}`);
        setIsProcessing(false);
        setProcessingMessage(null);
        toast.error('Could not prepare data for AI processing.');
        return; // Stop execution
    }
    // --- End of Mode-Specific Preparation ---


    if (!apiEndpoint) { // Should not happen if preparation succeeds, but good safety check
        setError(`API endpoint not determined for mode: ${editingMode}`);
        setIsProcessing(false);
        setProcessingMessage(null);
        return;
    }

    setProcessingMessage('Sending request to AI model...');

    // --- API Call ---
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      // --- Handle NON-OK Response ---
      if (!response.ok) {
        let errorTitle = `API Error (${response.status})`; // Default title
        let errorDetails = 'No details available.';      // Default details
        
        try {
            const responseBody = await response.json();
            console.error("API Error Response (JSON Parsed):", responseBody);
            
            // Extract specific fields if they exist
            errorTitle = responseBody.error || responseBody.name || errorTitle; // Use 'name' field from Stability as title if 'error' isn't present
            errorDetails = responseBody.details || responseBody.message || JSON.stringify(responseBody);
            
        } catch (e) {
            // If parsing JSON fails, try getting text
            try {
              const textError = await response.text();
              errorDetails = textError.substring(0, 500) + (textError.length > 500 ? '...' : ''); // Limit length
              console.error("API Non-JSON Error Response (Text):", textError);
            } catch (textE) {
               console.error("Failed to read API error response as JSON or text.", textE);
               errorDetails = "Failed to read error response body.";
            }
        }
        // Set state and show toast with structured error
        setError(`${errorTitle}. Details: ${errorDetails}`);
        toast.error(`${errorTitle}`); // Show the main error/name in the toast
        
        setIsProcessing(false);
        setProcessingMessage(null);
        return; // Stop execution
      }

      // --- Handle OK Response ---
      let result;
      try {
          result = await response.json();
      } catch (jsonError) {
          // Handle cases where the server returns OK status but non-JSON body (shouldn't happen with current API routes, but good practice)
          console.error("Failed to parse successful API response as JSON:", jsonError);
           let responseText = '';
          try {
              responseText = await response.text();
              console.error("Successful API response text:", responseText);
          } catch { /* Ignore if reading text also fails */ }
          
          setError(`API Success (${response.status}) but failed to parse response. Body: ${responseText.substring(0, 200)}...`);
          toast.error('Received an invalid successful response from the server.');
          setIsProcessing(false);
          setProcessingMessage(null);
          return; // Exit the function
      }

      // --- Process OK Response based on Endpoint ---
      
      // Stability AI (Synchronous Response)
      if (apiEndpoint === '/api/stability/inpaint') {
          setProcessingMessage('Processing complete!');
          if (result.generatedImage) {
              setEditedImage(result.generatedImage);
              toast.success('Image successfully generated!');
              handleClearMask(); // Clear mask after success
          } else {
              console.error("Stability Success Response Missing Data:", result);
              setError('AI processed successfully, but returned no image data.');
              toast.error('Processing finished, but no image was returned.');
          }
          setIsProcessing(false); 
          setProcessingMessage(null);

      } 
      // Replicate (Asynchronous - Needs Polling - e.g., Upscale, Remove BG)
      else if (apiEndpoint === '/api/replicate/upscale' || apiEndpoint === '/api/replicate/remove-background') { 
          if (result.prediction && result.prediction.id) {
              const predictionId = result.prediction.id;
              setCurrentPredictionId(predictionId);
              setProcessingMessage('AI processing started. Waiting for results...');
              setIsPolling(true); 
              pollPrediction(predictionId); // Start polling
              // isProcessing remains true until polling finishes
          } else {
              console.error("Replicate Start Error:", result);
              setError('Failed to start Replicate prediction job.');
              setIsProcessing(false);
              setProcessingMessage(null);
              toast.error('Could not initiate AI processing.');
          }
      }
      // ComfyUI (Assuming Asynchronous - Needs Polling)
      else if (apiEndpoint === '/api/comfy/inpaint') {
          if (result.prompt_id) {
              const promptId = result.prompt_id;
              setCurrentPredictionId(promptId); 
              setProcessingMessage('Local processing started. Waiting for results...');
              setIsPolling(true); 
              pollComfyResult(promptId); 
              // isProcessing remains true
          } else {
              console.error("ComfyUI Start Error:", result);
              setError(`Failed to start ComfyUI job: ${result.error || 'Unknown error'}`);
              setIsProcessing(false);
              setProcessingMessage(null);
              toast.error('Could not initiate local AI processing.');
          }
      }
      // --- Add other endpoint handlers if needed ---\
      else {
          console.warn(`Unhandled successful API endpoint response: ${apiEndpoint}`);
          setError(`Received successful response from unhandled endpoint: ${apiEndpoint}`);
          setIsProcessing(false);
          setProcessingMessage(null);
      }

    } catch (networkOrOtherError) { // Catch network errors or errors *outside* the fetch response handling
      console.error('Network or unexpected error during API call:', networkOrOtherError);
      const message = networkOrOtherError instanceof Error ? networkOrOtherError.message : 'An unknown network or processing error occurred.';
      setError(`Error: ${message}`);
      toast.error(`An error occurred: ${message}`);
      setIsProcessing(false);
      setProcessingMessage(null);
      setCurrentPredictionId(null); // Reset polling state
      setIsPolling(false); 
    } 
    // Note: isProcessing is now managed within the success/error/polling logic
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

  /**
   * Poll for ComfyUI results
   */
  const pollComfyResult = async (promptId: string): Promise<any> => {
    setIsPolling(true);
    setPollingStatus("Starting ComfyUI processing...");
    
    const maxPolls = 60; // Maximum number of polling attempts
    const pollInterval = 2000; // 2 seconds between polls
    
    try {
      for (let i = 0; i < maxPolls; i++) {
        setPollingStatus(`Processing image... (${i + 1}/${maxPolls})`);
        
        // Wait for the poll interval
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Check the status
        const response = await fetch(`/api/comfy/status?id=${promptId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Status check failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("ComfyUI status:", data);
        
        // Update polling status based on job status
        if (data.status === 'completed' && data.output) {
          setIsPolling(false);
          setPollingStatus(null);
          return data;
        } else if (data.status === 'executing') {
          setPollingStatus("ComfyUI is processing your image...");
        } else if (data.status === 'queued') {
          setPollingStatus("Waiting in ComfyUI queue...");
        } else if (data.error) {
          throw new Error(`ComfyUI error: ${data.error}`);
        }
      }
      
      throw new Error('ComfyUI processing timed out');
    } catch (error: any) {
      console.error('ComfyUI polling error:', error);
      setIsPolling(false);
      setPollingStatus(null);
      throw error;
    }
  };

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
            AI Photo Editor
        </h1>
        <p className="text-gray-600 text-lg">
            Enhance and transform your photos with powerful AI image editing capabilities
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
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Processing Error</p>
                <p className="text-sm">{error}</p>
                {error.includes("model") && (
                  <p className="text-xs mt-1">
                    The AI model may be temporarily unavailable. Please try again later or try a different edit mode.
                  </p>
                )}
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
                      
                      {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL || editingMode === EDITING_MODES.COMFY_INPAINT) && (
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
                        
                        {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.ERASE || editingMode === EDITING_MODES.GENFILL || editingMode === EDITING_MODES.COMFY_INPAINT) && !isPainting && !isLoading && !isPolling && !editedImage && (
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
                  {(isEditing || isPolling || isProcessing) && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
                      <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
                      <p className="text-sm font-medium text-indigo-700">{processingMessage || "Processing your image..."}</p>
                      {isPolling && pollingStatus && (
                         <p className="text-xs text-indigo-600 mt-1">Status: {pollingStatus}</p>
                      )}
                    </div>
                  )}
                  {editedImage && !isEditing && !isPolling && !isProcessing && (
                    <img 
                      src={editedImage} 
                      alt="Edited Result"
                      className="w-full h-full object-contain" 
                    />
                  )}
                  {!editedImage && !isEditing && !isPolling && !isProcessing && !error && (
                     <div className="text-center text-gray-500">
                       <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                       <p className="mt-2 text-sm">Your edited image will appear here.</p>
                     </div>
                  )}
                </div>
                {editedImage && !isEditing && !isPolling && !isProcessing && (
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
                  
                {(editingMode === EDITING_MODES.INPAINT || editingMode === EDITING_MODES.GENFILL || editingMode === EDITING_MODES.COMFY_INPAINT) && (
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
                          <div className="flex items-center space-x-2">
                            {maskDataUrlForDownload && (
                                <a
                                    href={maskDataUrlForDownload}
                                    download="generated_mask.png"
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <Save className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                                    Download Mask
                                </a>
                            )}
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleClearMask}
                                className="text-xs"
                             >
                                Clear Mask
                             </Button>
                           </div>
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

                {editingMode === EDITING_MODES.COMFY_INPAINT && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                        <h4 className="text-base font-medium text-blue-800 flex items-center">
                          <Paintbrush className="h-4 w-4 mr-2" />
                          Local ComfyUI Inpainting
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Replace content using your local ComfyUI instance - faster and more private than cloud-based solutions.
                        </p>
                        <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                          <li><span className="font-medium">Step 1:</span> Draw a red mask over the area you want to fill/replace</li>
                          <li><span className="font-medium">Step 2:</span> Provide a descriptive prompt for what should appear in the masked area</li>
                          <li><span className="font-medium">Step 3:</span> Click "Generate with ComfyUI" to process locally</li>
                        </ol>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">Brush Controls</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleClearMask}
                          >
                            Clear Mask
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="brushSize" className="text-xs">Brush Size</Label>
                            <Input
                              id="brushSize"
                              type="range"
                              min="5"
                              max="50"
                              value={brushSize}
                              onChange={(e) => setBrushSize(parseInt(e.target.value))}
                              className="h-8"
                            />
                            <div className="text-xs text-right">{brushSize}px</div>
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="eraser" 
                                checked={isEraser}
                                onCheckedChange={(checked) => setIsEraser(checked === true)}
                              />
                              <Label htmlFor="eraser" className="text-sm">Eraser Mode</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="customPrompt" className="text-sm font-medium">Prompt</Label>
                          <Textarea
                            id="customPrompt"
                            placeholder="Describe what should appear in the masked area..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            className="h-20"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleEditAction}
                          disabled={!canvasRef.current || isProcessing || isPolling || isLoading}
                          className="w-full"
                        >
                          {isProcessing || isPolling ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Paintbrush className="mr-2 h-4 w-4" />
                              Generate with ComfyUI
                            </>
                          )}
                        </Button>
                      </div>
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