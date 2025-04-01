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
      setAnalysisResult(data.analysis);
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
            
            {selectedImage && !analysisResult && (
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
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${analysisResult.approvalStatus.approved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-1 rounded-full ${analysisResult.approvalStatus.approved ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {analysisResult.approvalStatus.approved ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${analysisResult.approvalStatus.approved ? 'text-green-800' : 'text-yellow-800'}`}>
                      Social Media Analysis
                    </h3>
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">{analysisResult.approvalStatus.reason}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pros and Cons Analysis */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Pros Section */}
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <h3 className="text-sm font-medium text-green-800 flex items-center mb-3">
                    <Check className="w-4 h-4 mr-2" />
                    Pros
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.engagementPotential && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Engagement:</span> {getEngagementText(analysisResult.engagementPotential)} potential engagement
                        </p>
                      </li>
                    )}
                    
                    {analysisResult.categories && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Categories:</span> {Array.isArray(analysisResult.categories) 
                            ? analysisResult.categories.join(', ') 
                            : typeof analysisResult.categories === 'string'
                              ? analysisResult.categories
                              : typeof analysisResult.categories === 'object' && analysisResult.categories !== null
                                ? 'Various categories detected'
                                : 'No categories detected'}
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
                    
                    {analysisResult.faces && analysisResult.faces.length > 0 && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">People:</span> Contains {analysisResult.faces.length} recognizable face(s)
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
                  </ul>
                </div>
                
                {/* Cons Section */}
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <h3 className="text-sm font-medium text-red-800 flex items-center mb-3">
                    <X className="w-4 h-4 mr-2" />
                    Potential Concerns
                  </h3>
                  <ul className="space-y-2">
                    {analysisResult.safeSearch && analysisResult.safeSearch.adult && analysisResult.safeSearch.adult !== 'VERY_UNLIKELY' && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Adult Content:</span> {analysisResult.safeSearch.adult.toLowerCase()} likely
                        </p>
                      </li>
                    )}
                    
                    {analysisResult.safeSearch && analysisResult.safeSearch.violence && analysisResult.safeSearch.violence !== 'VERY_UNLIKELY' && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Violent Content:</span> {analysisResult.safeSearch.violence.toLowerCase()} likely
                        </p>
                      </li>
                    )}
                    
                    {analysisResult.safeSearch && analysisResult.safeSearch.medical && analysisResult.safeSearch.medical !== 'VERY_UNLIKELY' && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Medical Content:</span> {analysisResult.safeSearch.medical.toLowerCase()} likely
                        </p>
                      </li>
                    )}
                    
                    {analysisResult.safeSearch && analysisResult.safeSearch.racy && analysisResult.safeSearch.racy !== 'VERY_UNLIKELY' && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Racy Content:</span> {analysisResult.safeSearch.racy.toLowerCase()} likely
                        </p>
                      </li>
                    )}
                    
                    {(!analysisResult.labels || analysisResult.labels.length === 0) && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                        </div>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Clarity:</span> No clear subjects identified
                        </p>
                      </li>
                    )}
                    
                    {!analysisResult.approvalStatus.approved && (
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
                  </ul>
                </div>
              </div>
              
              {/* Summary */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Analysis Summary</h3>
                <p className="text-sm text-gray-700">{analysisResult.summary}</p>
              </div>
              
              {/* Social Media Strategy Insights */}
              {(analysisResult.socialMediaPotential || analysisResult.platformFit || analysisResult.optimizationTips) && (
                <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50">
                  <h3 className="text-sm font-medium text-indigo-800 mb-3">Social Media Strategy Insights</h3>
                  
                  {analysisResult.socialMediaPotential && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Content Potential</h4>
                      <p className="text-sm text-gray-700">{analysisResult.socialMediaPotential}</p>
                    </div>
                  )}
                  
                  {/* Platform-specific Recommendations */}
                  {analysisResult.platformRecommendations && Object.keys(analysisResult.platformRecommendations).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Platform Strategy</h4>
                      <div className="space-y-3">
                        {Object.entries(analysisResult.platformRecommendations).map(([platform, recommendation], index) => (
                          <div key={index} className="bg-white bg-opacity-50 p-3 rounded-md">
                            <h5 className="text-sm font-medium text-indigo-800">{platform}</h5>
                            <p className="text-sm text-gray-700 mt-1">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.platformFit && analysisResult.platformFit.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Best Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(analysisResult.platformFit) ? (
                          analysisResult.platformFit.map((platform, index) => (
                            <span key={index} className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                              {platform}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                            {analysisResult.platformFit}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Caption Ideas */}
                  {analysisResult.captionIdeas && analysisResult.captionIdeas.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Caption Ideas</h4>
                      <ul className="space-y-2">
                        {analysisResult.captionIdeas.map((caption, index) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 text-indigo-500 mr-1.5">•</div>
                            <p className="text-sm text-gray-700">{caption}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Hashtag Recommendations */}
                  {analysisResult.hashtagRecommendations && analysisResult.hashtagRecommendations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Recommended Hashtags</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.hashtagRecommendations.map((hashtag, index) => (
                          <span key={index} className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Content Series Potential */}
                  {analysisResult.contentSeriesPotential && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Content Series Potential</h4>
                      <div className="bg-white bg-opacity-50 p-3 rounded-md">
                        <p className="text-sm text-gray-700">{analysisResult.contentSeriesPotential}</p>
                      </div>
                    </div>
                  )}
                  
                  {analysisResult.optimizationTips && analysisResult.optimizationTips.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Optimization Tips</h4>
                      <ul className="space-y-2">
                        {Array.isArray(analysisResult.optimizationTips) ? (
                          analysisResult.optimizationTips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                              <div className="flex-shrink-0 text-indigo-500 mr-1.5">•</div>
                              <p className="text-sm text-gray-700">{tip}</p>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start">
                            <div className="flex-shrink-0 text-indigo-500 mr-1.5">•</div>
                            <p className="text-sm text-gray-700">{analysisResult.optimizationTips}</p>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {/* Enhanced Engagement Analysis */}
                  {analysisResult.engagementPotential && typeof analysisResult.engagementPotential === 'object' && 'reasons' in analysisResult.engagementPotential && analysisResult.engagementPotential.reasons && analysisResult.engagementPotential.reasons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-200">
                      <h4 className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Engagement Analysis</h4>
                      <ul className="space-y-2">
                        {analysisResult.engagementPotential.reasons.map((reason: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <div className="flex-shrink-0 text-indigo-500 mr-1.5">•</div>
                            <p className="text-sm text-gray-700">{reason}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
          <button
            type="submit"
            disabled={isUploading || !selectedImage || !analysisResult}
            className={`w-full px-4 py-3 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={isUploading ? 'Uploading post...' : 'Analyze post'}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </span>
            ) : (
              'Analyze Post'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostUploadForm; 