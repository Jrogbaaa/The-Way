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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(trainingData?.status || 'starting')}
            <CardTitle className="text-lg">Training Progress</CardTitle>
            <Badge className={getStatusColor(trainingData?.status || 'starting')}>
              {trainingData?.status || 'unknown'}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {trainingData?.replicateId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://replicate.com/p/${trainingData.replicateId}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on Replicate
              </Button>
            )}
            <Button onClick={fetchTrainingLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {trainingData?.stage && (
          <CardDescription>
            Stage: {trainingData.stage}
            {trainingData.estimatedTimeRemaining && (
              <> • ETA: {formatTimeRemaining(trainingData.estimatedTimeRemaining)}</>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{trainingData?.progress || 0}%</span>
          </div>
          <Progress value={trainingData?.progress || 0} className="w-full h-2" />
        </div>

        {/* Recent Logs */}
        {trainingData?.recentLogs && trainingData.recentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="bg-gray-950 text-green-400 p-3 rounded-lg font-mono text-xs max-h-32 overflow-y-auto">
              {trainingData.recentLogs.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {trainingData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
              <div>
                <h4 className="font-medium text-red-800">Training Failed</h4>
                <p className="text-sm text-red-700 mt-1">{trainingData.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {trainingData?.status === 'succeeded' && trainingData?.modelUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Training Completed!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your model is ready for use.
                </p>
                <p className="text-xs text-green-600 mt-2 font-mono break-all">
                  Model: {trainingData.modelUrl}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReplicateTrainingLive; 