'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket } from 'lucide-react';

export default function UploadPostPage() {
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-12">
        <div className="mb-6">
          <Link href={ROUTES.dashboard} className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 mb-6">
              <Rocket className="h-10 w-10 text-indigo-600" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Content Analysis Coming Soon</h1>
            
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              We're working hard to bring you our content analysis feature. This tool will let you upload posts and get AI-powered engagement predictions, improvement suggestions, and detailed analytics.
            </p>
            
            <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold mb-3">Feature Highlights</h3>
              <ul className="text-left text-gray-700 space-y-3">
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-500 font-bold">•</span>
                  <span>Engagement prediction based on platform-specific algorithms</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-500 font-bold">•</span>
                  <span>Content improvements with AI-generated alternatives</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-500 font-bold">•</span>
                  <span>Hashtag recommendations for maximum reach</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-500 font-bold">•</span>
                  <span>Caption optimization for better engagement</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Button onClick={() => window.history.back()}>
                Return to Previous Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 