import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Interfaces (optional but good practice)
interface TechnicalAnalysis {
    width: number;
    height: number;
    aspectRatio: string;
    fileSizeMB: number;
    resolutionRating: string;
    sizeRating: string;
}

interface PlatformRecommendations {
    instagramPost?: string;
    instagramStory?: string;
    tiktok?: string;
}

interface EngagementAnalysis {
    score: number;
    level: string;
    prediction: string; // Added original prediction label
}

interface ContentAnalysis {
    caption: string;
    engagement: EngagementAnalysis;
    pros: string[];
    cons: string[];
    suggestions: string[]; // Renamed from improvements
    recommendation: string;
    technical: TechnicalAnalysis;
    platformRecommendations: PlatformRecommendations;
    category: string; // Added category field
    categoryTips: string[]; // Added category tips field
}

// --- Constants ---
const HF_CAPTION_API_URL = 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large';
const HF_ENGAGEMENT_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
const MIN_RESOLUTION_GOOD = 1080;
const MIN_RESOLUTION_FAIR = 600;
const MAX_FILE_SIZE_GOOD = 5; // MB
const MAX_FILE_SIZE_FAIR = 10; // MB

// Add a fallback captioning mechanism
const FALLBACK_HF_CAPTION_API_URL = 'https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning';

// --- Helper Functions ---

/**
 * Calculates greatest common divisor for aspect ratio.
 */
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

/**
 * Calculates and formats aspect ratio.
 */
function getAspectRatio(width: number, height: number): string {
    if (!width || !height) return 'N/A';
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

/**
 * Evaluates technical aspects of the image.
 */
function evaluateTechnicalAspects(width: number, height: number, fileSizeMB: number): TechnicalAnalysis {
    let resolutionRating = 'Poor';
    if (width >= MIN_RESOLUTION_GOOD && height >= MIN_RESOLUTION_GOOD) {
        resolutionRating = 'Good';
    } else if (width >= MIN_RESOLUTION_FAIR && height >= MIN_RESOLUTION_FAIR) {
        resolutionRating = 'Fair';
    }

    let sizeRating = 'Excellent';
    if (fileSizeMB > MAX_FILE_SIZE_GOOD) {
        sizeRating = 'Good';
    }
    if (fileSizeMB > MAX_FILE_SIZE_FAIR) {
        sizeRating = 'Fair'; // Consider adding Poor if > 15MB etc.
    }

    return {
        width,
        height,
        aspectRatio: getAspectRatio(width, height),
        fileSizeMB,
        resolutionRating,
        sizeRating,
    };
}

/**
 * Generates platform-specific cropping/formatting recommendations.
 */
function generatePlatformRecommendations(width: number, height: number): PlatformRecommendations {
    const recommendations: PlatformRecommendations = {};
    const ratio = width / height;

    // Instagram Post (Ideal: 1:1 or 4:5)
    if (Math.abs(ratio - 1) < 0.05 || Math.abs(ratio - 0.8) < 0.05) {
        recommendations.instagramPost = 'Aspect ratio is ideal for Instagram posts.';
    } else if (ratio > 1.1) { // Wider than square
        recommendations.instagramPost = 'Consider cropping to 1:1 (square) or 4:5 (portrait) for optimal display in Instagram feed.';
    } else { // Taller than 4:5
        recommendations.instagramPost = 'Consider cropping to 4:5 (portrait) or 1:1 (square) for optimal display in Instagram feed.';
    }

    // Instagram Story / Reels / TikTok (Ideal: 9:16)
    if (Math.abs(ratio - 9/16) < 0.05) {
        recommendations.instagramStory = 'Aspect ratio is ideal for Stories, Reels, and TikTok.';
        recommendations.tiktok = 'Aspect ratio is ideal for TikTok.';
    } else {
        const suggestion = 'Consider cropping or adding borders to achieve a 9:16 aspect ratio for full-screen display.';
        recommendations.instagramStory = suggestion;
        recommendations.tiktok = suggestion;
    }

    return recommendations;
}

/**
 * Get image caption using Hugging Face image-to-text model
 */
async function getImageCaption(imageBuffer: Buffer, apiKey: string): Promise<string> {
  console.log(`[API] Calling HF Caption API: ${HF_CAPTION_API_URL}`);
  
  // Validate input buffer
  if (!imageBuffer || imageBuffer.length === 0) {
    console.error('[API] Error: Empty image buffer received');
    throw new Error('Invalid image data received. Please try another image.');
  }
  
  try {
    const response = await axios.post(
      HF_CAPTION_API_URL,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json',
        timeout: 20000 // Increased timeout to 20 seconds
      }
    );
    console.log('[API] HF Caption API Response Status:', response.status);
    
    // Extract the generated caption
    if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].generated_text) {
      return response.data[0].generated_text;
    }
    if (response.data && response.data.generated_text) {
        return response.data.generated_text;
    }
    
    console.warn('[API] Unexpected caption response format:', response.data);
    throw new Error('Unable to process image response. Please try again or use a different image.');
  } catch (error: any) {
    console.error('[API] Error getting image caption from Hugging Face:', error.response?.status, error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('The image analysis service timed out. Please try a different image or try again later.');
    }
    
    if (error.response?.status === 413) {
      throw new Error('Image file is too large. Please use a smaller image (under 10MB).');
    }
    
    // Check for specific Hugging Face errors (e.g., model loading)
    if (error.response?.data?.error?.includes('currently loading')) {
        throw new Error('Analysis model is starting up, please try again in a moment.');
    }
    
    // Check if there might be an issue with the image format
    if (error.response?.status === 400) {
      throw new Error('The image format may not be supported. Please try a JPG or PNG image.');
    }
    
    throw new Error('Failed to analyze image. Please try a different image or check your connection.');
  }
}

