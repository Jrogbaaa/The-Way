'use client';

import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { Loader2, Upload, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react';
import { AnalysisResult, getEngagementText } from '@/types';

/**
 * Post Upload Form Component
 * 
 * Provides a UI for users to upload and analyze images for social media posting.
 * The component offers AI-powered image analysis with recommendations for
 * social media optimization, but does not restrict content uploads.
 */
const PostUploadForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles image selection from the file input
   * Validates file type and size, creates preview
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
   * Analyzes the selected image using the AI service
   * Sends image to the API and processes the analysis results
   */
  const handleAnalyzeImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    
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
      // Safeguard against malformed response
      if (!data || !data.analysis) {
        throw new Error('Invalid response from image analysis service');
      }
      
      // Process social media analysis data
      const analysis = data.analysis;
      
      // Prepare approval status
      const approvalStatus = analysis.social || {
        approved: true,
        reason: 'Image appears appropriate for social media'
      };
      
      // Create unified analysis result
      const result = {
        ...analysis,
        approvalStatus,
        summary: analysis.summary || 'No detailed analysis available',
        engagementPotential: analysis.socialMediaAnalysis?.engagement?.score || 50,
        // Use new socialMediaAnalysis object if available
        pros: analysis.socialMediaAnalysis?.pros || [],
        cons: analysis.socialMediaAnalysis?.cons || [],
        recommendation: analysis.socialMediaAnalysis?.recommendation || '',
      };
      
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Handles form submission for uploading the post
   * Validates required fields and submits data
   * Note: This is currently a placeholder for actual implementation
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image to upload');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your post');
      return;
    }
    
    // Require image analysis before submission
    if (!analysisResult) {
      setError('Please analyze the image before posting');
      return;
    }
    
    // All photos are allowed - no approval check
    setError(null);
    setIsUploading(true);
    
    try {
      // Here you would upload the post to your backend
      // This is a placeholder for actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reset form after successful upload
      setTitle('');
      setDescription('');
      setSelectedImage(null);
      setImagePreview(null);
      setAnalysisResult(null);
      
      // Success message would be displayed here in real implementation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Create New Post</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title input */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a title for your post"
              required
            />
          </div>
          
          {/* Description input */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a description for your post"
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
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
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
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Analyze for Social Media
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Analysis Results */}
          {analysisResult && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className={`p-4 rounded-lg border ${analysisResult.approvalStatus?.approved 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center">
                  {analysisResult.approvalStatus?.approved ? (
                    <div className="flex-shrink-0 bg-green-100 rounded-full p-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 bg-red-100 rounded-full p-1">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${analysisResult.approvalStatus?.approved 
                      ? 'text-green-800' 
                      : 'text-red-800'}`}>
                      {analysisResult.approvalStatus?.approved 
                        ? 'Image Approved for Social Media' 
                        : 'Image May Not Be Suitable'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {analysisResult.approvalStatus?.reason}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pros Section */}
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <h3 className="text-sm font-medium text-green-800 flex items-center mb-3">
                    <Check className="w-4 h-4 mr-2" />
                    Positive Aspects
                  </h3>
                  <ul className="space-y-2">
                    {/* Show pros from new socialMediaAnalysis if available */}
                    {analysisResult.pros && analysisResult.pros.length > 0 ? (
                      analysisResult.pros.map((pro, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">{pro}</p>
                        </li>
                      ))
                    ) : (
                      // Fallbacks for compatibility
                      <>
                        {analysisResult.approvalStatus?.approved && (
                          <li className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Safety:</span> Content appears appropriate for social media
                            </p>
                          </li>
                        )}
                        
                        {analysisResult.labels && analysisResult.labels.length > 0 && (
                          <li className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Content:</span> Clear subjects identified
                            </p>
                          </li>
                        )}
                        
                        <li className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Quality:</span> Image is clear and properly formatted
                          </p>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                
                {/* Cons Section */}
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <h3 className="text-sm font-medium text-red-800 flex items-center mb-3">
                    <X className="w-4 h-4 mr-2" />
                    Potential Concerns
                  </h3>
                  <ul className="space-y-2">
                    {/* Show cons from new socialMediaAnalysis if available */}
                    {analysisResult.cons && analysisResult.cons.length > 0 ? (
                      analysisResult.cons.map((con, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                          </div>
                          <p className="text-sm text-gray-700">{con}</p>
                        </li>
                      ))
                    ) : (
                      // Fallbacks for compatibility
                      <>
                        {!analysisResult.approvalStatus?.approved && (
                          <li className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Social Media Policy:</span> May violate platform guidelines
                            </p>
                          </li>
                        )}
                        
                        {(!analysisResult.engagementPotential || 
                          getEngagementText(analysisResult.engagementPotential).toLowerCase().includes('low')) && (
                          <li className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                            </div>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Engagement:</span> May not generate significant interaction
                            </p>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Summary */}
              <div className="p-4 mt-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Analysis Summary</h3>
                <p className="text-sm text-gray-700">{analysisResult.summary}</p>
                
                {/* Show recommendation from new socialMediaAnalysis if available */}
                {analysisResult.recommendation && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-800 mb-1">Recommendation</h4>
                    <p className="text-sm text-gray-700">{analysisResult.recommendation}</p>
                  </div>
                )}
              </div>
              
              {/* Engagement Score */}
              {analysisResult.engagementPotential && (
                <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
                  <h3 className="text-sm font-medium text-blue-800 mb-3">Engagement Potential</h3>
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center mr-4">
                      <span className="text-lg font-bold text-blue-800">{analysisResult.engagementPotential}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-800">
                        {getEngagementText(analysisResult.engagementPotential)}
                      </h4>
                      <div className="w-full h-2 bg-blue-100 rounded-full mt-2">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${analysisResult.engagementPotential}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <div className="mt-6 flex justify-between">
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
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Another Image
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 rounded-md text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => console.log('Post submitted')} // This would call handleSubmit in a real implementation
            >
              Upload Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostUploadForm; 