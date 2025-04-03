'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Loader2, Upload, AlertCircle, Check, X, Image as ImageIcon, ThumbsUp, ThumbsDown, BarChart, Camera, Users, Sparkles, Star, Lightbulb } from 'lucide-react';

type AnalysisResult = {
  caption: string;
  engagement: {
    score: number;
    level: string;
  };
  pros: string[];
  cons: string[];
  recommendation: string;
};

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
const getSpecificImprovements = (score: number, caption: string, cons: string[]) => {
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
  
  // Caption-based specific improvements
  const lowerCaption = caption.toLowerCase();
  if (lowerCaption.includes('dark') || lowerCaption.includes('dim')) {
    improvements.push('Improve lighting - brighten image by 30-40% for optimal visibility');
  }
  
  if (lowerCaption.includes('group') && !lowerCaption.includes('smiling')) {
    improvements.push('Include authentic emotions - smiling faces increase engagement by 42%');
  }
  
  if (!lowerCaption.includes('color') && !lowerCaption.includes('vibrant')) {
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

const SocialMediaAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles image selection from the file input
   */
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Reset previous analysis
    setAnalysisResult(null);
    setError(null);
    setShowExamples(false);
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Selected file is not an image');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB limit');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Triggers the file input click event
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Analyzes the selected image using the Hugging Face API
   */
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      const response = await fetch('/api/analyze-social-post', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      const data = await response.json();
      // Safeguard against malformed response
      if (!data || !data.analysis) {
        throw new Error('Invalid response from image analysis service');
      }
      setAnalysisResult(data.analysis);
      setShowExamples(true); // Show examples after successful analysis
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Reset the component state
   */
  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    setShowExamples(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Get color class based on engagement score
   */
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-green-500';
    if (score >= 45) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Social Media Post Analyzer</h2>
        <p className="text-sm text-gray-500 mb-6">
          Upload an image to analyze its potential engagement on social media
        </p>
        
        {/* Image upload section */}
        <div className="space-y-4 mb-6">
          {!imagePreview ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={handleUploadClick}
              tabIndex={0}
              aria-label="Upload image"
              onKeyDown={(e) => e.key === 'Enter' && handleUploadClick()}
            >
              <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to select an image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-70 transition-opacity"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            id="image"
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            aria-label="Upload image"
          />
          
          {selectedImage && !analysisResult && !isAnalyzing && (
            <button
              type="button"
              onClick={handleAnalyzeImage}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full transition-colors"
              aria-label="Analyze image for social media potential"
            >
              <BarChart className="w-4 h-4 mr-2" />
              Analyze for Social Media
            </button>
          )}
          
          {isAnalyzing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
              <span className="text-sm text-gray-700">Analyzing image...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        
        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6 mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analysis Results</h3>
              
              {/* Caption */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Image Content</h4>
                <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                  {analysisResult.caption}
                </p>
              </div>
              
              {/* Engagement Score */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Engagement Potential</h4>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 border-4 flex items-center justify-center relative">
                    <div className={`text-lg font-bold ${getScoreColorClass(analysisResult.engagement.score)}`}>
                      {analysisResult.engagement.score}
                    </div>
                    <div className="absolute -bottom-6 w-full text-center">
                      <span className={`text-xs font-medium ${getScoreColorClass(analysisResult.engagement.score)}`}>
                        {analysisResult.engagement.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          analysisResult.engagement.score >= 65 ? 'bg-green-500' :
                          analysisResult.engagement.score >= 45 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${analysisResult.engagement.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-md border border-green-100">
                  <div className="flex items-center mb-2">
                    <ThumbsUp className="w-4 h-4 text-green-600 mr-2" />
                    <h4 className="text-sm font-medium text-green-800">Pros</h4>
                  </div>
                  <ul className="space-y-1">
                    {analysisResult.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-red-50 p-3 rounded-md border border-red-100">
                  <div className="flex items-center mb-2">
                    <ThumbsDown className="w-4 h-4 text-red-600 mr-2" />
                    <h4 className="text-sm font-medium text-red-800">Cons</h4>
                  </div>
                  <ul className="space-y-1">
                    {analysisResult.cons.map((con, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start">
                        <X className="w-4 h-4 text-red-500 mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Recommendation */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-6">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Recommendation</h4>
                <p className="text-sm text-blue-700">{analysisResult.recommendation}</p>
              </div>
              
              {/* NEW SECTION: Optimization Guide */}
              {showExamples && (
                <div className="mt-6 border border-indigo-100 rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 p-3">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="text-base font-medium text-indigo-900">Perfect Score Strategy</h3>
                    </div>
                    <p className="text-xs text-indigo-700 mt-1">
                      Based on your image content, here's how to achieve a perfect social media engagement score
                    </p>
                  </div>
                  
                  {/* Category recognition */}
                  {(() => {
                    const examples = getSimilarExampleImages(analysisResult.caption);
                    const improvements = getSpecificImprovements(
                      analysisResult.engagement.score, 
                      analysisResult.caption,
                      analysisResult.cons
                    );
                    
                    return (
                      <div className="p-4">
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Camera className="w-4 h-4 text-indigo-600 mr-2" />
                            <h4 className="text-sm font-medium text-gray-900">
                              {examples.category.charAt(0).toUpperCase() + examples.category.slice(1)} Content Detected
                            </h4>
                          </div>
                          
                          {/* Similar optimized examples */}
                          <p className="text-xs text-gray-600 mb-3">
                            Here are some high-performing examples similar to your content:
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {examples.images.map((img, index) => (
                              <div key={index} className="relative rounded overflow-hidden border border-gray-200 bg-white">
                                <div className="aspect-w-16 aspect-h-9 relative bg-gray-100">
                                  {/* Use a placeholder or create placeholders in your public directory */}
                                  <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center">
                                    <p className="text-xs text-indigo-600 text-center p-2">
                                      Example {index + 1}: High-scoring {examples.category} content
                                    </p>
                                  </div>
                                </div>
                                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                  98
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Best practices */}
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 mr-2" />
                            <h4 className="text-sm font-medium text-gray-900">
                              {examples.category.charAt(0).toUpperCase() + examples.category.slice(1)} Content Best Practices
                            </h4>
                          </div>
                          
                          <ul className="space-y-1.5">
                            {examples.tips.map((tip, index) => (
                              <li key={index} className="text-xs text-gray-700 flex items-start">
                                <Check className="w-3.5 h-3.5 text-indigo-500 mr-1.5 mt-0.5 flex-shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Specific improvement actions */}
                        <div>
                          <div className="flex items-center mb-2">
                            <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
                            <h4 className="text-sm font-medium text-gray-900">
                              Actions to Improve Your Score
                            </h4>
                          </div>
                          
                          <ul className="space-y-1.5 mb-3">
                            {improvements.map((improvement, index) => (
                              <li key={index} className="text-xs text-gray-700 flex items-start">
                                <div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center mr-1.5 mt-0.5 flex-shrink-0 text-[10px] font-bold">
                                  {index + 1}
                                </div>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded">
                            <strong>Pro Tip:</strong> After making these improvements, try our AI Model creation to generate perfect social media content consistently.
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Analyze another image"
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaAnalyzer; 