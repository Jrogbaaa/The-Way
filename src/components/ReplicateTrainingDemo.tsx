'use client';

import React, { useState } from 'react';
import { useReplicateTraining } from '@/hooks/useReplicateTraining';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react';

const ReplicateTrainingDemo = () => {
  const {
    isTraining,
    status,
    error,
    startTraining,
    reset,
    isCompleted,
    isFailed,
    progress,
    modelVersion
  } = useReplicateTraining();

  const [formData, setFormData] = useState({
    modelName: '',
    instancePrompt: '',
    trainingImagesZipUrl: '',
    triggerWord: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartTraining = async () => {
    try {
      await startTraining(formData);
    } catch (err) {
      console.error('Training failed:', err);
    }
  };

  const isFormValid = formData.modelName && 
                     formData.instancePrompt && 
                     formData.trainingImagesZipUrl && 
                     formData.triggerWord;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Replicate Model Training
          </CardTitle>
          <CardDescription>
            Train a custom AI model using Replicate's FLUX LoRA trainer.
            This uses the scalable approach where all models become versions of a single destination model.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelName">Model Name</Label>
              <Input
                id="modelName"
                placeholder="e.g., My Portrait Model"
                value={formData.modelName}
                onChange={(e) => handleInputChange('modelName', e.target.value)}
                disabled={isTraining}
              />
            </div>

            <div>
              <Label htmlFor="triggerWord">Trigger Word</Label>
              <Input
                id="triggerWord"
                placeholder="e.g., john_doe"
                value={formData.triggerWord}
                onChange={(e) => handleInputChange('triggerWord', e.target.value)}
                disabled={isTraining}
              />
              <p className="text-sm text-gray-500 mt-1">
                A unique word to trigger your model in prompts
              </p>
            </div>

            <div>
              <Label htmlFor="instancePrompt">Instance Prompt</Label>
              <Textarea
                id="instancePrompt"
                placeholder="e.g., a photo of john_doe person"
                value={formData.instancePrompt}
                onChange={(e) => handleInputChange('instancePrompt', e.target.value)}
                disabled={isTraining}
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                How to describe your subject in training
              </p>
            </div>

            <div>
              <Label htmlFor="zipUrl">Training Images ZIP URL</Label>
              <Input
                id="zipUrl"
                placeholder="https://example.com/training-images.zip"
                value={formData.trainingImagesZipUrl}
                onChange={(e) => handleInputChange('trainingImagesZipUrl', e.target.value)}
                disabled={isTraining}
              />
              <p className="text-sm text-gray-500 mt-1">
                Public URL to a ZIP file containing 10-30 training images
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartTraining}
              disabled={!isFormValid || isTraining}
              className="flex-1"
            >
              {isTraining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                'Start Training'
              )}
            </Button>
            
            {(isCompleted || isFailed || error) && (
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            )}
          </div>

          {/* Status Display */}
          {status && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : isFailed ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Training Status: {status.status}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Training ID:</strong> {status.id}
                </div>

                {modelVersion && (
                  <div className="text-sm text-gray-600">
                    <strong>Model Version:</strong> {modelVersion}
                  </div>
                )}

                {status.logs && (
                  <div>
                    <strong className="text-sm">Latest Logs:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {status.logs.slice(-500)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {isCompleted && modelVersion && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Training completed successfully! Your model version is: <code>{modelVersion}</code>
                <br />
                You can now use this in prompts with the trigger word "{formData.triggerWord}".
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReplicateTrainingDemo; 