'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';

interface TrainingLog {
  id: string;
  replicateId?: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  progress: number;
  stage: string;
  logs: string;
  recentLogs: string[];
  error?: string;
  estimatedTimeRemaining?: number;
  createdAt: string;
  modelUrl?: string;
}

interface ReplicateTrainingLiveProps {
  trainingId: string;
  onComplete?: (modelUrl: string) => void;
  onError?: (error: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ReplicateTrainingLive: React.FC<ReplicateTrainingLiveProps> = ({
  trainingId,
  onComplete,
  onError,
  autoRefresh = true,
  refreshInterval = 5000 // 5 seconds
}) => {
  const [trainingData, setTrainingData] = useState<TrainingLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTrainingLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/replicate/training-logs/${trainingId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch training logs: ${response.status}`);
      }

      const data = await response.json();
      setTrainingData(data);
      setLastUpdate(new Date());
      setError(null);

      // Handle completion
      if (data.status === 'succeeded' && data.modelUrl && onComplete) {
        onComplete(data.modelUrl);
      }

      // Handle errors
      if (data.status === 'failed' && data.error && onError) {
        onError(data.error);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching training logs:', err);
    } finally {
      setLoading(false);
    }
  }, [trainingId, onComplete, onError]);

  // Auto-refresh effect
  useEffect(() => {
    fetchTrainingLogs();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if training is still active
      if (trainingData?.status === 'starting' || trainingData?.status === 'processing') {
        fetchTrainingLogs();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchTrainingLogs, autoRefresh, refreshInterval, trainingData?.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      case 'starting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'starting': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeRemaining = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  if (loading && !trainingData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading training status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !trainingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600 mb-4">
            <XCircle className="h-5 w-5 mr-2" />
            <span>Error loading training status</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTrainingLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(trainingData?.status || 'starting')}
            <div>
              <CardTitle className="text-lg font-semibold">Training Progress</CardTitle>
              {trainingData?.stage && (
                <CardDescription className="mt-1 text-gray-600">
                  Stage: {trainingData.stage}
                  {trainingData.estimatedTimeRemaining && (
                    <> • ETA: {formatTimeRemaining(trainingData.estimatedTimeRemaining)}</>
                  )}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor(trainingData?.status || 'starting')} text-white border-0`}>
              {trainingData?.status || 'unknown'}
            </Badge>
            <Button onClick={fetchTrainingLogs} variant="outline" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-gray-700">Progress</span>
            <span className="text-gray-900">{trainingData?.progress || 0}%</span>
          </div>
          <Progress value={trainingData?.progress || 0} className="w-full h-3" />
        </div>

        {/* Error Display */}
        {trainingData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Training Failed</h4>
                <p className="text-sm text-red-700 mt-1">{trainingData.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {trainingData?.status === 'succeeded' && trainingData?.modelUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Training Completed!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your model is ready for use.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-100">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReplicateTrainingLive; 