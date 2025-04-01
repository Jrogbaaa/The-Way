/**
 * Core application type definitions
 */

/**
 * Analysis response from the image analysis API
 */
export interface AnalysisResult {
  safeSearch: {
    adult: string;
    medical: string;
    racy: string;
    violence: string;
  };
  labels: Array<{
    description: string;
    score: number;
  }>;
  faces: Array<{
    joyLikelihood?: string;
    sorrowLikelihood?: string;
    angerLikelihood?: string;
    surpriseLikelihood?: string;
  }>;
  approvalStatus: {
    approved: boolean;
    reason: string;
  };
  summary: string;
  // Can be string or object with level and reasons or any other structure
  engagementPotential: string | {
    level?: string;
    reasons?: string[];
  } | Record<string, any>;
  categories?: string[] | string;
  socialMediaPotential?: string;
  platformFit?: string[] | string;
  optimizationTips?: string[] | string;
  // Enhanced fields
  platformRecommendations?: Record<string, string>;
  hashtagRecommendations?: string[];
  captionIdeas?: string[];
  contentSeriesPotential?: string;
}

/**
 * Type guard for checking if engagementPotential is an object
 */
export function isEngagementObject(
  value: string | { level?: string; reasons?: string[] } | Record<string, any> | undefined
): value is { level?: string; reasons?: string[] } {
  return typeof value === 'object' && value !== null && 'level' in value;
}

/**
 * Safely extracts engagement potential text from various possible formats
 * @param value The engagementPotential value from the API
 * @returns A string representation of the engagement potential
 */
export function getEngagementText(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    // Check if it has a level property
    if ('level' in value) {
      return value.level || 'Moderate';
    }
    
    // Handle specific structure with these keys (coming from social media analysis)
    if ('performanceExcellence' in value || 
        'personalMoments' in value || 
        'teamPeerInteractions' in value || 
        'teamPeers' in value ||
        'visualImpact' in value || 
        'authenticity' in value ||
        'emotionalAppeal' in value) {
      return 'High potential';
    }
    
    // Handle any other non-empty object
    if (Object.keys(value).length > 0) {
      return 'Moderate potential';
    }
  }
  
  return 'Moderate';
}

/**
 * Gallery item representation
 */
export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  likes: number;
  comments: number;
  date: string;
  tags: string[];
  author: {
    name: string;
    avatarUrl: string;
  };
}

/**
 * AI Model representation
 */
export interface AIModel {
  id: string;
  name: string;
  description: string;
  type: 'Image' | 'Text' | 'Audio' | 'Video' | 'Multimodal';
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Development';
  lastUpdated: string;
  performance: {
    accuracy: number;
    speed: number;
    efficiency: number;
  };
  usageCount: number;
}

/**
 * Content example for model pages
 */
export interface ContentExample {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  performance: {
    engagement: number;
    reach: number;
    conversion: number;
  };
}

/**
 * Audience persona for targeting
 */
export interface AudiencePersona {
  id: string;
  name: string;
  avatarUrl: string;
  demographics: {
    age: string;
    gender: string;
    location: string;
    income: string;
    education: string;
    occupation: string;
  };
  interests: string[];
  painPoints: string[];
  goals: string[];
  platforms: {
    name: string;
    usage: 'High' | 'Medium' | 'Low';
    preferredContentTypes: string[];
  }[];
  contentPreferences: {
    formats: string[];
    topics: string[];
    tone: string;
    frequency: string;
  };
}

/**
 * User profile
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'Admin' | 'User' | 'Editor';
  createdAt: string;
  settings?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    emailUpdates: boolean;
  };
}

/**
 * Application routes
 */
export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  models: '/models',
  modelsDetail: (id: string) => `/models/${id}`,
  targeting: '/targeting',
  gallery: '/gallery',
  uploadPost: '/upload-post',
  chat: '/chat',
  signup: '/auth/signup',
  login: '/auth/login',
  resetPassword: '/auth/reset-password',
  profile: '/profile',
  settings: '/settings',
}; 