/**
 * Storyboard and video generation types
 */

export type ShotType = 'establishing' | 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'overhead' | 'drone';
export type GenerationStatus = 'pending' | 'generating' | 'complete' | 'failed';
export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral' | 'thoughtful' | 'confident' | 'confused' | 'anxious' | 'excited';
export type CharacterPosition = 'foreground' | 'background' | 'left' | 'right' | 'center';
export type VideoQuality = 'draft' | 'standard' | 'high';

export interface Character {
  id: string;
  name: string;
  modelId: string;
  emotion: EmotionType;
  position: CharacterPosition;
  features?: string[]; // Persistent features to maintain consistency
}

export interface Scene {
  id: string;
  description: string;
  shotType: ShotType;
  characters: Character[];
  setting: string;
  keyframeImageUrl?: string;
  generationStatus: GenerationStatus;
  sequenceNumber: number;
  timestamp: number; // Position in seconds within the video
  generationParameters?: Record<string, any>; // Store parameters used for generation
}

export interface Storyboard {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'complete' | 'processing' | 'failed';
  scenes: Scene[];
}

export interface Video {
  id: string;
  storyboardId: string;
  url: string;
  duration: number;
  createdAt: Date;
  status: 'processing' | 'complete' | 'failed';
  processingMetadata?: Record<string, any>;
}

export interface VideoOptions {
  fps: number;
  resolution: string;
  quality: VideoQuality;
  music?: string;
  transitionStyle?: string;
}

export interface KeyframeData {
  imageUrl: string;
  timestamp: number;
  characters: string[];
  sceneMetadata: Record<string, any>;
}

export interface ModelParameters {
  facialFeatures: Record<string, any>;
  bodyType: string;
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  clothing: string[];
  accessories: string[];
  distinguishingFeatures: string[];
}

export interface ImageGenerationParams {
  prompt: string;
  modelIds: string[];
  previousImageUrl?: string;
  consistencyLevel: 'low' | 'medium' | 'high';
}

export interface ImageGenerationResult {
  imageUrl: string;
  metadata: Record<string, any>;
}

export interface ShotTypeReference {
  name: string;
  description: string;
  exampleImageUrl: string;
  promptTerms: string[];
}

export interface EmotionReference {
  name: EmotionType;
  description: string;
  promptTerms: string[];
} 