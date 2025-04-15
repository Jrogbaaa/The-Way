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
# These will be overridden by actual Vercel environment variables
NEXT_PUBLIC_SUPABASE_URL=https://dummy-value-for-build.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-value-for-build
SUPABASE_SERVICE_ROLE_KEY=dummy-value-for-build
REPLICATE_API_TOKEN=r8_W6YHRCBleZjPLLmfyrQiWseStHtumUo4TBMzb
GOOGLE_API_KEY=dummy-value-for-build
GEMINI_API_KEY=dummy-value-for-build
GOOGLE_CLOUD_VISION_CREDENTIALS=dummy-value-for-build
GOOGLE_CLOUD_PROJECT_ID=dummy-value-for-build
NEXT_PUBLIC_APP_URL=https://dummy-value-for-build
NEXTAUTH_SECRET=dummy-value-for-build
NEXTAUTH_URL=https://dummy-value-for-build
BRIA_AI_API_KEY=dummy-value-for-build
VERTEX_AI_LOCATION=us-central1
    `;
    
    fs.writeFileSync(envPath, dummyEnvContent.trim());
    console.log('Dummy .env.local file created successfully.');
  }
};

// Create Vercel config file if it doesn't exist
const createVercelConfigFile = () => {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  
  if (!fs.existsSync(vercelConfigPath)) {
    console.log('Creating vercel.json file...');
    const vercelConfigContent = `{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}`;
    
    fs.writeFileSync(vercelConfigPath, vercelConfigContent);
    console.log('vercel.json file created successfully.');
  }
};

// Run the prebuild tasks
createDummyEnvFile();
createVercelConfigFile();

console.log('Prebuild complete!'); 