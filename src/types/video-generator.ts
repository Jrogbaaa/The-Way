// Types for the 30-Second AI Video Generator feature

export interface KeyframePrompt {
  scene: number;
  prompt: string;
  cameraAngle?: string;
  lighting?: string;
  action?: string;
}

export interface GeneratedFrame {
  id: string;
  imageUrl: string;
  prompt: string;
  scene: number;
  metadata: Record<string, any>;
}

export interface StoryboardFrame {
  id: string;
  imageUrl: string;
  prompt: string;
  scene: number;
  approved?: boolean;
  metadata?: Record<string, any>;
}

export interface GeneratedVideo {
  videoUrl: string;
  thumbnailUrl: string;
  metadata: {
    duration: number;
    frameCount: number;
    keyframeCount: number;
  };
}

export interface CharacterReference {
  embedding: number[];
  visualTokens: string[];
  descriptors: string[];
}

export interface VideoOptions {
  fps: number;
  duration: number;
  style?: string;
  resolution: string;
  motionStrength?: number;
} 