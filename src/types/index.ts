/**
 * Core application type definitions
 */

/**
 * Analysis response from the image analysis API
 */
export type AnalysisResult = {
  approvalStatus: {
    approved: boolean;
    reason: string;
  };
  safeSearch?: {
    adult: string;
    medical: string;
    racy: string;
    spoof: string;
    violence: string;
  };
  labels?: any[];
  faces?: any[];
  engagementPotential?: number;
  summary: string;
  categories?: string[] | string | { [key: string]: any };
  platformFit?: string[] | string;
  socialMediaPotential?: string;
  optimizationTips?: string[] | string;
  captionIdeas?: string[];
  hashtagRecommendations?: string[];
  platformRecommendations?: { [key: string]: string };
  contentSeriesPotential?: string;
  
  // New fields for Hugging Face integration
  pros?: string[];
  cons?: string[];
  recommendation?: string;
  socialMediaAnalysis?: {
    caption: string;
    engagement: {
      score: number;
      level: string;
    };
    pros: string[];
    cons: string[];
    recommendation: string;
  };
};

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
export function getEngagementText(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 65) return 'High';
  if (score >= 45) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Very Low';
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