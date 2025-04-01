// prebuild.js - Run this before Next.js build
const fs = require('fs');
const path = require('path');

console.log('Running prebuild script...');

// Create a dummy env file if it doesn't exist to prevent build errors
const createDummyEnvFile = () => {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('Creating dummy .env.local for build...');
    const dummyEnvContent = `
# Dummy environment variables for build process
# These will be overridden by actual Netlify environment variables
NEXT_PUBLIC_SUPABASE_URL=https://dummy-value-for-build.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-value-for-build
SUPABASE_SERVICE_ROLE_KEY=dummy-value-for-build
REPLICATE_API_TOKEN=dummy-value-for-build
GOOGLE_API_KEY=dummy-value-for-build
GEMINI_API_KEY=dummy-value-for-build
GOOGLE_CLOUD_VISION_CREDENTIALS=dummy-value-for-build
GOOGLE_CLOUD_PROJECT_ID=dummy-value-for-build
NEXT_PUBLIC_APP_URL=https://dummy-value-for-build
NEXTAUTH_SECRET=dummy-value-for-build
NEXTAUTH_URL=https://dummy-value-for-build
VERTEX_AI_LOCATION=us-central1
    `;
    
    fs.writeFileSync(envPath, dummyEnvContent.trim());
    console.log('Dummy .env.local file created successfully.');
  }
};

// Create next.config.override.js to enforce dynamic rendering
const createNextConfigOverride = () => {
  const overridePath = path.join(process.cwd(), 'next.config.override.js');
  
  console.log('Creating Next.js config override...');
  const overrideContent = `
// This file is auto-generated and used to override Next.js config during build
module.exports = {
  ...require('./next.config.ts'),
  // Force dynamic rendering for all pages
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  staticPageGenerationTimeout: 1,
  // Generate a unique build ID to prevent caching issues
  generateBuildId: () => 'build-' + Date.now()
};
  `;
  
  fs.writeFileSync(overridePath, overrideContent.trim());
  console.log('Next.js config override created successfully.');
};

// Run the prebuild tasks
createDummyEnvFile();
createNextConfigOverride();

console.log('Prebuild complete!'); 