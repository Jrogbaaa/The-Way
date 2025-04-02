'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import { ImageIcon, Share2, Users, Calendar, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react';

type IntentOption = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  nextStep: string;
};

export default function IntentCapturePage() {
  const router = useRouter();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  
  const intentOptions: IntentOption[] = [
    {
      id: 'new-posts',
      title: 'Create new social posts',
      description: 'Generate fresh content optimized for your target audience',
      icon: <ImageIcon className="h-6 w-6" />,
      examples: ['Product announcements', 'Trending topics', 'Brand storytelling'],
      nextStep: '/create/data-collection'
    },
    {
      id: 'targeted-mentions',
      title: 'Find relevant @mentions',
      description: 'Discover accounts to tag for maximum visibility and engagement',
      icon: <Share2 className="h-6 w-6" />,
      examples: ['Industry influencers', 'Potential collaborators', 'Target audience communities'],
      nextStep: '/create/data-collection'
    },
    {
      id: 'content-calendar',
      title: 'Schedule content calendar',
      description: 'Plan your content strategy across multiple platforms',
      icon: <Calendar className="h-6 w-6" />,
      examples: ['Weekly posting schedule', 'Campaign timelines', 'Content themes'],
      nextStep: '/create/data-collection'
    },
    {
      id: 'analyze-performance',
      title: 'Analyze performance',
      description: 'Get insights on your existing content with AI recommendations',
      icon: <Users className="h-6 w-6" />,
      examples: ['Engagement metrics', 'Audience insights', 'Content optimization'],
      nextStep: '/create/data-collection'
    },
    {
      id: 'repurpose-content',
      title: 'Repurpose existing content',
      description: 'Transform your content for different platforms and formats',
      icon: <RefreshCcw className="h-6 w-6" />,
      examples: ['Blog to social posts', 'Video to carousel', 'Long-form to threads'],
      nextStep: '/create/data-collection'
    }
  ];
  
  const handleContinue = () => {
    if (selectedIntent) {
      const selected = intentOptions.find(option => option.id === selectedIntent);
      if (selected) {
        router.push(selected.nextStep);
      }
    }
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => router.push('/welcome')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium uppercase text-indigo-600 dark:text-indigo-400">Step 1 of 4: Intent</div>
            </div>
          </div>
          
          <div className="mt-4 h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>
        
        <div className="space-y-6 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">What are you trying to do today?</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select your goal so we can provide the most relevant tools and guidance.
          </p>
        </div>
        
        {/* Intent options */}
        <div className="grid gap-4 mb-12">
          {intentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedIntent(option.id)}
              className={`flex flex-col md:flex-row md:items-center p-6 rounded-xl border text-left transition-all duration-200 ${
                selectedIntent === option.id 
                  ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center mb-4 md:mb-0 md:mr-6 ${
                selectedIntent === option.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {option.icon}
              </div>
              
              <div className="flex-1">
                <h3 className={`font-medium text-lg ${
                  selectedIntent === option.id ? 'text-indigo-700 dark:text-indigo-400' : ''
                }`}>
                  {option.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{option.description}</p>
                
                {/* Examples shown when selected */}
                {selectedIntent === option.id && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.examples.map((example, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className={`md:ml-4 flex-shrink-0 mt-4 md:mt-0 h-6 w-6 rounded-full border ${
                selectedIntent === option.id
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-300 dark:border-gray-700'
              }`}>
                {selectedIntent === option.id && (
                  <svg className="h-full w-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/welcome')}
            className="px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!selectedIntent}
            className={`px-6 ${!selectedIntent ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
} 