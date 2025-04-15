/**
 * Application type definitions
 */

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Content types
export interface Content {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  url: string;
  content_type: 'image' | 'video' | 'text';
  source_model?: string;
  prompt?: string;
  visibility: 'public' | 'private' | 'unlisted';
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// AI Model types
export interface AIModel {
  id: string;
  name: string;
  description?: string;
  version?: string;
  type: 'replicate' | 'gemini' | 'vision' | 'custom';
  model_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
  is_public: boolean;
}

// Generation Job types
export interface GenerationJob {
  id: string;
  user_id: string;
  model_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  parameters?: Record<string, any>;
  result_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  content_id?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  model_id: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

// Form types
export interface ImageGenerationFormData {
  prompt: string;
  negative_prompt?: string;
  model_id: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

export interface ModelCreationFormData {
  name: string;
  description?: string;
  type: 'replicate' | 'gemini' | 'vision' | 'custom';
  base_model_id?: string;
  training_data?: File[];
  parameters?: Record<string, any>;
  is_public: boolean;
  keyword?: string;
}

// Application state types
export interface AppState {
  auth: AuthState;
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Plugin system types
export interface AIPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'model' | 'tool' | 'integration';
  entrypoint: () => any;
  metadata?: Record<string, any>;
}

export interface AIPluginRegistry {
  plugins: Record<string, AIPlugin>;
  register: (plugin: AIPlugin) => void;
  unregister: (pluginId: string) => void;
  get: (pluginId: string) => AIPlugin | undefined;
  list: () => AIPlugin[];
}

// Feature flags
export interface FeatureFlags {
  enableExperimentalModels: boolean;
  enableVideoGeneration: boolean;
  enableModelTraining: boolean;
  enableSocialSharing: boolean;
  enablePlugins: boolean;
} 