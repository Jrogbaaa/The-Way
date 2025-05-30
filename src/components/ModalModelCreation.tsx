import React, { useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Upload, X, FileIcon, ImageIcon, LogIn, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useReplicateTraining } from '@/hooks/useReplicateTraining';
import { useAuth } from '@/components/AuthProvider';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReplicateTrainingLive } from '@/components/ReplicateTrainingLive';

interface ModalModelCreationProps {
  onModelCreated?: (modelInfo: any) => void;
  onClose: () => void;
}

const ModalModelCreation: React.FC<ModalModelCreationProps> = ({
  onModelCreated,
  onClose,
}) => {
  const [modelName, setModelName] = useState('');
  const [instancePrompt, setInstancePrompt] = useState('');
  const [triggerWord, setTriggerWord] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [trainingImagesUrl, setTrainingImagesUrl] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingTraining, setPendingTraining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, loading } = useAuth();

  const {
    isTraining,
    status,
    error: trainingError,
    startTraining,
    reset,
    isCompleted,
    isFailed,
    progress,
    storeConfigForLater,
    tempConfigId
  } = useReplicateTraining();

  // Check for pending training from localStorage on component mount
  React.useEffect(() => {
    const storedTempId = localStorage.getItem('tempConfigId'); // Primary key that AuthProvider checks
    const storedPendingState = localStorage.getItem('pendingTrainingState'); // Primary key that AuthProvider checks
    
    // Also check for backup values stored directly
    const backupModelName = localStorage.getItem('pendingModelName');
    const backupInstancePrompt = localStorage.getItem('pendingInstancePrompt');
    const backupTriggerWord = localStorage.getItem('pendingTriggerWord');
    const backupTrainingImagesUrl = localStorage.getItem('pendingTrainingImagesUrl');
    
    // Check for persistent backup config
    let persistentConfig = null;
    try {
      const backupConfigStr = localStorage.getItem('TRAINING_CONFIG_BACKUP');
      if (backupConfigStr) {
        persistentConfig = JSON.parse(backupConfigStr);
        // Only use if less than 1 hour old
        if (persistentConfig.timestamp && (Date.now() - persistentConfig.timestamp) < 3600000) {
          console.log('Found valid persistent config backup:', persistentConfig);
        } else {
          console.log('Persistent config backup is too old, ignoring');
          localStorage.removeItem('TRAINING_CONFIG_BACKUP');
          persistentConfig = null;
        }
      }
    } catch (error) {
      console.warn('Error parsing persistent config backup:', error);
      localStorage.removeItem('TRAINING_CONFIG_BACKUP');
    }
    
    console.log('Component mounted, checking localStorage:', {
      storedTempId,
      storedPendingState,
      currentUser: !!user,
      currentLoading: loading,
      hasBackupData: !!(backupModelName && backupInstancePrompt && backupTriggerWord && backupTrainingImagesUrl),
      hasPersistentConfig: !!persistentConfig
    });
    
    // Only attempt resume if we have BOTH a tempId AND pending state AND user is authenticated
    if (storedTempId && storedPendingState === 'true' && user && !loading) {
      console.log('Found pending training config in localStorage, attempting to resume:', storedTempId);
      
      // Clear localStorage first to prevent welcome modal
      localStorage.removeItem('tempConfigId');
      localStorage.removeItem('pendingTrainingState');
      localStorage.removeItem('pendingTrainingConfigId');
      
      // Start training with stored config using tempId
      const resumeTraining = async () => {
        try {
          let configData = null;
          
          // Try to fetch the stored config first
          try {
            const configResponse = await fetch(`/api/training/prepare/${storedTempId}`);
            if (configResponse.ok) {
              const response = await configResponse.json();
              if (response.success && response.config) {
                configData = response;
              }
            }
          } catch (error) {
            console.warn('Could not fetch stored config from API, trying backup localStorage data:', error);
          }
          
          // Fallback to backup localStorage data if API config is missing
          if (!configData && backupModelName && backupInstancePrompt && backupTriggerWord && backupTrainingImagesUrl) {
            console.log('Using backup localStorage data for training');
            configData = {
              success: true,
              config: {
                modelName: backupModelName,
                instancePrompt: backupInstancePrompt,
                triggerWord: backupTriggerWord,
                trainingImagesZipUrl: backupTrainingImagesUrl
              }
            };
          }
          
          // Final fallback to persistent config backup
          if (!configData && persistentConfig) {
            console.log('Using persistent config backup for training');
            configData = {
              success: true,
              config: {
                modelName: persistentConfig.modelName,
                instancePrompt: persistentConfig.instancePrompt,
                triggerWord: persistentConfig.triggerWord,
                trainingImagesZipUrl: persistentConfig.trainingImagesUrl
              }
            };
          }
          
          if (!configData) {
            throw new Error('No training configuration found');
          }
          
          // Use the config data to start training
          const trainingId = await startTraining({
            modelName: configData.config.modelName,
            instancePrompt: configData.config.instancePrompt,
            triggerWord: configData.config.triggerWord,
            trainingImagesZipUrl: configData.config.trainingImagesZipUrl,
            tempId: storedTempId
          });

          console.log('Training resumed with stored config, ID:', trainingId);
          
          // Mark user as onboarded since they've completed training setup
          localStorage.setItem('userOnboarded', 'true');
          
          // Clean up all backup localStorage data
          localStorage.removeItem('pendingModelName');
          localStorage.removeItem('pendingInstancePrompt');
          localStorage.removeItem('pendingTriggerWord');
          localStorage.removeItem('pendingTrainingImagesUrl');
          localStorage.removeItem('TRAINING_CONFIG_BACKUP');
          
          if (onModelCreated) {
            onModelCreated({
              id: trainingId,
              model_id: trainingId,
              name: configData.config.modelName || 'Custom Model',
              status: 'training'
            });
          }
          
          // Close this modal and redirect to models page
          toast.success('Training started! Redirecting to your models...');
          setTimeout(() => {
            onClose();
            router.push('/models');
          }, 1500);
          
        } catch (error) {
          console.error('Failed to resume training:', error);
          toast.error('Failed to resume training. Please try creating a new model.');
        }
      };
      
      resumeTraining();
    } else if (storedTempId || storedPendingState || backupModelName) {
      // Clean up any incomplete localStorage state
      console.log('Cleaning up incomplete localStorage state');
      localStorage.removeItem('tempConfigId');
      localStorage.removeItem('pendingTrainingState');
      localStorage.removeItem('pendingTrainingConfigId');
      localStorage.removeItem('pendingModelName');
      localStorage.removeItem('pendingInstancePrompt');
      localStorage.removeItem('pendingTriggerWord');
      localStorage.removeItem('pendingTrainingImagesUrl');
      localStorage.removeItem('TRAINING_CONFIG_BACKUP');
    }
  }, [user, loading, startTraining, onModelCreated, router, onClose]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      // File upload doesn't require authentication
      const response = await fetch('/api/upload/training-images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadResult = await response.json();
      console.log('Upload result:', uploadResult);

      setUploadedFiles(uploadResult.files);
      
      // If a ZIP file was uploaded, use its URL
      if (uploadResult.zipFile) {
        setTrainingImagesUrl(uploadResult.zipFile.publicUrl);
        toast.success(`ZIP file uploaded: ${uploadResult.zipFile.originalName}`);
      } else if (uploadResult.imageFiles.length > 0) {
        // For individual images, we need to create a ZIP (for now, just show them)
        toast.success(`Uploaded ${uploadResult.imageFiles.length} images`);
        // Note: In production, you might want to auto-create a ZIP from individual images
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    
    // If we removed the ZIP file, clear the training URL
    if (uploadedFiles[index]?.type === 'application/zip') {
      setTrainingImagesUrl('');
    }
  };

  const handleStartTraining = async () => {
    // Validation
    if (!modelName.trim()) {
      toast.error('Please enter a model name');
      return;
    }

    if (!triggerWord.trim()) {
      toast.error('Please enter a trigger word');
      return;
    }

    if (!instancePrompt.trim()) {
      toast.error('Please enter an instance prompt');
      return;
    }

    if (!trainingImagesUrl) {
      toast.error('Please upload a ZIP file containing training images');
      return;
    }

    // Check if user is authenticated
    if (!user && !loading) {
      // User is not authenticated, store config and trigger authentication
      try {
        const tempId = await storeConfigForLater({
          modelName: modelName.trim(),
          instancePrompt: instancePrompt.trim(),
          triggerWord: triggerWord.trim(),
          trainingImagesZipUrl: trainingImagesUrl
        });
        
        // Store in localStorage to persist through OAuth redirect
        localStorage.setItem('tempConfigId', tempId);
        localStorage.setItem('pendingTrainingState', 'true');
        localStorage.setItem('pendingTrainingConfigId', tempId);
        
        // Also store individual pieces as backup for OAuth flow
        localStorage.setItem('pendingModelName', modelName.trim());
        localStorage.setItem('pendingInstancePrompt', instancePrompt.trim());
        localStorage.setItem('pendingTriggerWord', triggerWord.trim());
        localStorage.setItem('pendingTrainingImagesUrl', trainingImagesUrl);
        
        // Additional persistence strategy - store with timestamp and user intent
        const persistentConfig = {
          tempId,
          modelName: modelName.trim(),
          instancePrompt: instancePrompt.trim(),
          triggerWord: triggerWord.trim(),
          trainingImagesUrl,
          timestamp: Date.now(),
          userEmail: user?.email || 'anonymous'
        };
        localStorage.setItem('TRAINING_CONFIG_BACKUP', JSON.stringify(persistentConfig));
        
        console.log('Stored training config for OAuth flow:', {
          tempId,
          modelName: modelName.trim(),
          hasTrainingImages: !!trainingImagesUrl,
          storedKeys: ['tempConfigId', 'pendingTrainingState', 'pendingModelName', 'pendingInstancePrompt', 'pendingTriggerWord', 'pendingTrainingImagesUrl', 'TRAINING_CONFIG_BACKUP'],
          persistentConfig
        });
        
        setPendingTraining(true);
        toast.success('Configuration saved. Signing you in...');
        
        // Trigger authentication immediately
        await signIn('google');
        
        return;
      } catch (error) {
        console.error('Failed to store configuration or sign in:', error);
        toast.error('Failed to prepare training. Please try again.');
        
        // Clean up localStorage on error
        localStorage.removeItem('tempConfigId');
        localStorage.removeItem('pendingTrainingState');
        localStorage.removeItem('pendingTrainingConfigId');
        localStorage.removeItem('pendingModelName');
        localStorage.removeItem('pendingInstancePrompt');
        localStorage.removeItem('pendingTriggerWord');
        localStorage.removeItem('pendingTrainingImagesUrl');
      }
      return;
    }

    // User is authenticated, proceed with training
    try {
      const config = {
        modelName: modelName.trim(),
        instancePrompt: instancePrompt.trim(),
        triggerWord: triggerWord.trim(),
        trainingImagesZipUrl: trainingImagesUrl,
        // Include tempId if we have one from stored config
        ...(tempConfigId && { tempId: tempConfigId })
      };

      const trainingId = await startTraining(config);

      console.log('Training started with ID:', trainingId);
      
      // Mark user as onboarded since they've completed training setup
      localStorage.setItem('userOnboarded', 'true');
      
      // Clean up any pending training state
      localStorage.removeItem('tempConfigId');
      localStorage.removeItem('pendingTrainingState');
      localStorage.removeItem('pendingTrainingConfigId');
      localStorage.removeItem('pendingModelName');
      localStorage.removeItem('pendingInstancePrompt');
      localStorage.removeItem('pendingTriggerWord');
      localStorage.removeItem('pendingTrainingImagesUrl');
      localStorage.removeItem('TRAINING_CONFIG_BACKUP');
      
      // Call the callback if provided
      if (onModelCreated) {
        onModelCreated({
          id: trainingId,
          model_id: trainingId,
          name: modelName,
          status: 'training'
        });
      }
      
      // Auto-redirect to models page to see training progress
      toast.success('Training started! Redirecting to your models...');
      setTimeout(() => {
        onClose();
        router.push('/models');
      }, 1500);
      
    } catch (error) {
      console.error('Training failed:', error);
      // Error is already handled by the hook
      setPendingTraining(false);
    }
  };

  // Effect to handle training after successful authentication
  React.useEffect(() => {
    console.log('Auth effect triggered:', { 
      pendingTraining, 
      hasUser: !!user, 
      loading, 
      tempConfigId,
      hasTrainingImages: !!trainingImagesUrl 
    });
    
    if (pendingTraining && user && !loading) {
      // User just signed in and we have pending training
      setPendingTraining(false);
      setShowAuthPrompt(false);
      
      if (tempConfigId) {
        console.log('Auto-starting training with stored config ID:', tempConfigId);
        
        // Start training using the stored configuration directly
        const startStoredTraining = async () => {
          try {
            let configData = null;
            
            // Try to fetch the stored config first
            try {
              const configResponse = await fetch(`/api/training/prepare/${tempConfigId}`);
              if (configResponse.ok) {
                const response = await configResponse.json();
                if (response.success && response.config) {
                  configData = response;
                }
              }
            } catch (error) {
              console.warn('Could not fetch stored config from API, trying backup localStorage data:', error);
            }
            
            // Fallback to backup localStorage data if API config is missing
            const backupModelName = localStorage.getItem('pendingModelName');
            const backupInstancePrompt = localStorage.getItem('pendingInstancePrompt');
            const backupTriggerWord = localStorage.getItem('pendingTriggerWord');
            const backupTrainingImagesUrl = localStorage.getItem('pendingTrainingImagesUrl');
            
            if (!configData && backupModelName && backupInstancePrompt && backupTriggerWord && backupTrainingImagesUrl) {
              console.log('Using backup localStorage data for auth effect training');
              configData = {
                success: true,
                config: {
                  modelName: backupModelName,
                  instancePrompt: backupInstancePrompt,
                  triggerWord: backupTriggerWord,
                  trainingImagesZipUrl: backupTrainingImagesUrl
                }
              };
            }
            
            if (!configData) {
              throw new Error('No training configuration found');
            }
            
            // Use the actual stored config data
            const trainingId = await startTraining({
              modelName: configData.config.modelName,
              instancePrompt: configData.config.instancePrompt,
              triggerWord: configData.config.triggerWord,
              trainingImagesZipUrl: configData.config.trainingImagesZipUrl,
              tempId: tempConfigId
            });

            console.log('Training started with stored config, ID:', trainingId);
            
            // Mark user as onboarded since they've completed training setup
            localStorage.setItem('userOnboarded', 'true');
            
            // Clean up any remaining training state
            localStorage.removeItem('tempConfigId');
            localStorage.removeItem('pendingTrainingState');
            localStorage.removeItem('pendingTrainingConfigId');
            localStorage.removeItem('pendingModelName');
            localStorage.removeItem('pendingInstancePrompt');
            localStorage.removeItem('pendingTriggerWord');
            localStorage.removeItem('pendingTrainingImagesUrl');
            localStorage.removeItem('TRAINING_CONFIG_BACKUP');
            
            // Call the callback if provided
            if (onModelCreated) {
              onModelCreated({
                id: trainingId,
                model_id: trainingId,
                name: configData.config.modelName || 'Custom Model',
                status: 'training'
              });
            }
            
            // Auto-redirect to models page to see training progress  
            toast.success('Training started! Redirecting to your models...');
            setTimeout(() => {
              onClose();
              router.push('/models');
            }, 1500);
          } catch (error) {
            console.error('Auto-training failed:', error);
            toast.error('Failed to start training automatically. Please try again.');
          }
        };
        
        startStoredTraining();
      } else {
        // No tempConfigId available - might be lost during OAuth redirect
        console.warn('No tempConfigId found after sign-in. User may need to reconfigure.');
        toast.success('Please review your settings and click "Start Training" again.');
      }
    }
  }, [user, loading, pendingTraining, tempConfigId, startTraining, onModelCreated, modelName, trainingImagesUrl]);

  const handleComplete = () => {
    if (isCompleted && onModelCreated) {
      onModelCreated({
        id: status?.id,
        model_id: status?.id,
        name: modelName,
        status: 'completed',
        modelVersion: status?.modelVersion
      });
    }
    onClose();
  };

  const isFormValid = modelName && triggerWord && instancePrompt && trainingImagesUrl;

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Train Custom Model</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isTraining}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Authentication Prompt */}
      {showAuthPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <LogIn className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800">Sign in to start training</h4>
              <p className="text-sm text-blue-700 mt-1">
                To train your custom model, you'll need to sign in. Your uploaded files and settings will be saved.
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => signIn('google')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
                <Button 
                  onClick={() => {
                    setShowAuthPrompt(false);
                    setPendingTraining(false);
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Name *
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., My Portrait Model"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isTraining}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Word *
          </label>
          <input
            type="text"
            value={triggerWord}
            onChange={(e) => setTriggerWord(e.target.value)}
            placeholder="e.g., john_doe (unique identifier for your model)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isTraining}
          />
          <p className="text-xs text-gray-500 mt-1">
            A unique word to activate your model in prompts
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instance Prompt *
          </label>
          <textarea
            value={instancePrompt}
            onChange={(e) => setInstancePrompt(e.target.value)}
            placeholder="e.g., a photo of john_doe person"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={isTraining}
          />
          <p className="text-xs text-gray-500 mt-1">
            How to describe your subject during training (include the trigger word)
          </p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Images *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.zip"
              onChange={handleFileChange}
              className="hidden"
              disabled={isTraining || isUploading}
            />
            
            {uploadedFiles.length === 0 ? (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Upload Training Images
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Upload a ZIP file with 10-30 images, or select individual images
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTraining || isUploading}
                  variant="outline"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Select Files'
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium mb-3">
                  {uploadedFiles.length} file(s) uploaded
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
                        ) : (
                          <FileIcon className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        <span className="text-sm truncate max-w-48">
                          {file.originalName}
                        </span>
                        {file.type === 'application/zip' && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ZIP
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        disabled={isTraining}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTraining || isUploading}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Add More Files
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Best results: 10-30 high-quality images in a ZIP file. Images should be 1024x1024 or larger.
          </p>
        </div>
      </div>

      {/* Progress and Status */}
      {isTraining && status?.id && (
        <ReplicateTrainingLive
          trainingId={status.id}
          onComplete={(modelUrl) => {
            console.log('Training completed with model URL:', modelUrl);
            if (onModelCreated) {
              onModelCreated({
                id: status.id,
                model_id: status.id,
                name: modelName,
                status: 'completed',
                modelVersion: modelUrl
              });
            }
          }}
          onError={(error) => {
            console.error('Training failed:', error);
          }}
          autoRefresh={true}
          refreshInterval={5000}
        />
      )}

      {/* Error Display */}
      {(trainingError || isFailed) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-red-800">Training Failed</h4>
              <p className="text-sm text-red-700">
                {trainingError || 'An error occurred during training. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-medium text-green-800">Training Completed!</h4>
              <p className="text-sm text-green-700">
                Your model has been trained successfully. You can now use it with the trigger word "{triggerWord}".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1"
          disabled={isTraining && !isCompleted && !isFailed}
        >
          {isCompleted || isFailed ? 'Close' : 'Cancel'}
        </Button>
        
        {!isTraining && !isCompleted && (
          <Button
            onClick={handleStartTraining}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            disabled={!isFormValid}
          >
            {!user && !loading ? 'Sign In & Start Training' : 'Start Training'}
          </Button>
        )}

        {isCompleted && (
          <Button
            onClick={handleComplete}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            View Model
          </Button>
        )}

        {(isFailed || trainingError) && (
          <Button
            onClick={reset}
            variant="outline"
            className="flex-1"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModalModelCreation; 