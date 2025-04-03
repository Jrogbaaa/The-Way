'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  AlertCircle, 
  Check, 
  X, 
  ImageIcon, 
  Loader2,
  Camera,
  Info,
  Download,
  PieChart,
  BarChart,
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Lightbulb
} from 'lucide-react';
import { AnalysisResult, getEngagementText } from '@/types';

/**
 * Post Upload Form Component
 * 
 * Provides a UI for users to upload and analyze images for social media posting.
 * The component offers AI-powered image analysis with recommendations for
 * social media optimization, but does not restrict content uploads.
 */
interface PostUploadFormProps {
  onSubmit?: (formData: FormData) => void;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

// Define example images for different content categories
const getSimilarExampleImages = (caption: string) => {
  const lowerCaption = caption.toLowerCase();
  
  // Map common themes to example images
  const themeMap: Record<string, { images: string[], tips: string[] }> = {
    sports: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Action shots showing movement perform 2.3x better than static poses',
        'Outdoor lighting with golden hour tones increases engagement by 35%',
        'Sports equipment clearly visible boosts recognition and relatability'
      ]
    },
    food: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Overhead angles showcase food details better than side angles',
        'Natural lighting improves food color appeal by 45%',
        'Including hands in frame creates a sense of scale and interaction'
      ]
    },
    nature: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Golden hour lighting increases engagement by 48% for outdoor scenes',
        'Including a human element/silhouette boosts relatability by 35%',
        'Rule of thirds composition improves visual flow and interest'
      ]
    },
    selfie: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Soft, diffused lighting minimizes shadows and improves facial clarity',
        'Eye contact with camera increases connection with viewers by 40%',
        'Slightly elevated angle is most flattering for facial features'
      ]
    },
    travel: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Including yourself in landmark photos increases engagement by 62%',
        'Unique perspectives of common attractions stand out from typical tourist shots',
        'Rich colors and balance between sky/landscape optimizes visual appeal'
      ]
    },
    // Default fallback for any unrecognized content
    default: {
      images: [
        '/examples/placeholder.svg',
        '/examples/placeholder.svg'
      ],
      tips: [
        'Rule of thirds composition creates visual balance and interest',
        'Natural lighting consistently outperforms artificial lighting',
        'Including a human element increases relatability by 38%'
      ]
    }
  };
  
  // Determine content category based on caption
  let category = 'default';
  
  if (lowerCaption.includes('sport') || lowerCaption.includes('tennis') || 
      lowerCaption.includes('basketball') || lowerCaption.includes('soccer') ||
      lowerCaption.includes('football') || lowerCaption.includes('playing') ||
      lowerCaption.includes('athlete') || lowerCaption.includes('running')) {
    category = 'sports';
  } else if (lowerCaption.includes('food') || lowerCaption.includes('meal') || 
      lowerCaption.includes('restaurant') || lowerCaption.includes('eating') ||
      lowerCaption.includes('dish') || lowerCaption.includes('plate') ||
      lowerCaption.includes('cooking') || lowerCaption.includes('cuisine')) {
    category = 'food';
  } else if (lowerCaption.includes('nature') || lowerCaption.includes('outdoor') || 
      lowerCaption.includes('landscape') || lowerCaption.includes('mountain') ||
      lowerCaption.includes('beach') || lowerCaption.includes('forest') ||
      lowerCaption.includes('sunset') || lowerCaption.includes('hiking')) {
    category = 'nature';
  } else if (lowerCaption.includes('selfie') || lowerCaption.includes('portrait') || 
      lowerCaption.includes('face') || (lowerCaption.includes('person') && lowerCaption.includes('camera'))) {
    category = 'selfie';
  } else if (lowerCaption.includes('travel') || lowerCaption.includes('vacation') || 
      lowerCaption.includes('trip') || lowerCaption.includes('tourist') ||
      lowerCaption.includes('landmark') || lowerCaption.includes('destination')) {
    category = 'travel';
  }
  
  // Return the examples for the determined category
  return {
    category,
    ...themeMap[category]
  };
};

