'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Upload, ImagePlus, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_IMAGES = 5;
const MAX_IMAGES = 15;

export default function TrainModelPage() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form inputs
  const [modelName, setModelName] = useState('');
  const [instancePrompt, setInstancePrompt] = useState('');
  const [trainingImages, setTrainingImages] = useState<Array<{ file: File, preview: string }>>([]);
  
  // State for training process
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'uploading' | 'training' | 'completed' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    // Convert FileList to Array
    const files = Array.from(e.target.files);
    const newImages: Array<{ file: File, preview: string }> = [];
    
    // Filter and validate files
    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive"
        });
        return;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
          variant: "destructive"
        });
        return;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    });

    // Update state with new images
    if (trainingImages.length + newImages.length > MAX_IMAGES) {
      toast({
        title: "Too many images",
        description: `Maximum ${MAX_IMAGES} images allowed`,
        variant: "destructive"
      });
      // Only add images up to the maximum
      const remaining = MAX_IMAGES - trainingImages.length;
      setTrainingImages(prev => [...prev, ...newImages.slice(0, remaining)]);
    } else {
      setTrainingImages(prev => [...prev, ...newImages]);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [trainingImages, toast]);

  // Remove image from selection
  const removeImage = (index: number) => {
    setTrainingImages(prev => {
      const updated = [...prev];
      // Release the object URL to avoid memory leaks
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Reset form after completion or failure
  const resetForm = () => {
    setModelName('');
    setInstancePrompt('');
    trainingImages.forEach(img => URL.revokeObjectURL(img.preview));
    setTrainingImages([]);
    setTrainingProgress(0);
    setTrainingId(null);
    setTrainingStatus('idle');
    setErrorMessage(null);
  };

  // Start the training process
  const startTraining = async () => {
    // Validate form
    if (!modelName.trim()) {
      setErrorMessage("Please provide a model name");
      return;
    }

    if (!instancePrompt.trim()) {
      setErrorMessage("Please provide a class prompt");
      return;
    }

    if (trainingImages.length < MIN_IMAGES) {
      setErrorMessage(`Please upload at least ${MIN_IMAGES} images`);
      return;
    }

    setErrorMessage(null);
    setIsTraining(true);
    setTrainingStatus('uploading');
    setTrainingProgress(10);

    try {
      // Convert images to base64
      const imageDataList = await Promise.all(
        trainingImages.map(async (img) => {
          return new Promise<{ base64Data: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = (reader.result as string).split(',')[1]; // Remove data URL prefix
              resolve({ base64Data });
            };
            reader.onerror = reject;
            reader.readAsDataURL(img.file);
          });
        })
      );

      setTrainingProgress(30);
      setTrainingStatus('training');

      // Send training request to API
      const response = await fetch('/api/model/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataList,
          instancePrompt: `a photo of ${instancePrompt}`,
          modelName,
        }),
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to start training');
      }

      setTrainingId(data.trainingId);
      setTrainingProgress(50);

      // Maximum polling time (10 minutes)
      const MAX_POLLING_TIME = 10 * 60 * 1000;
      const pollingStartTime = Date.now();
      
      // Track consecutive errors
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 5;

      // Poll for training status
      const statusCheckInterval = setInterval(async () => {
        try {
          // Check if we've been polling too long
          if (Date.now() - pollingStartTime > MAX_POLLING_TIME) {
            clearInterval(statusCheckInterval);
            setTrainingStatus('failed');
            setIsTraining(false);
            setErrorMessage('Training timed out. It may still be processing in the background. Please check the models page later.');
            return;
          }
          
          const statusResponse = await fetch(`/api/modal/model-status?id=${data.trainingId}&_t=${Date.now()}`);
          
          if (!statusResponse.ok) {
            throw new Error(`Failed to fetch status: ${statusResponse.status} ${statusResponse.statusText}`);
          }
          
          const statusData = await statusResponse.json();
          console.log('Status check response:', statusData);

          // Reset consecutive errors on success
          consecutiveErrors = 0;

          if (statusData.status === 'completed') {
            clearInterval(statusCheckInterval);
            setTrainingProgress(100);
            setTrainingStatus('completed');
            setIsTraining(false);
            
            toast({
              title: "Training completed",
              description: "Your custom model is now ready to use!",
            });
            
            // Navigate to the model page or show completion UI
            setTimeout(() => {
              router.push(`/models/${data.trainingId}`);
            }, 1500);
            
          } else if (statusData.status === 'failed') {
            clearInterval(statusCheckInterval);
            setTrainingStatus('failed');
            setIsTraining(false);
            setErrorMessage(statusData.error_message || 'Training failed');
          } else {
            // Update progress based on status
            if (typeof statusData.progress === 'number') {
              // Ensure progress always moves forward and smoothly
              const newProgress = Math.max(
                trainingProgress,
                Math.min(95, 50 + Math.floor(statusData.progress * 45))
              );
              setTrainingProgress(newProgress);
            }
            
            // Update status display based on returned status
            const statusMap: Record<string, 'uploading' | 'training'> = {
              'starting': 'uploading',
              'preprocessing': 'uploading',
              'training': 'training',
              'in_progress': 'training'
            };
            
            if (statusData.status in statusMap) {
              setTrainingStatus(statusMap[statusData.status]);
            }
          }
        } catch (error) {
          console.error('Error checking training status:', error);
          
          // Count consecutive errors
          consecutiveErrors++;
          
          // After MAX_CONSECUTIVE_ERRORS, we consider the connection lost
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            clearInterval(statusCheckInterval);
            setTrainingStatus('failed');
            setIsTraining(false);
            setErrorMessage('Lost connection to the server. Training may still be in progress. Please check the models page later.');
          }
        }
      }, 5000);

      // Clean up interval on component unmount
      return () => clearInterval(statusCheckInterval);

    } catch (error) {
      console.error('Training error:', error);
      setIsTraining(false);
      setTrainingStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Train Your Custom Model</h1>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Name Your Model</CardTitle>
            <CardDescription>Give your model a unique name to identify it later</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="modelName">Model Name</Label>
              <Input 
                id="modelName" 
                placeholder="e.g. My Portrait Style" 
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                disabled={isTraining}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>2. Define Your Subject</CardTitle>
            <CardDescription>Enter a class prompt that describes your subject (e.g. "person", "product", "style")</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="instancePrompt">Class Prompt</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">a photo of</span>
                <Input 
                  id="instancePrompt" 
                  placeholder="e.g. sks person" 
                  value={instancePrompt}
                  onChange={(e) => setInstancePrompt(e.target.value)}
                  disabled={isTraining}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This will be used as the identifier when generating images. Use a unique term like "sks person" rather than just "person".
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>3. Upload Training Images</CardTitle>
            <CardDescription>Upload 5-15 high-quality images for best results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
                disabled={isTraining || trainingImages.length >= MAX_IMAGES}
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full h-32 border-dashed"
                variant="outline"
                disabled={isTraining || trainingImages.length >= MAX_IMAGES}
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 mb-2" />
                  <span>Click to upload images</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {`${trainingImages.length}/${MAX_IMAGES} images selected`}
                  </span>
                </div>
              </Button>
              
              {trainingImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
                  {trainingImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden group">
                      <Image
                        src={img.preview}
                        alt={`Training image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        className="absolute top-1 right-1 bg-black/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        disabled={isTraining}
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {trainingStatus !== 'idle' && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>
              {trainingStatus === 'uploading' && 'Uploading and preprocessing images...'}
              {trainingStatus === 'training' && 'Training your custom model...'}
              {trainingStatus === 'completed' && 'Training complete!'}
              {trainingStatus === 'failed' && 'Training failed. Please try again.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={trainingProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {trainingStatus === 'completed' 
                ? 'Model successfully trained! Redirecting to model page...' 
                : trainingStatus === 'failed'
                ? 'There was a problem with the training process.'
                : 'This process may take 15-30 minutes depending on the number of images.'}
            </p>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={resetForm}
          disabled={isTraining || trainingStatus === 'idle'}
        >
          Reset
        </Button>
        <Button 
          onClick={startTraining}
          disabled={isTraining || trainingImages.length < MIN_IMAGES || !modelName || !instancePrompt}
        >
          {isTraining ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Training in Progress
            </>
          ) : (
            'Start Training'
          )}
        </Button>
      </div>
    </div>
  );
} 