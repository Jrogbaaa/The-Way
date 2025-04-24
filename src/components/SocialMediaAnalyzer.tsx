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
    X // Added for potential dismiss buttons in future
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Textarea } from "./ui/textarea"; // Keep if needed elsewhere, otherwise remove if unused
import { ScrollArea } from "@/components/ui/scroll-area"; // Reverted import path back to alias
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "./ui/skeleton"; 

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


const SocialMediaAnalyzer: React.FC = () => {
    // ... state variables (unchanged) ...
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [technicalData, setTechnicalData] = useState<{ width: number, height: number, fileSizeMB: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null); // Ref for the results container

    // ... handleImageUpload, handleAnalyzeClick, triggerFileInput functions (unchanged logic) ...
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
            if (!validTypes.includes(file.type)) {
                setError("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.");
                return;
            }

            const maxSizeMB = 15;
            if (file.size > maxSizeMB * 1024 * 1024) {
                setError(`File size exceeds the ${maxSizeMB}MB limit.`);
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

    const handleAnalyzeClick = async () => {
        if (!imageSrc || !technicalData || !fileInputRef.current?.files?.[0]) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const formData = new FormData();
            const file = fileInputRef.current.files[0];
            formData.append('image', file);
            formData.append('width', technicalData.width.toString());
            formData.append('height', technicalData.height.toString());
            formData.append('fileSizeMB', technicalData.fileSizeMB.toString());

            console.log("Sending data to API:", {
                fileName: file.name,
                width: technicalData.width,
                height: technicalData.height,
                fileSizeMB: technicalData.fileSizeMB
            });

            const response = await fetch('/api/analyze-social-post', {
                method: 'POST',
                body: formData,
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

        } catch (err: any) {
            console.error("Analysis failed:", err);
            setError(err.message || "An unexpected error occurred during analysis.");
            setAnalysisResult(null); 
        } finally {
            setIsLoading(false);
        }
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
                                                Improvements
                                            </h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                                                {analysisResult.cons.map((con, index) => <li key={`con-${index}`}>{con}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            
                            {/* Perfect Score Strategy Section */}
                            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-indigo-800">
                                        <Target className="h-5 w-5 mr-2" />
                                        Perfect Score Strategy ({analysisResult.category})
                                    </CardTitle>
                                     <CardDescription className="text-indigo-600">
                                        Tips for maximizing impact based on the detected content category and general suggestions.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-sm mb-2 text-indigo-700">Category-Specific Tips ({analysisResult.category}):</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                             {analysisResult.categoryTips.map((tip, index) => (
                                                <li key={`cat-tip-${index}`}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="pt-4 border-t border-indigo-100">
                                        <h4 className="font-semibold text-sm mb-2 text-indigo-700">General Suggestions:</h4>
                                        {analysisResult.suggestions && analysisResult.suggestions.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                {analysisResult.suggestions.map((suggestion, index) => (
                                                    <li key={`suggestion-${index}`}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No specific improvement suggestions generated. Focus on the category tips!</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            
                        </div>
                    </div>
                    
                    {/* Optional Raw JSON Output */}
                    {/* 
                    <details className="mt-6">
                        <summary className="text-sm text-gray-500 cursor-pointer">Show Raw Analysis Data</summary>
                        <ScrollArea className="mt-2 h-48 w-full rounded-md border p-4 bg-gray-900 text-gray-200 text-xs font-mono">
                            <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
                        </ScrollArea>
                    </details>
                    */}
                </div>
            )}
        </div>
    );
};

export default SocialMediaAnalyzer;