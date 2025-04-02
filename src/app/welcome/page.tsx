'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowRight, ImageIcon, BarChart2, Calendar, RefreshCcw, Zap } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  
  const handleStartWorkflow = () => {
    // Navigate to the first step of content creation flow
    router.push('/create/intent');
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          {/* Progress steps indicator */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">1</div>
              <div className="ml-2 text-sm font-medium">Welcome</div>
            </div>
            <div className="w-6 h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center text-sm font-medium">2</div>
              <div className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Intent</div>
            </div>
            <div className="w-6 h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center text-sm font-medium">3</div>
              <div className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Content</div>
            </div>
            <div className="w-6 h-px bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center text-sm font-medium">4</div>
              <div className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">Publish</div>
            </div>
          </div>
          
          {/* Skip button */}
          <button
            onClick={() => router.push(ROUTES.dashboard)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Skip to dashboard
          </button>
        </div>
        
        <div className="space-y-6 mb-12">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome! Let's create your first content
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            We've designed a simple, step-by-step process to help you create engaging social media content that resonates with your audience.
          </p>
        </div>
        
        {/* Workflow preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">How it works</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Tell us your intent</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select what kind of content you want to create</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Connect your style</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload examples or connect your social accounts</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Choose from AI ideas</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Select from personalized content suggestions</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 mr-3 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Refine and publish</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Make final adjustments and export or schedule</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">What would you like to create?</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 text-center"
                  onClick={handleStartWorkflow}
                >
                  <ImageIcon className="h-8 w-8 mb-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium">Social Post</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 text-center"
                  onClick={handleStartWorkflow}
                >
                  <Calendar className="h-8 w-8 mb-2 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-medium">Content Calendar</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 text-center"
                  onClick={handleStartWorkflow}
                >
                  <BarChart2 className="h-8 w-8 mb-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Analyze Content</span>
                </button>
                <button
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 text-center"
                  onClick={handleStartWorkflow}
                >
                  <RefreshCcw className="h-8 w-8 mb-2 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium">Repurpose Content</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleStartWorkflow}
            className="px-8 py-3 text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          >
            Create your first post
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.dashboard)}
            className="px-8 py-3 text-base"
          >
            Explore dashboard
          </Button>
        </div>
        
        {/* Quick tips */}
        <div className="mt-12 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="flex items-start">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Pro tip:</strong> Connect your social media accounts to enable AI analysis of your existing content style and audience preferences.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 