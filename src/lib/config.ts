/**
 * Application configuration settings
 * Centralizes all configuration variables and provides defaults
 */

export const APP_NAME = "Content AI Agent";

export const API_CONFIG = {
  // Supabase
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  
  // Replicate
  replicateApiToken: process.env.REPLICATE_API_TOKEN || "",
  cristinaModelId: "jrogbaaa/cristina:44dbcde3f6b2fdd42c5c25e6a81cb05a8b1b4b8a611b61d94dbd6e0d8dd1e24f",
  jaimeModelId: "jrogbaaa/jaimecreator:59d13a73db570b23b5b1128c9d2ae3d880e55e840b2ddd601da1cf5987b76be9",
  
  // Google
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "",
  
  // Video APIs
  runwayApiKey: process.env.RUNWAY_API_KEY || "",
  dIdApiKey: process.env.D_ID_API_KEY || "",
  runwayApiUrl: "https://api.runwayml.com/v1",
  dIdApiUrl: "https://api.d-id.com/v1",
  
  // Hugging Face
  huggingFaceApiKey: process.env.HUGGING_FACE_API_KEY || "",
  huggingFaceApiUrl: "https://api-inference.huggingface.co/models",
  videoGenerationModels: {
    stableVideoDiffusion: "stabilityai/stable-video-diffusion-img2vid-xt",
    zeroscopeXL: "cerspense/zeroscope_v2_XL",
    animateAnyone: "ByteDance/AnimateAnyone"
  },
  
  // App URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export const ROUTES = {
  home: "/",
  login: "/auth/login",
  signup: "/auth/signup",
  dashboard: "/dashboard",
  profile: "/profile",
  models: "/models",
  createModel: "/create-model",
  cristinaModel: "/models/cristina",
  jaimeModel: "/models/jaime",
  beaModel: "/models/bea",
  imageToVideo: "/models/image-to-video",
  quickVideoTest: "/quick-video-test",
  chat: "/chat",
  gallery: "/gallery",
  targeting: "/targeting",
  uploadPost: "/posts/upload",
  socialAnalyzer: "/social-analyzer",
  photoEditor: "/photo-editor",
};

export const AI_MODELS = {
  cristina: {
    id: "jrogbaaa/cristina",
    // Updated version ID from the documentation
    version: "132c98d22d2171c64e55fe7eb539fbeef0085cb0bd5cac3e8d005234b53ef1cb",
    name: "Cristina Model",
    description: "Generate realistic images of Cristina",
    defaultParams: {
      prompt: "CRISTINA ",
      negative_prompt: "male, man, masculine, boy, male features, beard, mustache",
      model: "dev",
      go_fast: false,
      lora_scale: 1,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      guidance_scale: 3,
      output_quality: 80,
      prompt_strength: 0.8,
      extra_lora_scale: 1,
      num_inference_steps: 28
    }
  },
  jaime: {
    id: "jrogbaaa/jaimecreator",
    version: "25698e8acc5ade340967890a27752f4432f0baaf10c8d58ded9e21d77ec66a09",
    name: "Jaime Creator",
    description: "Jaime creator model for image generation",
    defaultParams: {
      prompt: "JAIME ",
      negative_prompt: "female, woman, feminine, girl, female features, breasts",
      model: "dev",
      go_fast: false,
      lora_scale: 1,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      guidance_scale: 3,
      output_quality: 80,
      prompt_strength: 0.8,
      extra_lora_scale: 1,
      num_inference_steps: 28
    }
  },
  bea: {
    id: "jrogbaaa/beagenerator",
    version: "16f9ef38ac2f6644b738abf98d13a2cef25gD40a6ae5b8d8e3e99a941e1a39bf",
    name: "Bea Generator",
    description: "Generate realistic images of Bea",
    defaultParams: {
      prompt: "BEA ",
      negative_prompt: "male, man, masculine, boy, male features, beard, mustache",
      model: "dev",
      go_fast: false,
      lora_scale: 1,
      megapixels: "1",
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_format: "webp",
      guidance_scale: 3,
      output_quality: 80,
      prompt_strength: 0.8,
      num_inference_steps: 28
    }
  },
  // Add a well-known public model for testing
  sdxl: {
    id: "stability-ai/sdxl",
    version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    name: "Standard Generations",
    description: "State-of-the-art image generation model",
    defaultParams: {
      prompt: "",
      negative_prompt: "",
      width: 1024,
      height: 1024,
      num_outputs: 1,
      num_inference_steps: 25,
      guidance_scale: 7.5,
    }
  },
  // Add the Wan 2.1 image-to-video model
  wan2_i2v: {
    id: "wavespeedai/wan-2.1-i2v-720p",
    version: "aa535ad6050bb18feee0e0ba99f345b0807b28baa81c95adfc4777f61f3ac41f",
    name: "Wan 2.1 Image-to-Video",
    description: "High-quality 720p image-to-video conversion",
    defaultParams: {
      image: "", // Base64 or URL of the input image
      prompt: "", // Optional text prompt to guide the video generation
      negative_prompt: "", // Optional negative prompt
      num_frames: 81, // Minimum required frames (model requirement)
      num_inference_steps: 25, // Default DDIM steps
      guidance_scale: 9.0, // Default CFG scale
      motion_bucket_id: 127, // Default motion strength
      fps: 8, // Default frames per second
      noise_aug_strength: 0.02, // Default noise augmentation strength
    }
  },
  gemini: {
    flash: "gemini-2.0-flash-001",
    pro: "gemini-2.0-pro-001",
    imagen: "imagegeneration@gemini-1.0-pro-001"
  }
}; 