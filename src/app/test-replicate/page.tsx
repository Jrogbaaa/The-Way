'use client';

import React from 'react';
import ReplicateTrainingDemo from '@/components/ReplicateTrainingDemo';
import MainLayout from '@/components/layout/MainLayout';

export default function TestReplicatePage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Replicate Training Test</h1>
            <p className="text-gray-600">
              Test the new scalable Replicate training system that creates model versions 
              instead of separate models, solving the API limits issue.
            </p>
          </div>
          
          <ReplicateTrainingDemo />
          
          <div className="mt-12 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">How This Works</h2>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Scalable:</strong> All custom models become versions of a single destination model</li>
              <li>• <strong>No Limits:</strong> Bypasses Replicate's model creation limits</li>
              <li>• <strong>Persistent:</strong> Models saved to your database and won't disappear</li>
              <li>• <strong>Fast:</strong> Uses FLUX LoRA trainer for high-quality results</li>
              <li>• <strong>User-specific:</strong> Each user's models are properly isolated</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 