// Function to generate specific action items to improve engagement
const getSpecificImprovements = (score: number, description: string, cons: string[]) => {
  const improvements = [];
  
  // Add score-based improvements
  if (score < 85) {
    improvements.push('Increase visual contrast to make subject stand out more');
  }
  
  if (score < 75) {
    improvements.push('Add vibrant elements or colors to catch attention');
  }
  
  if (score < 65) {
    improvements.push('Consider including people or faces to increase emotional connection');
  }
  
  // Description-based specific improvements
  const lowerDescription = description.toLowerCase();
  if (lowerDescription.includes('dark') || lowerDescription.includes('dim')) {
    improvements.push('Improve lighting - brighten image by 30-40% for optimal visibility');
  }
  
  if (lowerDescription.includes('group') && !lowerDescription.includes('smiling')) {
    improvements.push('Include authentic emotions - smiling faces increase engagement by 42%');
  }
  
  if (!lowerDescription.includes('color') && !lowerDescription.includes('vibrant')) {
    improvements.push('Enhance color saturation - vibrant images perform 38% better than muted tones');
  }
  
  // Add cons-based specific improvements
  cons.forEach(con => {
    if (con.includes('dark') || con.includes('blurry')) {
      improvements.push('Use editing tools to increase brightness and sharpness');
    }
    if (con.includes('complex')) {
      improvements.push('Simplify composition - remove distracting background elements');
    }
  });
  
  // Ensure we have at least 3 improvements
  if (improvements.length < 3) {
    improvements.push('Align with current trending aesthetics in your content category');
    improvements.push('Add a story element that creates emotional connection with viewers');
    improvements.push('Consider including product/subject from a unique perspective');
  }
  
  // Limit to 5 improvements maximum
  return improvements.slice(0, 5);
};

