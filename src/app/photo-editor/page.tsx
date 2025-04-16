'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Image as ImageIcon, UploadCloud, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eraser, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

type Direction = 'top' | 'bottom' | 'left' | 'right';

// Define types for Replicate Prediction object (can be expanded)
type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

interface Prediction {
  id: string;
  status: PredictionStatus;
  input?: any;
  output?: any; // Usually an array of URLs for images
  error?: string | null;
  logs?: string | null;
  metrics?: any;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  version?: string;
  urls?: { // Sometimes URLs are nested here
    get?: string;
    cancel?: string;
  }
}

// Utility sleep function
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PhotoEditorPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

  const [expansionDirections, setExpansionDirections] = useState<Direction[]>([]);
  const [expansionPrompt, setExpansionPrompt] = useState<string>('');

  const [maskBlob, setMaskBlob] = useState<Blob | null>(null);
  const [eraserPrompt, setEraserPrompt] = useState<string>('');
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);

  // Refs and State for canvas masking
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null); // To hold the original image element
  const isDrawing = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // Callback ref to set the canvas element state
  const handleCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      console.log('handleCanvasRef: Canvas node attached.');
      setCanvasElement(node);
    } else {
      console.log('handleCanvasRef: Canvas node detached.');
      setCanvasElement(null);
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset relevant states immediately
    setError(null);
    setResultImageUrl(null);
    setMaskBlob(null);
    imageRef.current = null; // Reset image ref
    // Clear canvas immediately if one exists
    const canvas = canvasElement;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Invalid file type. Please upload JPEG, PNG, or WebP.');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setSelectedFile(file);

      // Read the file to set the preview URL, which triggers the useEffect
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.onerror = () => {
          setError('Failed to read file.');
          setPreviewUrl(null);
          setSelectedFile(null);
      }
      reader.readAsDataURL(file);
    } else {
      // No file selected or selection cancelled
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [canvasElement]);

  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    // Reset other states, useEffect will handle canvas clearing
    setResultImageUrl(null);
    setError(null);
    setMaskBlob(null);
    imageRef.current = null;

    const input = document.getElementById('imageUpload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }, []);

  // --- Effect: Load and draw image when previewUrl and canvasElement are ready --- 
  useEffect(() => {
    if (!previewUrl) {
      // Image removed or not loaded - clear canvas if it exists
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          console.log('Draw Effect: Cleared canvas via state due to missing previewUrl.');
        }
      }
      imageRef.current = null;
      setMaskBlob(null);
      return; // Exit early
    }

    // Need both previewUrl AND the canvas element to be mounted
    if (!canvasElement) {
      console.log('Draw Effect: Waiting for canvas element state...');
      return; // Canvas not ready yet
    }

    console.log('Draw Effect: previewUrl & canvasElement present, creating Image object...');
    const img = new Image();

    img.onload = () => {
      console.log('Draw Effect (img.onload): Image loaded', img.naturalWidth, 'x', img.naturalHeight);
      imageRef.current = img; // Store the loaded image element FIRST

      // Access canvas directly from state variable now
      const canvas = canvasElement; 
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Draw Effect (img.onload): Canvas context failed even with state element!');
        setError('Canvas context failed.');
        return;
      }

      // Resize canvas based on image and draw
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      console.log('Draw Effect (img.onload): Canvas resized to', canvas.width, 'x', canvas.height);
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log('Draw Effect (img.onload): Image drawn onto canvas using state element.');
        setMaskBlob(null); // Reset mask on new draw
      } catch (drawError) {
        console.error('Draw Effect (img.onload): Error drawing image:', drawError);
        setError('Failed to draw image onto canvas.');
      }
    };

    img.onerror = (error) => {
      console.error('Draw Effect (img.onerror): Image failed to load:', error);
      setError('Failed to load image for masking.');
      imageRef.current = null;
      setMaskBlob(null);
      if(canvasElement) { // Check if canvas element exists
           const errorCtx = canvasElement.getContext('2d');
           if(errorCtx) {
                errorCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
           }
      }
    };

    img.src = previewUrl;
    console.log('Draw Effect: Image src set, loading image...');

  }, [previewUrl, canvasElement]); // Now depends on both previewUrl and canvasElement state

  // Handler for Bria API calls (like upscale, expansion)
  const handleApplyBriaEdit = useCallback(async (featureEndpoint: string, options?: { extraFormData?: Record<string, string | Blob> }) => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImageUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      if (options?.extraFormData) {
        for (const key in options.extraFormData) {
          formData.append(key, options.extraFormData[key]);
        }
      }

      const response = await fetch(`/api/bria/${featureEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData: any = { message: `API Error: ${response.statusText}` };
        try { errorData = await response.json(); } catch (e) { console.warn('Could not parse Bria error JSON'); }
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
      }
      const imageBlob = await response.blob();
      if (!imageBlob.type.startsWith('image/')) { throw new Error('Invalid image response from Bria server.'); }
      const resultUrl = URL.createObjectURL(imageBlob);
      setResultImageUrl(resultUrl);

    } catch (err: any) {
      console.error(`Error during Bria ${featureEndpoint}:`, err);
      setError(err.message || `Failed to apply ${featureEndpoint}.`);
      setResultImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleDirectionChange = (direction: Direction) => {
    setExpansionDirections(prev => 
      prev.includes(direction) 
        ? prev.filter(d => d !== direction) 
        : [...prev, direction]
    );
  };

  // Handler for STARTING Replicate Inpaint
  const handleStartReplicateInpaint = useCallback(async () => {
    if (!selectedFile || !maskBlob || !imageRef.current) {
      setError('Missing image, mask, or image dimensions for inpainting.');
      return;
    }

    setIsLoading(true); // Loading state for the initial POST
    setIsPolling(false);
    setError(null);
    setResultImageUrl(null);
    setCurrentPrediction(null);

    const originalImage = imageRef.current;
    const width = originalImage.naturalWidth;
    const height = originalImage.naturalHeight;

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('mask', maskBlob);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      if (eraserPrompt) {
        formData.append('prompt', eraserPrompt);
      }

      // Call the backend endpoint that STARTS the prediction
      const response = await fetch('/api/replicate/inpaint', {
        method: 'POST',
        body: formData,
      });

      const predictionResponse: Prediction = await response.json();

      if (!response.ok || !predictionResponse.id) {
        throw new Error(predictionResponse.error || `Failed to start prediction (Status: ${response.status})`);
      }

      console.log('Started prediction:', predictionResponse.id, predictionResponse.status);
      setCurrentPrediction(predictionResponse); // Store the initial prediction state
      setIsPolling(true); // Start polling

    } catch (err: any) {
      console.error('Error starting Replicate inpaint:', err);
      setError(err.message || 'Failed to start inpainting process.');
      setCurrentPrediction(null);
      setIsPolling(false);
    } finally {
      setIsLoading(false); // Initial POST is done
    }
  }, [selectedFile, maskBlob, eraserPrompt]);

  // --- Effect for Polling Replicate Prediction Status --- 
  useEffect(() => {
    // Only poll if we have a current prediction ID and its status indicates it's still running
    if (!isPolling || !currentPrediction?.id || ['succeeded', 'failed', 'canceled'].includes(currentPrediction.status)) {
      setIsPolling(false); // Stop polling if not needed or finished
      return;
    }

    console.log(`Polling prediction ${currentPrediction.id}... Status: ${currentPrediction.status}`);
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/replicate/predictions/${currentPrediction.id}`);
        const updatedPrediction: Prediction = await response.json();

        if (!response.ok) {
          throw new Error(updatedPrediction.error || `Failed to fetch prediction status (Status: ${response.status})`);
        }

        setCurrentPrediction(updatedPrediction); // Update state with the latest status

        if (['succeeded', 'failed', 'canceled'].includes(updatedPrediction.status)) {
          console.log('Polling finished:', updatedPrediction.status);
          setIsPolling(false); // Stop polling
          clearInterval(intervalId);

          if (updatedPrediction.status === 'succeeded') {
             let resultUrl: string | null = null;

             // Check for output format: either a string URL or an array with a string URL
             if (typeof updatedPrediction.output === 'string' && updatedPrediction.output.length > 0) {
                resultUrl = updatedPrediction.output;
             } else if (Array.isArray(updatedPrediction.output) && updatedPrediction.output.length > 0 && typeof updatedPrediction.output[0] === 'string') {
                resultUrl = updatedPrediction.output[0];
             }

             if (resultUrl) {
                console.log('Prediction succeeded! Output URL:', resultUrl);
                // Use proxy for the result URL
                setResultImageUrl(`/api/proxy?url=${encodeURIComponent(resultUrl)}`);
             } else {
                console.error('Prediction succeeded but output format is unexpected or empty:', updatedPrediction.output);
                setError('Inpainting finished but failed to get the result image URL.');
             }
          } else {
            console.error('Prediction failed or canceled:', updatedPrediction.error);
            setError(`Inpainting ${updatedPrediction.status}: ${updatedPrediction.error || 'Unknown reason'}`);
          }
        } else {
           console.log(`Prediction ${updatedPrediction.id} status: ${updatedPrediction.status}`);
        }
      } catch (err: any) {
        console.error('Error during polling:', err);
        setError(`Polling error: ${err.message}`);
        setIsPolling(false); // Stop polling on error
        clearInterval(intervalId);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function to clear the interval when the component unmounts or dependencies change
    return () => clearInterval(intervalId);

  }, [isPolling, currentPrediction]); // Rerun effect if polling starts/stops or prediction object updates

  // --- Canvas Drawing Handlers ---
  const getMousePos = (evt: React.MouseEvent): { x: number; y: number } | null => {
    if (!canvasElement) return null;
    const rect = canvasElement.getBoundingClientRect();
    
    // Calculate mouse position relative to the canvas element
    const mouseX = evt.clientX - rect.left;
    const mouseY = evt.clientY - rect.top;

    // Calculate scaling factor between display size and internal canvas size
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;

    // Apply scaling to get coordinates within the canvas internal resolution
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;

    // console.log(`Mouse: (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)}), Scaled: (${canvasX.toFixed(2)}, ${canvasY.toFixed(2)})`);

    return {
      x: canvasX,
      y: canvasY
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!canvasElement) return;
    const pos = getMousePos(e);
    if (!pos) return;
    isDrawing.current = true;
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing.current || !canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const currentPos = getMousePos(e);
    if (!currentPos) return; 

    ctx.strokeStyle = 'white'; // Mask is white
    ctx.lineWidth = 20; // Example brush size
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();

    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
  };

  const handleExportMask = useCallback(() => {
    const canvas = canvasElement; // Use state variable
    const originalImage = imageRef.current;

    // CRITICAL CHECK: Ensure originalImage is loaded before proceeding
    if (!originalImage) {
        console.error('handleExportMask: Original image element ref not available! Image might not have loaded/drawn correctly.');
        setError('Cannot generate mask: Original image data missing. Please re-upload or wait for image to load.');
        return;
    }
    if (!canvas) {
        console.error('handleExportMask: Canvas element state is null!');
        setError('Cannot generate mask: Display canvas not ready.');
        return;
    }

    // Get original dimensions
    const originalWidth = originalImage.naturalWidth;
    const originalHeight = originalImage.naturalHeight;

    console.log(`handleExportMask: Original Dims: ${originalWidth}x${originalHeight}, Display Canvas Dims: ${canvas.width}x${canvas.height}`);

    // Create a temporary canvas at *original* image dimensions
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = originalWidth;
    maskCanvas.height = originalHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        setError('Failed to create mask context.');
        return;
    }

    // 1. Fill the full-size mask canvas with black (background)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, originalWidth, originalHeight);

    // 2. Draw the scaled display canvas content (image + white lines) onto the full-size mask canvas,
    // scaling it *up* to match original dimensions.
    maskCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, originalWidth, originalHeight);

    // 3. Use compositing to isolate the white parts (drawing) from the scaled-up image.
    // Keep only the white pixels where the original was white.
    maskCtx.globalCompositeOperation = 'source-in'; 
    maskCtx.fillStyle = 'white';
    maskCtx.fillRect(0, 0, originalWidth, originalHeight);

    // 4. Ensure the background (where the image was, but not drawn white) is black.
    // Draw black underneath the white parts.
    maskCtx.globalCompositeOperation = 'destination-over'; 
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, originalWidth, originalHeight);

    // Result: A mask image at original dimensions with white areas where drawn on the display canvas.

    // Export as Blob
    maskCanvas.toBlob((blob) => {
        if (blob) {
            setMaskBlob(blob);
            console.log('Mask generated at original dimensions and stored in state.');
            // Optional: You could create a preview URL for the generated mask itself for debugging
            // const maskPreviewUrl = URL.createObjectURL(blob);
            // console.log('Mask Preview URL:', maskPreviewUrl);
        } else {
            setError('Failed to export mask.');
        }
    }, 'image/png');

  }, [canvasElement]);
  // --- End Canvas Drawing Handlers ---

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Bria AI Photo Editor</h1>

      <Card>
        <CardHeader>
          <CardTitle>Upload Your Image</CardTitle>
        </CardHeader>
        <CardContent>
          {previewUrl ? (
            <div className="relative group">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded-lg mb-4" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Label
              htmlFor="imageUpload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-4"
            >
              <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-gray-500 text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-gray-400 text-xs">JPEG, PNG, WebP (Max 10MB)</p>
            </Label>
          )}
          <Input 
            type="file" 
            id="imageUpload" 
            className="hidden"
            onChange={handleFileChange} 
            accept="image/jpeg,image/png,image/webp"
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="increase_resolution" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
          <TabsTrigger value="increase_resolution" disabled={!selectedFile}>Upscale</TabsTrigger>
          <TabsTrigger value="image_expansion" disabled={!selectedFile}>Expand</TabsTrigger>
          <TabsTrigger value="background_remove" disabled={!selectedFile}>Remove BG</TabsTrigger>
          <TabsTrigger value="eraser" disabled={!selectedFile}>Erase</TabsTrigger>
        </TabsList>

        <TabsContent value="increase_resolution">
          <Card>
            <CardHeader>
              <CardTitle>Increase Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFile ? 'Upscale your image to a higher resolution using Bria AI.' : 'Upload an image to enable upscaling.'}
              </p>
              <Button 
                onClick={() => handleApplyBriaEdit('increase-resolution')} 
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? 'Processing...' : 'Apply Upscale'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image_expansion">
          <Card>
            <CardHeader>
              <CardTitle>Image Expansion (Outpaint)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFile ? 'Expand the image beyond its original borders...' : 'Upload an image to enable expansion.'}
              </p>
              <div className={`mb-4 ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Label className="block mb-2 font-medium">Expansion Directions</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(['top', 'bottom', 'left', 'right'] as Direction[]).map((dir) => (
                    <div key={dir} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`direction-${dir}`}
                        checked={expansionDirections.includes(dir)}
                        onCheckedChange={() => handleDirectionChange(dir)}
                        aria-label={`Expand ${dir}`}
                        disabled={!selectedFile || isLoading}
                      />
                      <Label htmlFor={`direction-${dir}`} className="flex items-center capitalize cursor-pointer">
                        {dir === 'top' && <ArrowUp className="h-4 w-4 mr-1" />}
                        {dir === 'bottom' && <ArrowDown className="h-4 w-4 mr-1" />}
                        {dir === 'left' && <ArrowLeft className="h-4 w-4 mr-1" />}
                        {dir === 'right' && <ArrowRight className="h-4 w-4 mr-1" />}
                        {dir}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`mb-4 ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Label htmlFor="expansionPrompt" className="block mb-2 font-medium">Optional Prompt</Label>
                <Textarea 
                  id="expansionPrompt"
                  placeholder="Describe what should appear in the expanded areas (e.g., 'blue sky with clouds', 'continue the sandy beach')"
                  value={expansionPrompt}
                  onChange={(e) => setExpansionPrompt(e.target.value)}
                  className="resize-none"
                  rows={3}
                  disabled={!selectedFile || isLoading}
                />
              </div>
              <Button 
                onClick={() => {
                   if (expansionDirections.length === 0) {
                      setError('Please select at least one expansion direction.');
                      return;
                   }
                   const directionParam = expansionDirections.join(','); 
                   handleApplyBriaEdit('image-expansion', { 
                     extraFormData: { 
                       direction: directionParam, 
                       ...(expansionPrompt && { prompt: expansionPrompt })
                     }
                   });
                }}
                disabled={isLoading || !selectedFile || expansionDirections.length === 0}
              >
                {isLoading ? 'Processing...' : 'Apply Expansion'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background_remove">
          <Card>
            <CardHeader>
              <CardTitle>Remove Background</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFile ? 'Remove the background from your image.' : 'Upload an image to enable background removal.'}
              </p>
              <Button disabled={isLoading || !selectedFile}>Apply Remove Background</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eraser">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eraser className="h-5 w-5 mr-2"/> Erase / Inpaint (using Replicate SDXL)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {selectedFile ? 'Draw a mask over the area you want to erase or replace, then generate the mask and apply.' : 'Upload an image to enable erasing.'}
              </p>
              
              {/* --- Masking Canvas Container --- */}
              {previewUrl ? (
                <div className="mb-4 border rounded-lg overflow-hidden relative aspect-video max-w-full mx-auto bg-gray-200">
                  <canvas
                     ref={handleCanvasRef}
                     className="top-0 left-0 w-full h-full block cursor-crosshair"
                     onMouseDown={startDrawing}
                     onMouseMove={draw}
                     onMouseUp={stopDrawing}
                     onMouseLeave={stopDrawing}
                  />
                </div>
               ) : (
                 <div className="mb-4 border rounded-lg flex items-center justify-center aspect-video max-w-full mx-auto bg-gray-200">
                      <p className="text-gray-400">Upload image to enable masking</p>
                 </div>
               )}
              {/* --- End Masking Canvas Container --- */}
              
              <div className="flex flex-wrap gap-2 mb-4">
                 <Button onClick={handleExportMask} disabled={!previewUrl || isLoading} size="sm">
                   <Download className="h-4 w-4 mr-1"/> Generate Mask
                 </Button>
              </div>
              {maskBlob && <p className="text-xs text-green-600 mb-2">Mask generated!</p>}

              <div className={`mb-4 ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <Label htmlFor="eraserPrompt" className="block mb-2 font-medium">Optional Prompt for Replacement</Label>
                 <Textarea 
                   id="eraserPrompt"
                   placeholder="Describe what to add in the masked area. Leave blank to erase based on surroundings."
                   value={eraserPrompt}
                   onChange={(e) => setEraserPrompt(e.target.value)}
                   className="resize-none"
                   rows={2}
                   disabled={!selectedFile || isLoading}
                 />
              </div>

              <Button 
                 onClick={handleStartReplicateInpaint}
                 disabled={isLoading || isPolling || !selectedFile || !maskBlob}
              >
                 {isPolling ? `Processing (${currentPrediction?.status || '...'})` : (isLoading ? 'Starting...' : 'Apply Erase/Inpaint')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[200px] bg-gray-50">
            {previewUrl ? (
              <img src={previewUrl} alt="Original" className="max-w-full max-h-[400px] h-auto rounded-lg"/>
            ) : (
              <p className="text-gray-400">Upload an image</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            {(isLoading || isPolling) && (
              <div className="flex flex-col items-center justify-center w-full h-64 border border-gray-200 rounded-lg bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-sm text-gray-500">
                  {isPolling ? `Status: ${currentPrediction?.status}` : 'Starting process...'}
                </p>
                {currentPrediction?.logs && (
                   <p className="text-xs text-gray-400 mt-1">Logs: {currentPrediction.logs.split('\n').pop()}</p> // Show last log line
                )}
              </div>
            )}
            {!isLoading && !isPolling && resultImageUrl && (
              <img 
                src={resultImageUrl} 
                alt="Edited Result" 
                className="w-full h-auto rounded-lg"
              />
            )}
            {!isLoading && !isPolling && !resultImageUrl && (
              <div className="flex items-center justify-center w-full h-64 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500">Edited Image Will Appear Here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PhotoEditorPage; 