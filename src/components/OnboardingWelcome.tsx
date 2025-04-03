'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { ArrowRight, Sparkles, Wand2, PlusCircle, Zap, BarChart, Upload } from 'lucide-react';

interface OnboardingWelcomeProps {
  userName?: string;
  onClose?: () => void;
}

const OnboardingWelcome = ({ userName = 'there', onClose }: OnboardingWelcomeProps) => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modalHeight, setModalHeight] = useState('auto');

  // Add effect to check viewport and adjust modal sizing
  useEffect(() => {
    const checkHeight = () => {
      const viewportHeight = window.innerHeight;
      // If viewport is small, set a max-height with scrolling
      if (viewportHeight < 700) {
        setModalHeight(`${viewportHeight - 80}px`);
      } else {
        setModalHeight('auto');
      }
    };

    checkHeight();
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  // Fix navigation handlers to ensure proper redirection
  const navigateTo = (route: string) => {
    setIsVisible(false);
    // Navigation must happen after component unmounts to prevent conflicts
    setTimeout(() => {
      router.push(route);
      if (onClose) onClose();
    }, 10);
  };

  const handleMakeAIImages = () => {
    navigateTo(ROUTES.cristinaModel); // Direct to Cristina model for AI images of you
  };

  const handleUseExistingModels = () => {
    navigateTo(ROUTES.models); // Direct to models overview
  };

  const handleAnalyzePost = () => {
    navigateTo(ROUTES.socialAnalyzer); // Direct to social analyzer
  };

  const handleSkipToDashboard = () => {
    navigateTo(ROUTES.dashboard); // Direct to dashboard
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div 
        className="w-full max-w-2xl mx-auto my-6 rounded-xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden animate-fade-in-up"
        style={{ maxHeight: modalHeight, overflowY: modalHeight !== 'auto' ? 'auto' : 'visible' }}
      >
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
          
          <div className="p-5 pt-7">
            <div className="mb-4 flex items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="ml-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to The Way, {userName}!</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You're all set up! Now let's create some amazing content.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 rounded-lg p-4">
                <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">
                  Ready to generate customized content?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Choose your preferred way to create content that matches your style.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={handleMakeAIImages}
                  >
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <PlusCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="ml-2 text-base font-medium">Make AI Images of You</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Create personalized AI-generated images featuring you in various styles and scenarios.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 py-1.5 h-auto text-sm"
                      onClick={handleMakeAIImages}
                    >
                      Create AI Images
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={handleUseExistingModels}
                  >
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h3 className="ml-2 text-base font-medium">Use Our Models</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Leverage our pre-trained models for quick, high-quality content generation.
                    </p>
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 py-1.5 h-auto text-sm"
                      onClick={handleUseExistingModels}
                    >
                      Browse Models
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Analyze Post Feature */}
                <div className="mt-4">
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={handleAnalyzePost}
                  >
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BarChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="ml-2 text-base font-medium">Analyze Post</h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      See how our Content AI Agent can help optimize your content for better engagement.
                    </p>
                    
                    <div className="mb-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex flex-col items-center">
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500 text-center">
                          Upload content or paste a link to analyze
                        </p>
                        <input 
                          type="file" 
                          className="hidden" 
                          id="analyze-image" 
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                        <label 
                          htmlFor="analyze-image"
                          className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                        >
                          Select Image
                        </label>
                      </div>
                      
                      {imagePreview && (
                        <div className="mt-2 relative rounded overflow-hidden w-20 h-20 mx-auto">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-1.5 h-auto text-sm"
                      onClick={handleAnalyzePost}
                    >
                      Analyze Content
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex items-start">
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Pro tip:</strong> Upload examples of your previous content or connect your social accounts to analyze your style.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="ghost"
                onClick={handleSkipToDashboard}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 py-1.5 h-auto"
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