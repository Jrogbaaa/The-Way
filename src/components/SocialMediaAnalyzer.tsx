'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import {
    Loader2,
    Upload,
    AlertCircle,
    Wand2, // Added for Analyze button
    ThumbsUp,
    ThumbsDown,
    Target, // Added for Strategy section
    TrendingUp, // Added for Engagement
    Settings, // Added for Technical
    MessageSquare, // Added for Caption
    CheckCircle, // Added for Recommendation (and fixing linter error)
    X, // Added for potential dismiss buttons in future
    Crop, // Added for Optimize button
    Download, // Added for Download button
    ZoomIn,
    ZoomOut,
    Check,
    LogIn
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "./ui/textarea"; // Keep if needed elsewhere, otherwise remove if unused
import { ScrollArea } from "@/components/ui/scroll-area"; // Reverted import path back to alias
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "./ui/skeleton"; 
import { useAuth } from "@/components/AuthProvider"; // <-- Correct path
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { toast } from "sonner";
import Link from "next/link";
import { ROUTES } from "@/lib/config";

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

// ... interfaces (AnalysisResult, etc. - unchanged) ...
interface TechnicalAnalysis {
    width: number;
    height: number;
    aspectRatio: string;
    resolutionRating: 'Low' | 'Acceptable' | 'Good' | 'Excellent';
    fileSizeMB: number;
    sizeRating: 'Optimal' | 'Acceptable' | 'Large';
}

interface PlatformRecommendations {
    instagramPost?: string;
    instagramStory?: string;
    tiktok?: string; // Retained if API might send it
}

interface EngagementAnalysis {
    score: number;
    level: string;
    prediction: string;
}

interface AnalysisResult {
    caption: string;
    engagement: EngagementAnalysis;
    pros: string[];
    cons: string[];
    suggestions: string[];
    recommendation: string;
    technical: TechnicalAnalysis | null; // Allow technical to be potentially null from API
    platformRecommendations: PlatformRecommendations | null; // Allow platformRecommendations to be potentially null
    category: string;
    categoryTips: string[];
}

// Helper function to create a crop preview
const createCropPreview = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    
    // Get image dimensions
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('No 2d context');
    }
    
    // Set canvas size to the cropped size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    
    // Draw the cropped image onto the canvas
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );
    
    // Return the canvas as a data URL
    return canvas.toDataURL('image/png');
};

// Demo analysis result for unauthenticated users
const DEMO_ANALYSIS_RESULT: AnalysisResult = {
  caption: "Beach sunset with palm trees. Perfect end to a summer day! #vacation #sunset #beachvibes",
  engagement: {
    score: 78,
    level: "Above Average",
    prediction: "This post is likely to perform well, with engagement 30% above your average."
  },
  pros: [
    "Good lighting with golden hour tones",
    "Clear subject with good composition",
    "Effective use of colors that create visual interest",
    "Content aligns well with popular #sunset hashtag"
  ],
  cons: [
    "Similar to many other sunset photos in the feed",
    "Could use more unique perspective to stand out",
    "Text placement could be improved for readability"
  ],
  suggestions: [
    "Try capturing sunset from a unique angle or perspective",
    "Include a human element to create more emotional connection",
    "Experiment with different horizon placements using rule of thirds"
  ],
  recommendation: "This image would perform best on Instagram as a regular post. The colors and composition are optimized for feed viewing.",
  technical: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    resolutionRating: "Excellent",
    fileSizeMB: 1.2,
    sizeRating: "Optimal"
  },
  platformRecommendations: {
    instagramPost: "Good fit for Instagram feed (4:5 ratio recommended)",
    instagramStory: "Consider cropping to 9:16 for optimal Story presentation"
  },
  category: "nature",
  categoryTips: [
    "Golden hour lighting increases engagement by 48% for outdoor scenes",
    "Including a human element/silhouette boosts relatability by 35%",
    "Rule of thirds composition improves visual flow and interest"
  ]
};

// Also add this demo image URL for unauthenticated users
const DEMO_IMAGE_URL = "/examples/beach-sunset.jpg";

