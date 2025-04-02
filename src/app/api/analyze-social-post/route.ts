import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Hugging Face API endpoint for image analysis - using image-to-text model
const HF_API_URL = 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large';
// Hugging Face API endpoint for engagement prediction - using text classification
const HF_ENGAGEMENT_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/analyze-social-post: Starting request processing');
    
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      console.error('No image file provided in form data');
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    console.log('Image file received:', file.name, file.type, file.size + ' bytes');
    
    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);

    // Get Hugging Face API key from environment variable
    const hfApiKey = process.env.HUGGING_FACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'Hugging Face API key not configured' }, { status: 500 });
    }

    // Analyze the image with Hugging Face image-to-text model
    const imageCaption = await getImageCaption(buffer, hfApiKey);
    console.log('Image caption:', imageCaption);

    // Predict engagement using the caption and any text information
    const engagementAnalysis = await analyzeEngagement(imageCaption, hfApiKey);
    
    // Generate pros and cons based on the analysis
    const { pros, cons } = generateProsAndCons(imageCaption, engagementAnalysis);

    // Prepare the final analysis result
    const analysis = {
      caption: imageCaption,
      engagement: {
        score: engagementAnalysis.score,
        level: getEngagementLevel(engagementAnalysis.score),
      },
      pros,
      cons,
      recommendation: getRecommendation(engagementAnalysis.score, pros, cons)
    };

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error analyzing image' },
      { status: 500 }
    );
  }
}

/**
 * Get image caption using Hugging Face image-to-text model
 */
async function getImageCaption(imageBuffer: Buffer, apiKey: string): Promise<string> {
  try {
    const response = await axios.post(
      HF_API_URL,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream'
        },
        responseType: 'json'
      }
    );
    
    // Extract the generated caption
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0].generated_text;
    }
    
    return response.data.generated_text || 'Unable to generate caption for this image';
  } catch (error) {
    console.error('Error getting image caption from Hugging Face:', error);
    throw new Error('Failed to analyze image content');
  }
}

/**
 * Analyze engagement potential using text classification
 */
async function analyzeEngagement(caption: string, apiKey: string) {
  try {
    // Define candidate labels for the classification model
    const candidateLabels = ["high engagement", "low engagement", "moderate engagement"];
    
    // Call Hugging Face API for text classification
    const response = await axios.post(
      HF_ENGAGEMENT_API_URL,
      {
        inputs: caption,
        parameters: {
          candidate_labels: candidateLabels
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Parse results - find highest scoring label
    const scores = response.data.scores;
    const resultLabels = response.data.labels;
    const highestIndex = scores.indexOf(Math.max(...scores));
    
    // Convert the prediction to an engagement score (0-100)
    let score = 50; // Default to moderate
    if (resultLabels[highestIndex] === "high engagement") {
      score = 80 + (scores[highestIndex] * 20); // 80-100 range
    } else if (resultLabels[highestIndex] === "low engagement") {
      score = Math.max(20, 50 - (scores[highestIndex] * 30)); // 20-50 range
    } else {
      score = 50 + (scores[highestIndex] * 15); // 50-65 range for moderate
    }
    
    return {
      score: Math.min(100, Math.round(score)),
      prediction: resultLabels[highestIndex]
    };
  } catch (error) {
    console.error('Error predicting engagement:', error);
    // Fallback to a neutral score
    return {
      score: 50,
      prediction: 'moderate engagement'
    };
  }
}

/**
 * Generate pros and cons based on the image and engagement analysis
 */
function generateProsAndCons(caption: string, engagementAnalysis: any) {
  const pros = [];
  const cons = [];
  
  // Analyze caption content for common engagement factors
  const lowerCaption = caption.toLowerCase();
  
  // Check for positive engagement factors
  if (lowerCaption.includes('person') || lowerCaption.includes('people') || 
      lowerCaption.includes('face') || lowerCaption.includes('woman') || 
      lowerCaption.includes('man') || lowerCaption.includes('child')) {
    pros.push('Contains people, which typically increases engagement');
  }
  
  if (lowerCaption.includes('colorful') || lowerCaption.includes('bright') || 
      lowerCaption.includes('vibrant')) {
    pros.push('Bright/colorful content tends to attract more attention');
  }
  
  if (lowerCaption.includes('food') || lowerCaption.includes('meal') || 
      lowerCaption.includes('dish') || lowerCaption.includes('restaurant')) {
    pros.push('Food content generally performs well on social media');
  }
  
  if (lowerCaption.includes('animal') || lowerCaption.includes('dog') || 
      lowerCaption.includes('cat') || lowerCaption.includes('pet')) {
    pros.push('Animal content typically generates high engagement');
  }
  
  if (lowerCaption.includes('beautiful') || lowerCaption.includes('stunning') || 
      lowerCaption.includes('gorgeous')) {
    pros.push('Aesthetically pleasing content tends to perform better');
  }
  
  // Check for negative engagement factors
  if (lowerCaption.includes('dark') || lowerCaption.includes('blurry') || 
      lowerCaption.includes('fuzzy')) {
    cons.push('Dark or blurry images may reduce viewer interest');
  }
  
  if (lowerCaption.includes('text') && lowerCaption.includes('small')) {
    cons.push('Small text in images is difficult to read on mobile devices');
  }
  
  if (lowerCaption.includes('complex') || lowerCaption.includes('complicated')) {
    cons.push('Overly complex images may not perform well on quick-scrolling platforms');
  }
  
  // Engagement score-based factors
  if (engagementAnalysis.score >= 75) {
    pros.push('Content has characteristics of high-performing social media posts');
  } else if (engagementAnalysis.score <= 35) {
    cons.push('Content lacks elements typically found in viral social media posts');
  }
  
  // Add more generic pros/cons if we don't have enough
  if (pros.length === 0) {
    if (engagementAnalysis.score > 50) {
      pros.push('Image has good general appeal for social sharing');
    } else {
      pros.push('Content appears clear and understandable');
    }
  }
  
  if (cons.length === 0) {
    if (engagementAnalysis.score < 50) {
      cons.push('May benefit from more attention-grabbing elements');
    } else {
      cons.push('Consider adding a compelling caption to maximize engagement');
    }
  }
  
  return { pros, cons };
}

/**
 * Get engagement level text based on score
 */
function getEngagementLevel(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 65) return 'High';
  if (score >= 45) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

/**
 * Generate a recommendation based on engagement analysis
 */
function getRecommendation(score: number, pros: string[], cons: string[]): string {
  if (score >= 75) {
    return 'This content is likely to perform well. Consider posting at peak engagement times for your audience.';
  } else if (score >= 60) {
    return 'Good potential for engagement. Consider enhancing with a strong caption and relevant hashtags.';
  } else if (score >= 40) {
    return `Moderate engagement potential. To improve, address: ${cons[0]?.toLowerCase() || 'visual clarity and appeal'}.`;
  } else {
    return 'Consider reworking this content to better align with social media best practices. Add more engaging elements or choose a different image.';
  }
} 