/**
 * Fallback image captioning function
 */
async function getFallbackImageCaption(imageBuffer: Buffer, apiKey: string): Promise<string> {
  console.log(`[API] Calling Fallback Caption API: ${FALLBACK_HF_CAPTION_API_URL}`);
  try {
    const response = await axios.post(
      FALLBACK_HF_CAPTION_API_URL,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json',
        timeout: 15000 // 15 second timeout
      }
    );
    
    console.log('[API] Fallback Caption API Response Status:', response.status);
    
    // Extract the generated caption
    if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].generated_text) {
      return response.data[0].generated_text;
    }
    if (response.data && response.data.generated_text) {
      return response.data.generated_text;
    }
    
    return 'Image containing visual content.'; // Very basic fallback
  } catch (error) {
    console.error('[API] Error in fallback captioning:', error);
    return 'Image with unidentified content.'; // Ultimate fallback
  }
}

/**
 * Analyze engagement potential using text classification
 */
async function analyzeEngagement(caption: string, apiKey: string): Promise<EngagementAnalysis> {
  console.log(`[API] Calling HF Engagement API: ${HF_ENGAGEMENT_API_URL}`);
  if (!caption || caption === 'Unable to generate caption for this image.') {
      console.warn('[API] Skipping engagement analysis due to missing caption.');
      return { score: 30, level: 'Low', prediction: 'unknown (no caption)' }; // Default low score if no caption
  }
  try {
    const candidateLabels = ["high engagement", "low engagement", "moderate engagement"];
    
    const response = await axios.post(
      HF_ENGAGEMENT_API_URL,
      {
        inputs: caption,
        parameters: {
          candidate_labels: candidateLabels,
          multi_label: false // Ensure single label output
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    console.log('[API] HF Engagement API Response Status:', response.status);

    if (!response.data || !response.data.scores || !response.data.labels || response.data.scores.length !== candidateLabels.length) {
        console.warn('[API] Unexpected engagement response format:', response.data);
        throw new Error('Invalid response from engagement analysis model.');
    }
    
    const scores: number[] = response.data.scores;
    const resultLabels: string[] = response.data.labels;
    const highestIndex = scores.indexOf(Math.max(...scores));
    const prediction = resultLabels[highestIndex];

    // Convert the prediction to an engagement score (0-100)
    let score = 50; // Default to moderate
    const confidence = scores[highestIndex];

    switch (prediction) {
        case "high engagement":
            score = 70 + Math.round(confidence * 30); // Scale 70-100 based on confidence
            break;
        case "low engagement":
            score = 40 - Math.round(confidence * 30); // Scale 10-40 based on confidence
            break;
        case "moderate engagement":
             // Adjust range slightly: 40-70
            score = 40 + Math.round(confidence * 30);
            break;
    }
    // Ensure score is within 0-100 bounds
    score = Math.max(0, Math.min(100, score)); 
    
    return {
      score: score,
      level: getEngagementLevel(score),
      prediction: prediction
    };
  } catch (error: any) {
    console.error('[API] Error predicting engagement:', error.response?.data || error.message);
    // Fallback to a neutral score
    if (error.response?.data?.error?.includes('currently loading')) {
        throw new Error('Analysis model is starting up, please try again in a moment.');
    }
    console.warn('[API] Falling back to default engagement score due to error.');
    return {
      score: 50,
      level: 'Moderate',
      prediction: 'unknown (error)'
    };
  }
}

/**
 * Get engagement level text based on score (adjusted slightly for nuance)
 */
function getEngagementLevel(score: number): string {
  if (score >= 85) return 'Excellent'; // New top tier
  if (score >= 70) return 'Very High'; // Was 80
  if (score >= 55) return 'High';      // Was 65
  if (score >= 40) return 'Moderate';  // Was 45
  if (score >= 25) return 'Low';       // Was 30
  return 'Very Low'; // Below 25
}

/**
 * Determines content category and provides relevant tips.
 */
function getCategoryAndTips(caption: string): { category: string; tips: string[] } {
    const lowerCaption = caption.toLowerCase();
    let category = 'General'; // Default category
    let tips: string[] = [];

    // Define tips for different categories
    const categoryData: Record<string, string[]> = {
        Sports: [
            'Action shots showing movement perform better than static poses.',
            'Include team colors or logos where appropriate for stronger identity.',
            'Capture peak moments or emotional reactions for higher impact.',
        ],
        Food: [
            'Use natural lighting; avoid harsh flash photography.',
            'Shoot from overhead (flat lay) or a 45-degree angle for best presentation.',
            "Garnish or slight 'messiness' can make food look more appealing and real.",
        ],
        Nature: [
            'Shoot during Golden Hour (early morning/late afternoon) for dramatic lighting.',
            'Use the rule of thirds for balanced landscape compositions.',
            "Incorporate leading lines (paths, rivers) to guide the viewer's eye.",
        ],
        Portrait: [
            "Ensure the subject's eyes are sharp and in focus.",
            'Use soft, diffused lighting (natural window light is great). Avoid direct overhead sun.',
            "Experiment with different angles; slightly above eye-level is often flattering.",
        ],
        Travel: [
            'Include people (yourself or others) in landmark photos to add scale and relatability.',
            'Capture unique details or perspectives, not just the main attraction.',
            'Showcase local culture, food, or activities beyond just sightseeing.',
        ],
        Product: [
            'Use clean, uncluttered backgrounds to keep focus on the product.',
            'Show the product in use or in a relevant lifestyle context.',
            'Ensure high resolution and sharp focus on product details.',
        ],
        General: [
            'Prioritize high resolution and good lighting regardless of subject.',
            "Tell a story or evoke an emotion with your image and caption.",
            'Maintain a consistent visual style across your posts.',
        ],
    };

    // Simple keyword-based category detection (can be expanded)
    if (['sport', 'tennis', 'basketball', 'soccer', 'football', 'playing', 'athlete', 'running', 'game', 'match'].some(kw => lowerCaption.includes(kw))) {
        category = 'Sports';
    } else if (['food', 'meal', 'restaurant', 'eating', 'dish', 'plate', 'cooking', 'cuisine', 'drink', 'beverage', 'recipe'].some(kw => lowerCaption.includes(kw))) {
        category = 'Food';
    } else if (['nature', 'outdoor', 'landscape', 'mountain', 'beach', 'forest', 'sunset', 'hiking', 'flower', 'animal', 'wildlife'].some(kw => lowerCaption.includes(kw))) {
        category = 'Nature';
        tips = categoryData['Nature'].concat(["If featuring animals, focus on capturing their personality or expressions."]);
    } else if (['selfie', 'portrait', 'face', 'person', 'model', 'headshot'].some(kw => lowerCaption.includes(kw) && !lowerCaption.includes('group'))) {
        category = 'Portrait';
    } else if (['travel', 'vacation', 'trip', 'tourist', 'landmark', 'destination', 'city', 'explore'].some(kw => lowerCaption.includes(kw))) {
        category = 'Travel';
    } else if (['product', 'item', 'merchandise', 'showcase', 'review'].some(kw => lowerCaption.includes(kw))) {
        category = 'Product';
    }

    // Assign tips if not already assigned
    if (tips.length === 0) {
        tips = categoryData[category] ? [...categoryData[category]] : [...categoryData['General']];
    }
    
    let generalTips = [...categoryData['General']];
    // Ensure we always have exactly 3 tips
    while (tips.length < 3 && generalTips.length > 0) {
        const fallbackTip = generalTips.shift(); 
        if (fallbackTip && !tips.includes(fallbackTip)) {
            tips.push(fallbackTip);
        }
    }

    return { category, tips: tips.slice(0, 3) }; // Return category and top 3 tips
}

/**
 * Generate prioritized pros, cons, and actionable suggestions (ensuring 3 of each).
 */
function generateInsights(caption: string, engagementAnalysis: EngagementAnalysis, technical: TechnicalAnalysis) {
  const potentialPros: { text: string; score: number }[] = [];
  const potentialCons: { text: string; score: number }[] = [];
  const suggestions: string[] = [];
  
  const lowerCaption = caption.toLowerCase();
  
  // --- Pool Generation: Technical Insights ---
  // Resolution
  if (technical.resolutionRating === 'Good') {
      potentialPros.push({ text: `High Resolution (${technical.width}x${technical.height}px ensures sharp display)`, score: 8 });
  } else if (technical.resolutionRating === 'Fair') {
      potentialCons.push({ text: `Resolution may be insufficient (${technical.width}x${technical.height}px) for larger displays or zooming`, score: 7 });
  } else { // Poor
      potentialCons.push({ text: `Low Resolution (${technical.width}x${technical.height}px) likely appears pixelated or blurry`, score: 9 });
  }

  // File Size
  if (technical.sizeRating === 'Excellent') {
       potentialPros.push({ text: `Optimized File Size (~${technical.fileSizeMB.toFixed(1)}MB) ensures fast loading`, score: 7 });
  } else if (technical.sizeRating === 'Good') {
      potentialPros.push({ text: `Acceptable File Size (~${technical.fileSizeMB.toFixed(1)}MB)`, score: 5 });
       potentialCons.push({ text: `File Size (~${technical.fileSizeMB.toFixed(1)}MB) could be optimized further for faster loading`, score: 4 });
  } else { // Fair
      potentialCons.push({ text: `Large File Size (~${technical.fileSizeMB.toFixed(1)}MB) may lead to slow loading times`, score: 8 });
  }
  
  // Aspect Ratio (Adding more detail based on platform fit)
  const igPostRec = generatePlatformRecommendations(technical.width, technical.height).instagramPost;
  const igStoryRec = generatePlatformRecommendations(technical.width, technical.height).instagramStory;
  if (igPostRec?.includes('ideal')) {
      potentialPros.push({ text: `Ideal Aspect Ratio (${technical.aspectRatio}) for Instagram Feed posts`, score: 6 });
  } else {
      potentialCons.push({ text: `Suboptimal Aspect Ratio (${technical.aspectRatio}) for Instagram Feed (suggests ${igPostRec?.includes('1:1') ? '1:1 or 4:5' : '4:5 or 1:1'})`, score: 5 });
  }
   if (igStoryRec?.includes('ideal')) {
      potentialPros.push({ text: `Ideal Aspect Ratio (${technical.aspectRatio}) for Stories/Reels/TikTok`, score: 6 });
  } else {
      potentialCons.push({ text: `Suboptimal Aspect Ratio (${technical.aspectRatio}) for Stories/Reels/TikTok (suggests 9:16)`, score: 5 });
  }

  // --- Pool Generation: Content Insights (from caption) ---
  const positiveKeywords = ['person', 'people', 'face', 'woman', 'man', 'child', 'smiling', 'happy', 'laughing', 'animal', 'dog', 'cat', 'pet', 'puppy', 'kitten', 'cute'];
  const aestheticKeywords = ['beautiful', 'stunning', 'gorgeous', 'lovely', 'colorful', 'bright', 'vibrant', 'clear', 'sharp', 'focused', 'scenic', 'landscape'];
  const foodKeywords = ['food', 'meal', 'dish', 'restaurant', 'cooking', 'delicious', 'beverage', 'drink'];
  const negativeKeywords = ['dark', 'blurry', 'fuzzy', 'low quality', 'out of focus', 'messy', 'cluttered', 'text']; // Added 'text' as generally negative for pure images
  const actionKeywords = ['click', 'link in bio', 'shop now', 'learn more', 'swipe up', 'comment below', 'tag a friend', 'what do you think', '?'];

  if (positiveKeywords.some(kw => lowerCaption.includes(kw))) {
      potentialPros.push({ text: 'Includes highly engaging subjects (people/animals/positive emotion) which boosts connection', score: 9 });
  } 
  if (aestheticKeywords.some(kw => lowerCaption.includes(kw))) {
      potentialPros.push({ text: 'Appears visually appealing (bright, colorful, scenic, clear) which captures attention', score: 8 });
  }
  if (foodKeywords.some(kw => lowerCaption.includes(kw))) {
      potentialPros.push({ text: 'Features food/drink content, often highly shareable and engaging', score: 7 });
  }
  if (actionKeywords.some(kw => lowerCaption.includes(kw))) {
       potentialPros.push({ text: 'Caption potentially includes a Call-to-Action or question, encouraging interaction', score: 6 });
  }
  if (negativeKeywords.some(kw => lowerCaption.includes(kw))) {
      potentialCons.push({ text: 'Potential visual clarity issues detected (dark, blurry, cluttered, text overlay) which can deter viewers', score: 9 });
  }
  if (!positiveKeywords.some(kw => lowerCaption.includes(kw)) && !foodKeywords.some(kw => lowerCaption.includes(kw))) {
       potentialCons.push({ text: 'Lacks common high-engagement subjects like people, animals, or food', score: 6 });
  }
  if (!aestheticKeywords.some(kw => lowerCaption.includes(kw)) && !lowerCaption.includes('minimalist')) { // Avoid penalizing intentional minimalism
      potentialCons.push({ text: 'May lack strong visual appeal (consider brightness, color, composition)', score: 5 });
  }
   if (!actionKeywords.some(kw => lowerCaption.includes(kw))) {
       potentialCons.push({ text: 'Caption appears to lack a direct Call-to-Action or question', score: 3 }); // Lower priority
   }

  // --- Pool Generation: Engagement Insights ---
  if (engagementAnalysis.score >= 85) { potentialPros.push({ text: `Excellent (${engagementAnalysis.score}) predicted engagement`, score: 10 }); }
  else if (engagementAnalysis.score >= 70) { potentialPros.push({ text: `Very High (${engagementAnalysis.score}) predicted engagement`, score: 9 }); }
  else if (engagementAnalysis.score >= 55) { potentialPros.push({ text: `High (${engagementAnalysis.score}) predicted engagement`, score: 7 }); }
  else if (engagementAnalysis.score >= 40) { potentialCons.push({ text: `Moderate (${engagementAnalysis.score}) predicted engagement - potential for improvement`, score: 4 }); }
  else if (engagementAnalysis.score >= 25) { potentialCons.push({ text: `Low (${engagementAnalysis.score}) predicted engagement`, score: 8 }); }
  else { potentialCons.push({ text: `Very Low (${engagementAnalysis.score}) predicted engagement - needs significant revision`, score: 10 }); }

  // --- Prioritize and Select Top 3 Pros and Cons ---
  potentialPros.sort((a, b) => b.score - a.score);
  potentialCons.sort((a, b) => b.score - a.score);

  const selectedPros = potentialPros.slice(0, 3).map(p => p.text);
  const selectedCons = potentialCons.slice(0, 3).map(c => c.text);

  // --- Add Fallbacks if needed ---
  const fallbackPros = [
      'Clear main subject', 
      'Relevant to common social media themes',
      'Standard file format likely compatible everywhere',
      'Composition appears balanced'
  ];
  const fallbackCons = [
      'Lacks strong visual uniqueness or novelty', 
      'Image may not tell a clear story on its own',
      'Could benefit from stronger branding elements',
      'Engagement might heavily depend on caption quality'
  ];

  let proFallbackIdx = 0;
  while (selectedPros.length < 3 && proFallbackIdx < fallbackPros.length) {
      if (!selectedPros.includes(fallbackPros[proFallbackIdx])) {
          selectedPros.push(fallbackPros[proFallbackIdx]);
      }
      proFallbackIdx++;
  }

  let conFallbackIdx = 0;
  while (selectedCons.length < 3 && conFallbackIdx < fallbackCons.length) {
       if (!selectedCons.includes(fallbackCons[conFallbackIdx])) {
          selectedCons.push(fallbackCons[conFallbackIdx]);
      }
      conFallbackIdx++;
  }

  // --- Generate Suggestions based ONLY on SELECTED Cons ---
  selectedCons.forEach(con => {
    const conLower = con.toLowerCase();
    if (conLower.includes('resolution')) {
        suggestions.push(`Improve Resolution: Upscale the image using an AI tool or find a higher-quality source (aim for >${MIN_RESOLUTION_GOOD}px width/height).`);
    } else if (conLower.includes('file size')) {
        suggestions.push(`Optimize Size: Compress the image using tools like TinyPNG/Squoosh or export as WEBP format to reduce size under ${MAX_FILE_SIZE_GOOD}MB without losing quality.`);
    } else if (conLower.includes('aspect ratio')) {
        suggestions.push(`Adjust Aspect Ratio: Crop the image to the recommended ratio (e.g., 1:1, 4:5 for Feed; 9:16 for Stories) using an editor.`);
    } else if (conLower.includes('clarity issues') || conLower.includes('dark') || conLower.includes('blurry')) {
        suggestions.push(`Enhance Clarity: Use editing tools to increase brightness, contrast, and sharpness. Ensure the main subject is clearly in focus.`);
    } else if (conLower.includes('appeal') || conLower.includes('color') || conLower.includes('composition')) {
        suggestions.push(`Boost Visual Appeal: Experiment with color correction, saturation boosts, different angles, or simplifying the background composition.`);
    } else if (conLower.includes('subjects') || conLower.includes('people') || conLower.includes('animal')) {
        suggestions.push(`Add Engaging Elements: If appropriate, incorporate people (showing emotion), pets, or relatable objects into the scene.`);
    } else if (conLower.includes('engagement')) { // Low/Moderate engagement
        suggestions.push(`Increase Interaction: Write a compelling caption that asks a question, tells a story, or includes a clear call-to-action.`);
        if (engagementAnalysis.score < 55) {
            suggestions.push('Analyze Competitors: Review top-performing posts in your niche for inspiration on style, content, and captions.');
        }
    } else if (conLower.includes('call-to-action')) {
        suggestions.push("Refine Caption: Add a specific question or instruction (e.g., 'Link in bio!', 'Comment below!', 'What\'s your favorite?') to guide user interaction.");
    } else if (conLower.includes('uniqueness') || conLower.includes('story') || conLower.includes('branding')) {
        suggestions.push('Elevate Content: Focus on a unique perspective, stronger narrative, or clearer brand integration to make the post stand out.');
    }
  });

  // Limit suggestions for brevity if too many were generated
  if (suggestions.length > 5) {
      suggestions.splice(5);
  }
  // Ensure at least one suggestion if there were cons but none matched above logic
  if (selectedCons.length > 0 && suggestions.length === 0) {
      suggestions.push('Review the areas for improvement and consider general best practices for visual appeal and captioning.');
  }

  // --- Generate Final Recommendation based on score and number/severity of cons ---
  let recommendation = 'Overall assessment: Fair potential. Requires attention to suggestions.'; // Default
  const highImpactCons = potentialCons.slice(0, 3).filter(c => c.score >= 7).length; // Count high-priority cons among the top 3 selected

  if (engagementAnalysis.score >= 85 && highImpactCons === 0) {
      recommendation = 'Excellent! Looks ready to post. High engagement potential and good technicals.';
  } else if (engagementAnalysis.score >= 70 && highImpactCons <= 1) {
      recommendation = 'Very Good! Strong engagement potential. Address minor suggestions for best results.';
  } else if (engagementAnalysis.score >= 55 && highImpactCons <= 1) {
      recommendation = 'Good potential. Implement the suggestions provided to maximize reach and impact.';
  } else if (engagementAnalysis.score >= 40) {
      recommendation = 'Moderate potential. Focus on implementing the key suggestions, especially visual improvements.';
  } else { // score < 40 or multiple high impact cons
      recommendation = 'Needs Improvement. Significant revisions recommended based on the suggestions below.';
  }

  return { pros: selectedPros, cons: selectedCons, suggestions, recommendation };
}

// --- API Route Handler ---

export async function POST(request: NextRequest) {
  console.log('[API] POST /api/analyze-social-post: Received request');
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('[API] Invalid content type:', contentType);
      return NextResponse.json({ error: 'Invalid content type: Must be multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const widthStr = formData.get('width') as string | null;
    const heightStr = formData.get('height') as string | null;
    const fileSizeMBStr = formData.get('fileSizeMB') as string | null;

    if (!file || !widthStr || !heightStr || !fileSizeMBStr) {
      console.error('[API] Missing image file or technical data');
      return NextResponse.json({ error: 'Missing image file or technical data (width, height, size)' }, { status: 400 });
    }
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);
    const fileSizeMB = parseFloat(fileSizeMBStr);
    if (isNaN(width) || isNaN(height) || isNaN(fileSizeMB)) {
         console.error('[API] Invalid technical data format');
        return NextResponse.json({ error: 'Invalid technical data format' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    if (!hfApiKey) {
      console.error('[API] Hugging Face API key not configured');
      return NextResponse.json({ error: 'Hugging Face API key not configured' }, { status: 500 });
    }

    // Try primary caption first, then fallback to alternative model if it fails
    let caption;
    try {
      caption = await getImageCaption(buffer, hfApiKey);
    } catch (error) {
      console.warn('[API] Primary captioning failed, trying fallback:', error);
      // Try fallback captioning
      caption = await getFallbackImageCaption(buffer, hfApiKey);
      // If we still don't have a useful caption, we can construct a very basic one
      if (!caption || caption.includes('unidentified content')) {
        caption = `Image with dimensions ${width}x${height}px showing visual content.`;
      }
    }
    
    const finalEngagementAnalysis = await analyzeEngagement(caption, hfApiKey); // Then engagement based on caption
    const technical = evaluateTechnicalAspects(width, height, fileSizeMB);
    const platformRecommendations = generatePlatformRecommendations(width, height);
    
    // *** Call the updated generateInsights function ***
    const insights = generateInsights(caption, finalEngagementAnalysis, technical);
    
    // *** Get Category and Tips ***
    const { category, tips: categoryTips } = getCategoryAndTips(caption);
    console.log(`[API] Detected Category: ${category}, Tips:`, categoryTips);

    // Prepare the final analysis result object
    const analysisResult: ContentAnalysis = {
        caption: caption,
        engagement: finalEngagementAnalysis,
        technical: technical,
        platformRecommendations: platformRecommendations,
        pros: insights.pros,         // Use results from insights
        cons: insights.cons,         // Use results from insights
        suggestions: insights.suggestions, // Use results from insights
        recommendation: insights.recommendation, // Use results from insights
        category: category,         // Include category
        categoryTips: categoryTips, // Include tips
    };

    console.log('[API] Analysis complete. Sending response.');
    return NextResponse.json({ analysis: analysisResult });

  } catch (error: any) {
    console.error('[API] Error in /api/analyze-social-post:', error);
    // Ensure error message is extracted correctly
    const message = error instanceof Error ? error.message : 'An unknown error occurred during analysis';
    return NextResponse.json(
      { error: message },
      // Use 500 for server errors, potentially 422 or 400 for specific client-side data issues if identifiable
      { status: (message.includes('model is starting up') || message.includes('timeout')) ? 503 : 500 } 
    );
  }
} 