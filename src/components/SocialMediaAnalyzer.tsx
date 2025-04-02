'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Loader2, Upload, AlertCircle, Check, X, Image as ImageIcon, ThumbsUp, ThumbsDown, BarChart } from 'lucide-react';

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

const SocialMediaAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 mb-1">Recommendation</h4>
                <p className="text-sm text-blue-700">{analysisResult.recommendation}</p>
              </div>
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