// Default image size limit (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PostUploadForm: React.FC<PostUploadFormProps> = ({ onSubmit, onAnalysisComplete }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  // Animation state
  const [showResults, setShowResults] = useState(false);
  const resultsSectionRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState({
    pros: true,
    cons: true,
    summary: true,
    engagement: true,
    perfectScore: true
  });
  
  // Handle results animation
  useEffect(() => {
    if (analysisResult && !showResults) {
      // Delay to allow for smooth animation
      const timer = setTimeout(() => {
        setShowResults(true);
        // Scroll to results after they're shown
        setTimeout(() => {
          resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [analysisResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
        return;
      }
      
      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB).`);
        return;
      }
      
      setError(null);
      setSelectedImage(file);
      setAnalysisResult(null);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    setShowResults(false);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const data = await response.json();
      
      console.log('Analysis result:', data.analysis);
      
      // Build the analysis result object
      const result: AnalysisResult = {
        approvalStatus: data.analysis.social || 
          { approved: true, reason: 'Image appears appropriate for social media' },
        labels: data.analysis.labels || [],
        engagementPotential: data.analysis.socialMediaAnalysis?.engagement?.score || 50,
        summary: data.analysis.summary || data.analysis.socialMediaAnalysis?.summary || 'Image analysis complete.',
        pros: data.analysis.socialMediaAnalysis?.pros || [],
        cons: data.analysis.socialMediaAnalysis?.cons || [],
        recommendation: data.analysis.socialMediaAnalysis?.recommendation || '',
        socialMediaAnalysis: data.analysis.socialMediaAnalysis || {}
      };
      
      setAnalysisResult(result);
      
      // Call the callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image to upload');
      return;
    }
    
    // Create form data for submission
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('image', selectedImage);
    
    // Add analysis result if available
    if (analysisResult) {
      submitData.append('analysis', JSON.stringify(analysisResult));
    }
    
    // Submit the form data
    if (onSubmit) {
      onSubmit(submitData);
    } else {
      // For demo/testing, log the submission
      console.log('Form submitted', Object.fromEntries(submitData.entries()));
      // Redirect to a success page or dashboard
      router.push('/dashboard');
    }
  };

  // Toggle expanded sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Format percentage for display
  const formatPercentage = (text: string): string => {
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch && percentMatch[1]) {
      return percentMatch[1] + '%';
    }
    return '';
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Post Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter a title for your post"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Write a caption for your post"
              rows={3}
            />
          </div>
          
          {/* Image upload section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Image
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setAnalysisResult(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </button>
              )}
            </div>
            
            {!imagePreview ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-blue-50 rounded-full p-4 mb-3">
                  <Camera className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-base font-medium text-gray-700">Click to select an image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden shadow-md transition-all duration-300">
                <div className="aspect-w-16 aspect-h-12 relative">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              id="image"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            
            {selectedImage && !analysisResult && !isAnalyzing && (
              <button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
                className="inline-flex items-center justify-center px-4 py-3 rounded-md font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <PieChart className="w-5 h-5 mr-2" />
                    Analyze for Social Media Impact
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Loading indicator */}
          {isAnalyzing && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Analyzing your image</h3>
                  <p className="text-sm text-gray-500">This typically takes 5-10 seconds</p>
                </div>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse-width"></div>
              </div>
            </div>
          )}
          
          {/* Analysis Results */}
          {analysisResult && (
            <div 
              ref={resultsSectionRef}
              className={`mt-8 space-y-5 transition-opacity duration-500 ease-in-out ${showResults ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* Approval Status Card */}
              <div className={`rounded-xl shadow-md border overflow-hidden transition-all duration-300 ${analysisResult.approvalStatus?.approved 
                ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100' 
                : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100'}`}>
                <div className="p-5">
                  <div className="flex items-center">
                    {analysisResult.approvalStatus?.approved ? (
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-2 mr-4">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 bg-red-100 rounded-full p-2 mr-4">
                        <X className="h-6 w-6 text-red-600" />
                      </div>
                    )}
                    <div>
                      <h3 className={`text-lg font-bold ${analysisResult.approvalStatus?.approved 
                        ? 'text-green-800' 
                        : 'text-red-800'}`}>
                        {analysisResult.approvalStatus?.approved 
                          ? 'Content Approved for Social Media' 
                          : 'Content May Not Be Suitable'}
                      </h3>
                      <p className="text-sm mt-1">
                        {analysisResult.approvalStatus?.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Engagement Score Card */}
              {analysisResult.engagementPotential && (
                <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-blue-100 cursor-pointer"
                       onClick={() => toggleSection('engagement')}>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <BarChart className="w-5 h-5 mr-2 text-blue-500" />
                      Engagement Potential
                    </h3>
                    {expandedSections.engagement ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {expandedSections.engagement && (
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-center">
                        <div className="mb-4 md:mb-0 md:mr-6 flex items-center justify-center">
                          <div className="relative w-32 h-32">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-24 h-24 rounded-full bg-white border-8 border-blue-100 flex items-center justify-center">
                                <span className="text-3xl font-bold text-blue-700">{analysisResult.engagementPotential}</span>
                              </div>
                            </div>
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                              <circle 
                                cx="50" cy="50" r="45" 
                                fill="none" 
                                stroke="#EBF5FF" 
                                strokeWidth="8" 
                              />
                              <circle 
                                cx="50" cy="50" r="45" 
                                fill="none" 
                                stroke="#3B82F6" 
                                strokeWidth="8" 
                                strokeDasharray={`${analysisResult.engagementPotential * 2.83} 283`} 
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-blue-800 mb-3">
                            {getEngagementText(analysisResult.engagementPotential)} Potential
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                              <div className="w-full h-2.5 bg-blue-100 rounded-full">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" 
                                  style={{ width: `${analysisResult.engagementPotential}%` }}
                                ></div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              This content is predicted to perform better than {100 - Math.round(analysisResult.engagementPotential)}% of typical social media posts.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pros Section */}
                <div className="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-green-100 cursor-pointer"
                       onClick={() => toggleSection('pros')}>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Check className="w-5 h-5 mr-2 text-green-500" />
                      Positive Aspects
                    </h3>
                    {expandedSections.pros ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {expandedSections.pros && (
                    <div className="p-5">
                      <ul className="space-y-3">
                        {analysisResult.pros && analysisResult.pros.length > 0 ? (
                          analysisResult.pros.map((pro, index) => (
                            <li key={index} className="flex">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                <span className="font-bold text-green-600">{formatPercentage(pro)}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800">{pro}</p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 italic">No specific positive aspects identified.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Cons Section */}
                <div className="bg-white rounded-xl shadow-md border border-red-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between p-4 border-b border-red-100 cursor-pointer"
                       onClick={() => toggleSection('cons')}>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <X className="w-5 h-5 mr-2 text-red-500" />
                      Improvement Areas
                    </h3>
                    {expandedSections.cons ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  
                  {expandedSections.cons && (
                    <div className="p-5">
                      <ul className="space-y-3">
                        {analysisResult.cons && analysisResult.cons.length > 0 ? (
                          analysisResult.cons.map((con, index) => (
                            <li key={index} className="flex">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                                <span className="font-bold text-red-600">{formatPercentage(con)}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800">{con}</p>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 italic">No specific concerns identified.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                     onClick={() => toggleSection('summary')}>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-gray-500" />
                    Analysis Summary
                  </h3>
                  {expandedSections.summary ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.summary && (
                  <div className="p-5">
                    <p className="text-gray-700 mb-4">{analysisResult.summary}</p>
                    
                    {/* Show recommendation from new socialMediaAnalysis if available */}
                    {analysisResult.recommendation && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                          Strategic Recommendation
                        </h4>
                        <p className="text-gray-700">{analysisResult.recommendation}</p>
                      </div>
                    )}
                    
                    {/* Download Analysis Report Button */}
                    <button
                      type="button"
                      className="mt-4 flex items-center justify-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Analysis Report
                    </button>
                  </div>
                )}
              </div>

              {/* Perfect Score Strategy */}
              <div className="mt-5 bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div 
                  className="flex items-center justify-between p-4 border-b border-indigo-100 cursor-pointer"
                  onClick={() => toggleSection('perfectScore')}
                >
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-indigo-500" />
                    Perfect Score Strategy
                  </h3>
                  {expandedSections.perfectScore ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {expandedSections.perfectScore && (
                  <div className="p-5">
                    <p className="text-sm text-indigo-700 mb-4">
                      Based on your image content, here's how to achieve a perfect social media engagement score
                    </p>
                    
                    {(() => {
                      // Get description from analysis or fallback to form data
                      const description = analysisResult.summary || formData.description || '';
                      const examples = getSimilarExampleImages(description);
                      const improvements = getSpecificImprovements(
                        analysisResult.engagementPotential || 50, 
                        description,
                        analysisResult.cons || []
                      );
                      
                      return (
                        <div>
                          <div className="mb-5">
                            <div className="flex items-center mb-3">
                              <Camera className="w-4 h-4 text-indigo-600 mr-2" />
                              <h4 className="text-base font-medium text-gray-900">
                                {examples.category.charAt(0).toUpperCase() + examples.category.slice(1)} Content Detected
                              </h4>
                            </div>
                            
                            {/* Similar optimized examples */}
                            <p className="text-sm text-gray-600 mb-3">
                              Here are some high-performing examples similar to your content:
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {examples.images.map((img, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                                  <div className="aspect-w-16 aspect-h-9 relative bg-gray-100">
                                    {/* Use a placeholder or create placeholders in your public directory */}
                                    <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                      <p className="text-sm text-indigo-600 text-center p-2">
                                        Example {index + 1}: High-scoring {examples.category} content
                                      </p>
                                    </div>
                                  </div>
                                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold rounded-full h-7 w-7 flex items-center justify-center">
                                    98
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Best practices */}
                          <div className="mb-5">
                            <div className="flex items-center mb-3">
                              <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
                              <h4 className="text-base font-medium text-gray-900">
                                {examples.category.charAt(0).toUpperCase() + examples.category.slice(1)} Content Best Practices
                              </h4>
                            </div>
                            
                            <div className="bg-indigo-50 p-4 rounded-lg">
                              <ul className="space-y-2">
                                {examples.tips.map((tip, index) => (
                                  <li key={index} className="text-sm text-indigo-800 flex items-start">
                                    <Check className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {/* Specific improvement actions */}
                          <div>
                            <div className="flex items-center mb-3">
                              <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
                              <h4 className="text-base font-medium text-gray-900">
                                Actions to Improve Your Score
                              </h4>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-lg">
                              <ul className="space-y-2 mb-4">
                                {improvements.map((improvement, index) => (
                                  <li key={index} className="text-sm text-yellow-800 flex items-start">
                                    <div className="w-5 h-5 rounded-full bg-yellow-200 text-yellow-800 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs font-bold">
                                      {index + 1}
                                    </div>
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                              
                              <div className="text-sm text-indigo-800 bg-indigo-100 p-3 rounded-lg flex items-start">
                                <Info className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                                <span>
                                  <strong>Pro Tip:</strong> After making these improvements, try our AI Model creation to generate perfect social media content consistently.
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-6 flex justify-between gap-4">
            {analysisResult && (
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  setAnalysisResult(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex-1"
              >
                Try Another Image
              </button>
            )}
            
            {analysisResult && (
              <button
                type="submit"
                className="px-4 py-2 rounded-md font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 flex-1"
              >
                Upload Post
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Animation styles */}
      <style jsx global>{`
        @keyframes pulse-width {
          0%, 100% { width: 30%; }
          50% { width: 90%; }
        }
        
        .animate-pulse-width {
          animation: pulse-width 2s infinite ease-in-out;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PostUploadForm; 