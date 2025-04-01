/**
 * Environment Variables Check Script
 * 
 * This script checks if the required environment variables are properly set.
 * Run with: node -r dotenv/config scripts/check-env.js
 */

console.log('\n=== The Way - Environment Variables Check ===\n');

// Check if running with dotenv
try {
  require('dotenv');
  console.log('✅ dotenv loaded correctly');
} catch (error) {
  console.log('❌ dotenv not loaded. Run with: node -r dotenv/config scripts/check-env.js');
}

// Check Supabase variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔑 Supabase Configuration:');
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Not set'}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Not set'}`);

// Check Replicate variables
const replicateApiToken = process.env.REPLICATE_API_TOKEN;

console.log('\n🤖 Replicate Configuration:');
console.log(`REPLICATE_API_TOKEN: ${replicateApiToken ? '✅ Set' : '❌ Not set'}`);

// Check Google Cloud variables
const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const googleProjectId = process.env.GOOGLE_PROJECT_ID;

console.log('\n☁️ Google Cloud Configuration:');
console.log(`GOOGLE_APPLICATION_CREDENTIALS: ${googleAppCreds ? '✅ Set' : '❌ Not set'}`);
if (googleAppCreds) {
  const fs = require('fs');
  try {
    // Check if the credentials file exists
    if (fs.existsSync(googleAppCreds)) {
      console.log(`  - File exists: ✅ Yes`);
      
      // Try to parse the JSON to make sure it's valid
      try {
        const credContent = fs.readFileSync(googleAppCreds, 'utf8');
        const credJson = JSON.parse(credContent);
        console.log(`  - Valid JSON: ✅ Yes`);
        console.log(`  - Service account: ${credJson.client_email || 'Not found in JSON'}`);
        console.log(`  - Project ID (from file): ${credJson.project_id || 'Not found in JSON'}`);
      } catch (error) {
        console.log(`  - Valid JSON: ❌ No - ${error.message}`);
      }
    } else {
      console.log(`  - File exists: ❌ No - File not found at path`);
      console.log(`  - Absolute path attempted: ${require('path').resolve(googleAppCreds)}`);
    }
  } catch (error) {
    console.log(`  - Error checking file: ${error.message}`);
  }
}

console.log(`GOOGLE_PROJECT_ID: ${googleProjectId ? '✅ Set' : '❌ Not set'}`);
if (googleProjectId) {
  console.log(`  - Value: ${googleProjectId}`);
}

// Check App URL
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
console.log('\n🌐 App Configuration:');
console.log(`NEXT_PUBLIC_APP_URL: ${appUrl ? '✅ Set' : '❌ Not set'}`);
if (appUrl) {
  console.log(`  - Value: ${appUrl}`);
}

// Environment info
console.log('\n🖥️ Environment Information:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log(`Platform: ${process.platform}`);
console.log(`Node Version: ${process.version}`);

// Summary
console.log('\n🔍 Configuration Summary:');
const supabaseReady = supabaseUrl && supabaseAnonKey;
const replicateReady = !!replicateApiToken;
const googleReady = googleAppCreds && googleProjectId;

console.log(`Supabase: ${supabaseReady ? '✅ Configured' : '❌ Missing configuration'}`);
console.log(`Replicate: ${replicateReady ? '✅ Configured' : '❌ Missing configuration'}`);
console.log(`Google Cloud: ${googleReady ? '✅ Configured' : '⚠️ Optional - not fully configured'}`);

console.log('\n=== Check Complete ===\n'); 