const SocialMediaAnalyzer: React.FC = () => {
    // Get Supabase client from Auth context
    const { supabase } = useAuth();

    // Existing state variables
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [technicalData, setTechnicalData] = useState<{ width: number, height: number, fileSizeMB: number } | null>(null);
    const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
    const [optimizationError, setOptimizationError] = useState<string | null>(null);
    const [optimizedImageUrl, setOptimizedImageUrl] = useState<string | null>(null);
    const [optimizedDimensions, setOptimizedDimensions] = useState<{ width: number, height: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null); // Ref for the results container

    // New state variables for interactive cropping
    const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
    const [cropAspectRatio, setCropAspectRatio] = useState<number>(9/16); // Default to 9:16
    const [cropRatioString, setCropRatioString] = useState<'9:16' | '1:1' | '4:5'>('9:16');
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);

    // Get auth state
    const { user } = useAuth();
    const isAuthenticated = !!user;
    
    // Add a state to show login prompt
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    
    // Modify handleImageUpload function to work with demo image for unauthenticated users
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            
            // Basic file validation
            if (!file.type.startsWith('image/')) {
                setError("Please upload an image file.");
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("Image file size must be less than 10MB.");
                return;
            }
            
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgSrc = e.target?.result as string;
                setImageSrc(imgSrc);
                setAnalysisResult(null);
                setError(null);

                const img = new Image();
                img.onload = () => {
                    setTechnicalData({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        fileSizeMB: file.size / (1024 * 1024)
                    });
                };
                img.onerror = () => {
                    setError("Could not load image details.");
                    setTechnicalData(null);
                }
                img.src = imgSrc;
            };
            reader.onerror = () => {
                setError("Failed to read the image file.");
                setImageSrc(null);
                setTechnicalData(null);
            }
            reader.readAsDataURL(file);
        }
    };

    // Reset optimization state when a new image is uploaded
    useEffect(() => {
        if (imageSrc) {
            setOptimizedImageUrl(null);
            setOptimizedDimensions(null);
            setOptimizationError(null);
        }
    }, [imageSrc]);

    // Modify handleAnalyzeClick to use demo for unauthenticated users
    const handleAnalyzeClick = async () => {
        setError(null);
        
        if (!imageSrc) {
            setError("Please upload an image first.");
            return;
        }
        
        setIsLoading(true);
        setAnalysisResult(null);

        try {
            // For unauthenticated users, simulate analysis with demo content
            if (!isAuthenticated) {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
                setAnalysisResult(DEMO_ANALYSIS_RESULT);
                setShowLoginPrompt(true);
            } else {
                // For authenticated users, use the real API
                const formData = new FormData();
                formData.append('image', fileInputRef.current?.files?.[0] || new Blob());
                formData.append('width', technicalData?.width.toString() || '');
                formData.append('height', technicalData?.height.toString() || '');
                formData.append('fileSizeMB', technicalData?.fileSizeMB.toString() || '');

                console.log("Sending data to API:", {
                    fileName: fileInputRef.current?.files?.[0]?.name,
                    width: technicalData?.width,
                    height: technicalData?.height,
                    fileSizeMB: technicalData?.fileSizeMB
                });

                // NOTE: Using standard fetch here because analyze-social-post doesn't require auth
                const response = await fetch('/api/analyze-social-post', {
                    method: 'POST',
                    body: formData, // Send as FormData
                });

                console.log("API Response Status:", response.status);

                const result = await response.json();
                console.log("API Response Body:", result);

                if (!response.ok) {
                    throw new Error(result.error || `HTTP error! status: ${response.status}`);
                }

                if (!result.analysis) {
                     console.error("API response missing 'analysis' key:", result);
                    throw new Error("Received an invalid response from the analysis server.");
                }
                 // Add basic validation for nested structures if needed
                if (!result.analysis.technical || !result.analysis.engagement || !result.analysis.platformRecommendations) {
                    console.warn("API response analysis object missing some expected keys (technical, engagement, platformRecommendations):", result.analysis);
                    // Potentially set a specific error or handle gracefully
                }

                setAnalysisResult(result.analysis);
            }
        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "An unexpected error occurred during analysis.");
            setAnalysisResult(null); 
        } finally {
            setIsLoading(false);
        }
    };

    // Function to open crop modal with specific aspect ratio
    const openCropModal = (aspectRatio: '9:16' | '1:1' | '4:5') => {
        // Reset crop state
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setCroppedImage(null);
        
        // Set aspect ratio
        setCropRatioString(aspectRatio);
        switch (aspectRatio) {
            case '9:16':
                setCropAspectRatio(9/16);
                break;
            case '1:1':
                setCropAspectRatio(1);
                break;
            case '4:5':
                setCropAspectRatio(4/5);
                break;
        }
        
        // Open modal
        setCropModalOpen(true);
    };

    // Handle crop complete
    const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    // Apply the crop
    const handleApplyCrop = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        
        try {
            setIsOptimizing(true);
            
            // Create a cropped image preview
            const croppedImage = await createCropPreview(
                imageSrc,
                croppedAreaPixels
            );
            setCroppedImage(croppedImage);
            
            // Close the crop modal
            setCropModalOpen(false);
            
            // Upload the cropped image to optimize with custom crop
            const response = await fetch('/api/image/optimize', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // This ensures the session cookies are sent
                body: JSON.stringify({
                    imageUrl: croppedImage, // Send the cropped image
                    targetAspectRatio: cropRatioString,
                    applyCrop: false, // Tell the API the crop is already applied
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Error optimizing image:", response.status, result);
                if (response.status === 401) {
                    throw new Error("Authentication required. Please sign in to optimize images.");
                } else {
                    throw new Error(result.error || `Optimization failed with status: ${response.status}`);
                }
            }

            if (result.success && result.optimizedImageUrl) {
                console.log("Optimization successful:", result);
                setOptimizedImageUrl(result.optimizedImageUrl);
                setOptimizedDimensions({ width: result.width, height: result.height });
            } else {
                throw new Error(result.error || "Optimization API call succeeded but returned no URL or indicated failure.");
            }
        } catch (err: any) {
            console.error("Crop and optimization failed:", err);
            setOptimizationError(err.message || "An unexpected error occurred during optimization.");
            setOptimizedImageUrl(null);
            setOptimizedDimensions(null);
        } finally {
            setIsOptimizing(false);
        }
    };

    // Modify existing handleOptimizeClick to open the crop modal instead
    const handleOptimizeClick = async (targetAspectRatio: '9:16' | '1:1' | '4:5') => {
        if (!imageSrc) {
            setOptimizationError("Cannot optimize without an original image source.");
            return;
        }
        
        // Open the crop modal instead of directly optimizing
        openCropModal(targetAspectRatio);
    };

     const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const renderScore = (score: number) => {
        let colorClass = "text-yellow-600"; 
        if (score >= 70) colorClass = "text-green-600"; 
        else if (score < 40) colorClass = "text-red-600"; 

        return <span className={`font-bold ${colorClass}`}>{score}/100</span>;
    };

    // Effect to scroll to results when analysis is complete
    useEffect(() => {
        if (analysisResult && !isLoading && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [analysisResult, isLoading]); // Re-run when analysisResult or isLoading changes

    // Add this function to load demo image for unauthenticated users
    const loadDemoImage = () => {
        setImageSrc(DEMO_IMAGE_URL);
        setAnalysisResult(DEMO_ANALYSIS_RESULT);
        setShowLoginPrompt(true);
    };

    // ... JSX return statement ...
    return (
        <div className="container mx-auto p-4 md:p-8 max-w-6xl">
            {/* Header Section: Styled like Creator Gallery - Left Aligned */}
            <div className="bg-indigo-50 p-6 md:p-8 rounded-lg mb-8"> 
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-600">Social Media Post Analyzer</h1>
                <p className="text-gray-700 mb-6"> 
                    Upload an image to analyze its potential engagement and get improvement suggestions.
                </p>
            </div>

            {/* File Input & Analyze Buttons Area */}
            <div className="mb-6 rounded-lg text-center transition-colors duration-200"> 
                <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden" 
                    aria-label="Upload image"
                />
                <Button onClick={triggerFileInput} variant="outline" size="lg" className="mb-4">
                    <Upload className="mr-2 h-5 w-5" /> {fileName || "Select Image"}
                </Button>
                {fileName && <p className="text-sm text-gray-500 mt-[-8px] mb-2">Using: {fileName}</p>} 
                 <p className="text-xs text-gray-500 mt-1 mb-4">Supports JPG, PNG, WEBP, GIF (Max 15MB)</p>

                {/* Analyze Button - Moved here, visible after selection */}
                 <Button 
                    onClick={handleAnalyzeClick} 
                    disabled={isLoading || !technicalData || !imageSrc} 
                    className="w-full md:w-auto" 
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                        </>
                    ) : (
                        <><Wand2 className="mr-2 h-5 w-5" /> Analyze Post</>
                    )}
                </Button>
            </div>

            {/* Image Preview Area (below buttons) */}
            {imageSrc && (
                <div className="mb-6 flex flex-col items-center">
                    <img src={imageSrc} alt="Uploaded preview" className="max-w-full md:max-w-lg max-h-96 rounded-lg shadow-md object-contain" />
                    {technicalData && (
                         <p className="text-sm text-gray-500 mt-2">
                            Size: {technicalData.width}x{technicalData.height}px | {(technicalData.fileSizeMB).toFixed(2)} MB
                        </p>
                    )}
                    {/* Analyze Button removed from here */}
                </div>
            )}

            {/* Loading Skeleton (shows ONLY when loading) */}
            {isLoading && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                     {/* Left Column Skeleton */}
                     <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <div className="flex space-x-4">
                            <Skeleton className="h-24 w-1/2" />
                            <Skeleton className="h-24 w-1/2" />
                        </div>
                         <Skeleton className="h-8 w-1/2" />
                         <div className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                         </div>
                     </div>
                     {/* Right Column Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-8 w-1/2" />
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                 </div>
            )}

            {/* Error Display (unchanged) */} 
            {error && (
                <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Analysis Results (shows ONLY when results exist and not loading) */}
            {analysisResult && !isLoading && (
                <div ref={resultsRef} className="mt-8 p-4 md:p-6 rounded-lg bg-white">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-800">Analysis Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        
                        {/* Left Column: Scores & Technical */}
                        <div className="space-y-6">
                            {/* Overall Recommendation */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                                        Overall Recommendation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700">{analysisResult.recommendation}</p>
                                </CardContent>
                            </Card>

                            {/* Engagement Score */}
                            <Card>
                                <CardHeader>
                                     <CardTitle className="flex items-center">
                                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                                        Engagement Potential
                                    </CardTitle>
                                     <CardDescription>Based on model prediction: {analysisResult.engagement.prediction}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <p className="text-lg">Score: {renderScore(analysisResult.engagement.score)} ({analysisResult.engagement.level})</p>
                                </CardContent>
                            </Card>

                            {/* Technical Details */} 
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="h-5 w-5 mr-2 text-gray-600" />
                                        Technical Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                     {analysisResult.technical ? (
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                            <li>Resolution: {analysisResult.technical.width}x{analysisResult.technical.height}px ({analysisResult.technical.resolutionRating})</li>
                                            <li>File Size: {analysisResult.technical.fileSizeMB.toFixed(2)} MB ({analysisResult.technical.sizeRating})</li>
                                            <li>Aspect Ratio: {analysisResult.technical.aspectRatio}</li>
                                        </ul>
                                     ) : (
                                         <p className="text-sm text-gray-500 italic">Technical details not available.</p>
                                     )}
                                     {analysisResult.platformRecommendations && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <h4 className="font-medium text-sm mb-1 text-gray-700">Platform Fit:</h4>
                                            <ul className="list-none space-y-1 text-xs text-gray-500">
                                                {analysisResult.platformRecommendations.instagramPost && <li>Instagram Post: {analysisResult.platformRecommendations.instagramPost}</li>}
                                                {analysisResult.platformRecommendations.instagramStory && <li>Story/Reels/TikTok: {analysisResult.platformRecommendations.instagramStory}</li>}
                                                {analysisResult.platformRecommendations.tiktok && <li>TikTok: {analysisResult.platformRecommendations.tiktok}</li>}
                                            </ul>
                                        </div>
                                     )}
                                </CardContent>
                            </Card>

                        </div>

                        {/* Right Column: Caption, Pros/Cons, Suggestions & Strategy */}
                        <div className="space-y-6">
                            {/* Generated Caption */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MessageSquare className="h-5 w-5 mr-2 text-orange-600" />
                                        Generated Caption Idea
                                     </CardTitle>
                                     <CardDescription>This caption is generated by AI and can be used as a starting point.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <ScrollArea className="h-20 w-full rounded-md border p-2 text-sm bg-gray-50">
                                         <p className="text-gray-700">{analysisResult.caption}</p>
                                     </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Combined Pros & Cons Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Strengths & Weaknesses</CardTitle>
                                    <CardDescription>Key positive aspects and areas identified for improvement.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Pros Column */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-2 flex items-center">
                                                <ThumbsUp className="h-4 w-4 mr-2 text-green-600" />
                                                Strengths
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                                                {analysisResult.pros.map((pro, index) => <li key={`pro-${index}`}>{pro}</li>)}
                                            </ul>
                                        </div>
                                        {/* Cons Column */}
                                        <div>
                                            <h4 className="font-semibold text-base mb-2 flex items-center">
                                                <ThumbsDown className="h-4 w-4 mr-2 text-red-600" />
                                                Weaknesses
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                                {analysisResult.cons.map((con, index) => <li key={`con-${index}`}>{con}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Suggestions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Improvement Suggestions</CardTitle>
                                    <CardDescription>Specific actions to take based on the analysis.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                        {analysisResult.suggestions.map((suggestion, index) => <li key={`suggestion-${index}`}>{suggestion}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Strategy */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Strategy for Improvement</CardTitle>
                                    <CardDescription>Recommended approach to implement the suggested improvements.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700">{analysisResult.recommendation}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* --- Optimization Section (Moved INSIDE the grid) --- */}
                        <Card className="md:col-span-2 bg-gray-50 mt-6"> {/* Spans 2 cols on medium+, added mt-6 */} 
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Crop className="h-5 w-5 mr-2 text-teal-600" />
                                    Optimize Aspect Ratio
                                </CardTitle>
                                <CardDescription>
                                    Crop the image to recommended aspect ratios for different platforms.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-3 mb-4">
                                   {/* Add back the missing buttons */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOptimizeClick('9:16')}
                                        disabled={isOptimizing}
                                    >
                                        {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
                                        Crop 9:16 (Stories/Reels)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOptimizeClick('1:1')}
                                        disabled={isOptimizing}
                                    >
                                        {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
                                        Crop 1:1 (Square Post)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOptimizeClick('4:5')}
                                        disabled={isOptimizing}
                                    >
                                         {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
                                        Crop 4:5 (Vertical Post)
                                    </Button>
                                </div>

                                {/* Loading indicator */}
                                {isOptimizing && (
                                     <div className="flex items-center text-sm text-gray-500">
                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                         <span>Optimizing image... please wait.</span>
                                     </div>
                                )}

                                {/* Optimization Error Display */} 
                                {optimizationError && (
                                    <Alert variant="destructive" className="mt-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Optimization Error</AlertTitle>
                                        <AlertDescription>{optimizationError}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Optimized Image Result */} 
                                {optimizedImageUrl && !isOptimizing && (
                                    <div className="mt-4 p-4 border rounded-lg bg-white">
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-sm font-medium mb-2 text-gray-700">Optimized Image ({optimizedDimensions?.width}x{optimizedDimensions?.height}px)</h4>
                                            <div className="relative">
                                                <img 
                                                    src={optimizedImageUrl} 
                                                    alt="Optimized preview" 
                                                    className="max-w-full max-h-64 object-contain rounded"
                                                />
                                            </div>
                                            <div className="mt-3 flex space-x-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        // Force download by creating a temporary download link
                                                        fetch(optimizedImageUrl)
                                                            .then(response => response.blob())
                                                            .then(blob => {
                                                                // Create a blob URL
                                                                const blobUrl = URL.createObjectURL(blob);
                                                                
                                                                // Create a temporary link element
                                                                const link = document.createElement('a');
                                                                link.href = blobUrl;
                                                                link.download = `optimized-${cropRatioString.replace(':', 'x')}.webp`;
                                                                
                                                                // Append to the document, click and cleanup
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                
                                                                // Cleanup
                                                                setTimeout(() => {
                                                                    document.body.removeChild(link);
                                                                    URL.revokeObjectURL(blobUrl);
                                                                }, 100);
                                                            })
                                                            .catch(err => {
                                                                console.error('Download failed:', err);
                                                                toast?.error?.('Download failed. Please try again.');
                                                            });
                                                    }}
                                                >
                                                    <Download className="mr-2 h-4 w-4" /> 
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        {/* --- End Optimization Section --- */}

                    </div> {/* End of the grid div */}
                </div>
            )}

            {/* Add Crop Dialog Modal */}
            <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Adjust Crop ({cropRatioString})</DialogTitle>
                        <DialogDescription>
                            Drag to position and use the slider to zoom
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative h-[350px] w-full my-4 bg-gray-100 rounded-md overflow-hidden">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropAspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                objectFit="horizontal-cover"
                            />
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        <ZoomOut className="h-4 w-4 text-gray-500" />
                        <Slider
                            value={[zoom]}
                            min={1}
                            max={3}
                            step={0.1}
                            onValueChange={(value) => setZoom(value[0])}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-gray-500" />
                    </div>
                    
                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline" 
                            onClick={() => setCropModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApplyCrop}
                            disabled={isOptimizing}
                        >
                            {isOptimizing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> Apply Crop
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add the login prompt for unauthenticated users after analysis */}
            {!isAuthenticated && showLoginPrompt && analysisResult && analysisResult.recommendation && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-2">
                        Ready to analyze your own content?
                    </h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                        Sign in to analyze unlimited posts, get personalized recommendations, and track your improvement over time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
                            <Link href={ROUTES.signup}>
                                <LogIn className="mr-2 h-4 w-4" />
                                Sign Up Free
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={ROUTES.login}>
                                Already have an account? Sign In
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialMediaAnalyzer;