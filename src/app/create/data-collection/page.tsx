'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowRight, ArrowLeft, Instagram, Linkedin, Upload, FileText, Sparkles, Check, Plus } from 'lucide-react';

export default function DataCollectionPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };
  
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(Array.from(selectedFiles));
    }
  };
  
  const handleContinue = () => {
    if (!selectedOption) return;
    
    if (selectedOption === 'upload' && files.length > 0) {
      // Simulate content analysis
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setAnalysisComplete(true);
        
        // After a brief delay, proceed to next step
        setTimeout(() => {
          router.push('/create/ideas');
        }, 1500);
      }, 3000);
    } else if (selectedOption === 'connect') {
      // For demo purposes, we'll simulate connecting accounts and skip to analysis
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setAnalysisComplete(true);
        
        // After a brief delay, proceed to next step
        setTimeout(() => {
          router.push('/create/ideas');
        }, 1500);
      }, 3000);
    } else if (selectedOption === 'fresh') {
      // If starting fresh, skip analysis and go directly to next step
      router.push('/create/ideas');
    }
  };

  return (
    <MainLayout showSidebar={false}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => router.push('/create/intent')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium uppercase text-indigo-600 dark:text-indigo-400">Step 2 of 4: Data Collection</div>
            </div>
          </div>
          
          <div className="mt-4 h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>
        
        <div className="space-y-6 mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? 'Analyzing your content style...' : 
             analysisComplete ? 'Analysis complete!' : 
             'To personalize your content, I need to learn about your style'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {isLoading ? 'This will take just a moment. We\'re analyzing content patterns, audience engagement, and style elements...' : 
             analysisComplete ? 'Great! We\'ve learned about your style preferences and audience. Moving to the next step...' : 
             'Choose one of the options below to help our AI understand your brand voice and content preferences.'}
          </p>
        </div>
        
        {/* Loading and analysis state */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 mb-8">
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-progress" style={{ width: '70%' }}></div>
              </div>
              
              <div className="text-center space-y-3 mb-6">
                <p className="font-medium">Analyzing content style</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This usually takes 15-30 seconds</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg animate-pulse">
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Analysis complete state */}
        {analysisComplete && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm border border-green-200 dark:border-green-800 p-8 mb-8">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3 mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-400 mb-2">Analysis Complete!</h3>
              <p className="text-center text-green-700 dark:text-green-300 mb-6">
                We've identified your content style and audience preferences
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tone</p>
                  <p className="font-medium">Professional</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Style</p>
                  <p className="font-medium">Informative</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Best Platform</p>
                  <p className="font-medium">LinkedIn</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Top Format</p>
                  <p className="font-medium">Carousel</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Options for data collection */}
        {!isLoading && !analysisComplete && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {/* Connect social accounts */}
            <button
              onClick={() => handleOptionSelect('connect')}
              className={`flex flex-col p-6 rounded-xl border text-left transition-all duration-200 h-full ${
                selectedOption === 'connect' 
                  ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
            >
              <div className={`mb-4 rounded-full p-3 w-14 h-14 flex items-center justify-center ${
                selectedOption === 'connect' 
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <Sparkles className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">Connect social accounts</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                We'll analyze your existing content to understand your brand voice and audience.
              </p>
              
              <div className="mt-auto flex gap-2">
                <div className="p-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="p-2 rounded-full bg-blue-600">
                  <Linkedin className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className={`mt-4 h-6 w-6 self-end rounded-full border ${
                selectedOption === 'connect'
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-300 dark:border-gray-700'
              }`}>
                {selectedOption === 'connect' && (
                  <svg className="h-full w-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
            
            {/* Upload past content */}
            <button
              onClick={() => handleOptionSelect('upload')}
              className={`flex flex-col p-6 rounded-xl border text-left transition-all duration-200 h-full ${
                selectedOption === 'upload' 
                  ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
            >
              <div className={`mb-4 rounded-full p-3 w-14 h-14 flex items-center justify-center ${
                selectedOption === 'upload' 
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <Upload className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">Upload past content</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Upload examples of your content to help us understand your style.
              </p>
              
              {files.length > 0 ? (
                <div className="mt-auto grid grid-cols-3 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md relative overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded file ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-auto border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Click to upload content
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              
              <div className={`mt-4 h-6 w-6 self-end rounded-full border ${
                selectedOption === 'upload'
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-300 dark:border-gray-700'
              }`}>
                {selectedOption === 'upload' && (
                  <svg className="h-full w-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
            
            {/* Start fresh */}
            <button
              onClick={() => handleOptionSelect('fresh')}
              className={`flex flex-col p-6 rounded-xl border text-left transition-all duration-200 h-full ${
                selectedOption === 'fresh' 
                  ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
            >
              <div className={`mb-4 rounded-full p-3 w-14 h-14 flex items-center justify-center ${
                selectedOption === 'fresh' 
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <ArrowRight className="h-6 w-6" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">Start fresh</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                Skip this step and start creating new content from scratch.
              </p>
              
              <div className="mt-auto text-sm text-gray-500 dark:text-gray-400 italic">
                Note: Content will be less personalized to your brand.
              </div>
              
              <div className={`mt-4 h-6 w-6 self-end rounded-full border ${
                selectedOption === 'fresh'
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'border-gray-300 dark:border-gray-700'
              }`}>
                {selectedOption === 'fresh' && (
                  <svg className="h-full w-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        )}
        
        {/* Upload area when upload option is selected */}
        {selectedOption === 'upload' && !isLoading && !analysisComplete && (
          <div className="mb-12">
            <div 
              onClick={handleFileUpload}
              className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center transition-all duration-200 hover:border-indigo-600 dark:hover:border-indigo-500"
            >
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3 mb-4">
                  <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-medium mb-1">Drop your files here or click to browse</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Accept images, PDFs, and documents (max 5 files)
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Selected files ({files.length})</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Uploaded file ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-6 w-6 text-gray-500" />
                          <span className="text-xs absolute bottom-1 left-1 right-1 truncate text-center">{file.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Connect accounts UI when connect option is selected */}
        {selectedOption === 'connect' && !isLoading && !analysisComplete && (
          <div className="mb-12 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-medium mb-4">Connect your social accounts</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select the platforms you want to connect. We'll analyze your content to understand your style.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-200">
                <div className="p-2 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mr-4">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Instagram</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connect your Instagram account</p>
                </div>
                <div className="ml-4 rounded-md border border-gray-300 dark:border-gray-700 p-1">
                  <Check className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-600 dark:hover:border-blue-600 transition-all duration-200">
                <div className="p-2 rounded-full bg-blue-600 mr-4">
                  <Linkedin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">LinkedIn</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connect your LinkedIn profile</p>
                </div>
                <div className="ml-4 rounded-md border border-gray-300 dark:border-gray-700 p-1">
                  <Check className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200">
                <div className="p-2 rounded-full bg-blue-400 mr-4">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Twitter</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connect your Twitter account</p>
                </div>
                <div className="ml-4 rounded-md border border-gray-300 dark:border-gray-700 p-1">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </button>
              
              <button className="flex items-center p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-600 transition-all duration-200">
                <div className="p-2 rounded-full bg-red-600 mr-4">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">YouTube</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connect your YouTube channel</p>
                </div>
                <div className="ml-4 rounded-md border border-gray-300 dark:border-gray-700 p-1">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
              By connecting your accounts, you grant us read-only access to analyze your content. We won't post anything without your permission.
            </p>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/create/intent')}
            className="px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!selectedOption || (selectedOption === 'upload' && files.length === 0 && !isLoading && !analysisComplete)}
            className={`px-6 ${(!selectedOption || (selectedOption === 'upload' && files.length === 0 && !isLoading && !analysisComplete)) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Analyzing...' : 
             analysisComplete ? 'Continuing...' : 
             'Continue'}
            {!isLoading && !analysisComplete && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear;
        }
      `}</style>
    </MainLayout>
  );
} 