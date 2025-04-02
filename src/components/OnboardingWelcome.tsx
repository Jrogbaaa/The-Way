'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { ArrowRight, Sparkles, Wand2, PlusCircle, Zap } from 'lucide-react';
import Link from 'next/link';

interface OnboardingWelcomeProps {
  userName?: string;
  onClose?: () => void;
}

const OnboardingWelcome = ({ userName = 'there', onClose }: OnboardingWelcomeProps) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  const handleCreateModel = () => {
    setIsVisible(false);
    if (onClose) onClose();
    router.push(ROUTES.createModel);
  };

  const handleUseExistingModels = () => {
    setIsVisible(false);
    if (onClose) onClose();
    router.push(ROUTES.models);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
          
          <div className="p-8">
            <div className="mb-6 flex items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to The Way, {userName}!</h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  You're all set up! Now let's create some amazing content.
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Ready to generate customized content for social media?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Choose your preferred way to create content that matches your style and resonates with your audience.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={handleCreateModel}
                  >
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <PlusCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium">Make Your Own Model</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Create a custom AI model trained on your unique style and brand voice for consistent, personalized content.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      onClick={handleCreateModel}
                    >
                      Create Custom Model
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={handleUseExistingModels}
                  >
                    <div className="flex items-center mb-4">
                      <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="ml-3 text-lg font-medium">Use Our Models</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Leverage our pre-trained models for quick, high-quality content generation across different styles and formats.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      onClick={handleUseExistingModels}
                    >
                      Browse Models
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex items-start">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Pro tip:</strong> For the best results, upload examples of your previous content or connect your social media accounts to analyze your style.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsVisible(false);
                  if (onClose) onClose();
                  router.push(ROUTES.dashboard);
                }}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Skip to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome; 