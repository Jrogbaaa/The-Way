import { NextRequest, NextResponse } from 'next/server';
import { analyzeImageWithVertexAI } from '@/lib/api/vertex';

export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Request must be multipart/form-data' }, { status: 400 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Use Vertex AI to analyze the image
    const analysis = await analyzeImageWithVertexAI(buffer);

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
 * Analyze image content for social media appropriateness
 */
function analyzeForSocialMedia(safeSearch: any, labels: any[]) {
  if (!safeSearch) {
    return {
      approved: false,
      reason: 'Unable to analyze image content for safety'
    };
  }

  // Check for explicit content (adult, violence, medical)
  const explicitRisks = [];
  
  if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') {
    explicitRisks.push('adult content');
  }
  
  if (safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
    explicitRisks.push('violent content');
  }
  
  if (safeSearch.medical === 'LIKELY' || safeSearch.medical === 'VERY_LIKELY') {
    explicitRisks.push('sensitive medical content');
  }
  
  if (safeSearch.racy === 'VERY_LIKELY') {
    explicitRisks.push('racy content');
  }

  // Check for potentially sensitive topics in labels
  const sensitiveLabels = labels?.filter(label => {
    const name = label.description?.toLowerCase();
    return name && (
      name.includes('weapon') ||
      name.includes('blood') ||
      name.includes('drug') ||
      name.includes('alcohol') ||
      name.includes('tobacco') ||
      name.includes('smoking')
    );
  });

  if (explicitRisks.length > 0) {
    return {
      approved: false,
      reason: `Image contains ${explicitRisks.join(', ')}`
    };
  }

  if (sensitiveLabels?.length > 0) {
    return {
      approved: false,
      reason: `Image contains sensitive content: ${sensitiveLabels.map(l => l.description).join(', ')}`
    };
  }

  return {
    approved: true,
    reason: 'Image appears appropriate for social media'
  };
}

/**
 * Generate a human-readable summary of the image analysis
 */
