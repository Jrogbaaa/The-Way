'use client';

import React from 'react';
import VideoGenerator from '@/components/video/VideoGenerator';
import MainLayout from '@/components/layout/MainLayout';

export default function VideoDemo() {
  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8 text-center">
          AI Video Generation
        </h1>
        
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 mb-8 text-center">
            Upload any image and convert it into a short video using AI - no cost, no complicated settings.
          </p>
          
          <VideoGenerator 
            onVideoGenerated={(url) => {
              console.log("Video successfully generated:", url);
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
} 