function generateAnalysisSummary(safeSearch: any, labels: any[], faces: any[]) {
  const summaryParts = [];

  // Add safe search findings
  if (safeSearch) {
    const safetyRisks = [];
    
    if (safeSearch.adult === 'POSSIBLE' || safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') {
      safetyRisks.push(`adult content (${safeSearch.adult.toLowerCase()})`);
    }
    
    if (safeSearch.violence === 'POSSIBLE' || safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
      safetyRisks.push(`violent content (${safeSearch.violence.toLowerCase()})`);
    }
    
    if (safeSearch.medical === 'POSSIBLE' || safeSearch.medical === 'LIKELY' || safeSearch.medical === 'VERY_LIKELY') {
      safetyRisks.push(`medical content (${safeSearch.medical.toLowerCase()})`);
    }
    
    if (safeSearch.racy === 'POSSIBLE' || safeSearch.racy === 'LIKELY' || safeSearch.racy === 'VERY_LIKELY') {
      safetyRisks.push(`racy content (${safeSearch.racy.toLowerCase()})`);
    }

    if (safetyRisks.length > 0) {
      summaryParts.push(`Safety concerns: ${safetyRisks.join(', ')}.`);
    } else {
      summaryParts.push('No safety concerns detected.');
    }
  }

  // Add content summary from labels
  if (labels && labels.length > 0) {
    // Get top labels by confidence score
    const topLabels = labels
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map(label => label.description);
      
    summaryParts.push(`Main content: ${topLabels.join(', ')}.`);
    
    // Check for specific content categories
    const categories = {
      nature: ['nature', 'landscape', 'tree', 'forest', 'mountain', 'beach', 'ocean', 'sky', 'flower', 'plant'],
      people: ['person', 'face', 'portrait', 'people', 'crowd', 'human', 'woman', 'man', 'child', 'girl', 'boy'],
      urban: ['building', 'architecture', 'city', 'street', 'urban', 'skyline', 'infrastructure'],
      food: ['food', 'meal', 'dish', 'cuisine', 'restaurant', 'cooking', 'fruit', 'vegetable', 'dessert'],
      animals: ['animal', 'dog', 'cat', 'bird', 'pet', 'wildlife', 'fish', 'horse', 'mammal'],
      product: ['product', 'design', 'fashion', 'clothing', 'merchandise', 'accessory', 'technology', 'device'],
      art: ['art', 'illustration', 'painting', 'design', 'drawing', 'sculpture', 'artistic'],
      sport: ['sport', 'athlete', 'game', 'exercise', 'fitness', 'competition', 'ball', 'workout']
    };
    
    // Check which categories the image belongs to
    const detectedCategories = Object.entries(categories)
      .filter(([_, keywords]) => 
        labels.some(label => 
          keywords.some(keyword => 
            label.description?.toLowerCase().includes(keyword)
          )
        )
      )
      .map(([category]) => category);
    
    if (detectedCategories.length > 0) {
      summaryParts.push(`Content categories: ${detectedCategories.join(', ')}.`);
    }
    
    // Analyze social media potential
    const engagementScore = calculateEngagementPotential(labels, detectedCategories);
    
    const engagementLevel = 
      engagementScore > 80 ? 'very high' :
      engagementScore > 60 ? 'high' :
      engagementScore > 40 ? 'moderate' :
      engagementScore > 20 ? 'low' : 'very low';
      
    summaryParts.push(`Estimated social media engagement potential: ${engagementLevel}.`);
  }

  // Add information about faces
  if (faces && faces.length > 0) {
    summaryParts.push(`Contains ${faces.length} face${faces.length > 1 ? 's' : ''}.`);
    
    // Check for facial expressions
    const emotions = faces.map(face => {
      const emotions = [];
      if (face.joyLikelihood === 'LIKELY' || face.joyLikelihood === 'VERY_LIKELY') emotions.push('joy');
      if (face.sorrowLikelihood === 'LIKELY' || face.sorrowLikelihood === 'VERY_LIKELY') emotions.push('sorrow');
      if (face.angerLikelihood === 'LIKELY' || face.angerLikelihood === 'VERY_LIKELY') emotions.push('anger');
      if (face.surpriseLikelihood === 'LIKELY' || face.surpriseLikelihood === 'VERY_LIKELY') emotions.push('surprise');
      return emotions;
    }).flat();
    
    if (emotions.length > 0) {
      summaryParts.push(`Facial expressions include: ${emotions.join(', ')}.`);
    }
    
    // Assess if the image has good portrait quality
    const goodQualityPortrait = faces.some(face => 
      face.detectionConfidence > 0.8 && 
      !face.blurredLikelihood?.includes('LIKELY') && 
      !face.underExposedLikelihood?.includes('LIKELY')
    );
    
    if (goodQualityPortrait && faces.length === 1) {
      summaryParts.push('High quality portrait detected, good for profile pictures.');
    }
  }

  return summaryParts.join(' ');
}

/**
 * Calculate an estimated engagement potential score (0-100)
 */
function calculateEngagementPotential(labels: any[], categories: string[]): number {
  let score = 50; // Start with a neutral score
  
  // Boost score based on image content categories
  if (categories.includes('people')) score += 10;
  if (categories.includes('nature')) score += 8;
  if (categories.includes('food')) score += 7;
  if (categories.includes('animals')) score += 12;
  if (categories.includes('art')) score += 5;
  if (categories.includes('sport')) score += 5;
  
  // Check for high-engagement keywords in labels
  const engagingKeywords = [
    'cute', 'beautiful', 'amazing', 'stunning', 'adorable', 'funny', 'humor', 
    'interesting', 'unique', 'colorful', 'dramatic', 'luxury', 'travel', 'adventure',
    'baby', 'puppy', 'kitten', 'sunset', 'beach', 'vacation', 'celebrity'
  ];
  
  // Count how many engaging topics are in the image
  const engagingTopicsCount = labels.filter(label => 
    engagingKeywords.some(keyword => 
      label.description?.toLowerCase().includes(keyword)
    )
  ).length;
  
  // Add 5 points per engaging topic, up to 25 points
  score += Math.min(engagingTopicsCount * 5, 25);
  
  // Cap the score between 0-100
  return Math.max(0, Math.min(100, score));
} 