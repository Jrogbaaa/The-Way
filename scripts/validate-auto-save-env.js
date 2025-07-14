#!/usr/bin/env node

/**
 * Environment Validation Script for Auto-Save Functionality
 * This script checks if all required environment variables are properly set
 * for the auto-save feature to work in production (especially Vercel)
 */

const chalk = require('chalk');

console.log(chalk.blue('\n🔍 Validating Environment Configuration for Auto-Save Functionality\n'));
console.log(chalk.yellow('ℹ️  This application uses NextAuth.js for authentication and Supabase for storage only.\n'));

// Required environment variables for auto-save
const requiredVars = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    critical: true,
    example: 'https://your-project.supabase.co'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    description: 'Supabase anonymous key',
    critical: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (server-side operations)',
    critical: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth secret key',
    critical: true,
    example: 'your-secure-secret-key-here'
  },
  {
    name: 'NEXTAUTH_URL',
    description: 'NextAuth base URL (production)',
    critical: true,
    example: 'https://your-app.vercel.app'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    description: 'Public app URL for session detection',
    critical: true,
    example: 'https://your-app.vercel.app'
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    description: 'Google OAuth client ID',
    critical: true,
    example: '1234567890-abcdef.apps.googleusercontent.com'
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    description: 'Google OAuth client secret',
    critical: true,
    example: 'GOCSPX-your-client-secret'
  }
];

// Optional but recommended environment variables
const optionalVars = [
  {
    name: 'AUTH_SECRET',
    description: 'Alternative auth secret (fallback)',
    example: 'your-auth-secret'
  },
  {
    name: 'REPLICATE_API_TOKEN',
    description: 'Replicate API token for image generation',
    example: 'r8_your-token-here'
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API key',
    example: 'AIzaSyYour-API-Key'
  }
];

let hasErrors = false;
let hasWarnings = false;

console.log(chalk.yellow('📋 CRITICAL ENVIRONMENT VARIABLES\n'));

// Check required variables
requiredVars.forEach(varConfig => {
  const value = process.env[varConfig.name];
  
  if (!value) {
    console.log(chalk.red(`❌ ${varConfig.name}`));
    console.log(chalk.red(`   Missing: ${varConfig.description}`));
    console.log(chalk.gray(`   Example: ${varConfig.example}\n`));
    hasErrors = true;
  } else {
    // Validate some specific formats
    let validationError = null;
    
    if (varConfig.name.includes('SUPABASE_URL') && !value.startsWith('https://')) {
      validationError = 'Should start with https://';
    } else if (varConfig.name.includes('SUPABASE') && varConfig.name.includes('KEY') && !value.startsWith('eyJ')) {
      validationError = 'Should be a valid JWT token starting with eyJ';
    } else if (varConfig.name.includes('URL') && !value.startsWith('http')) {
      validationError = 'Should be a valid URL starting with http:// or https://';
    } else if (varConfig.name === 'GOOGLE_CLIENT_ID' && !value.includes('.apps.googleusercontent.com')) {
      validationError = 'Should end with .apps.googleusercontent.com';
    } else if (varConfig.name === 'GOOGLE_CLIENT_SECRET' && !value.startsWith('GOCSPX-')) {
      validationError = 'Should start with GOCSPX-';
    }
    
    if (validationError) {
      console.log(chalk.yellow(`⚠️  ${varConfig.name}`));
      console.log(chalk.yellow(`   Warning: ${validationError}`));
      console.log(chalk.gray(`   Current: ${value.substring(0, 20)}...`));
      console.log(chalk.gray(`   Expected: ${varConfig.example}\n`));
      hasWarnings = true;
    } else {
      console.log(chalk.green(`✅ ${varConfig.name}`));
      console.log(chalk.gray(`   ${varConfig.description}\n`));
    }
  }
});

console.log(chalk.yellow('📋 OPTIONAL ENVIRONMENT VARIABLES\n'));

// Check optional variables
optionalVars.forEach(varConfig => {
  const value = process.env[varConfig.name];
  
  if (!value) {
    console.log(chalk.gray(`⚪ ${varConfig.name}`));
    console.log(chalk.gray(`   Optional: ${varConfig.description}\n`));
  } else {
    console.log(chalk.green(`✅ ${varConfig.name}`));
    console.log(chalk.gray(`   ${varConfig.description}\n`));
  }
});

// URL consistency check
console.log(chalk.yellow('🔗 URL CONSISTENCY CHECK\n'));

const nextAuthUrl = process.env.NEXTAUTH_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (nextAuthUrl && appUrl) {
  if (nextAuthUrl === appUrl) {
    console.log(chalk.green('✅ NEXTAUTH_URL and NEXT_PUBLIC_APP_URL match'));
  } else {
    console.log(chalk.yellow('⚠️  NEXTAUTH_URL and NEXT_PUBLIC_APP_URL do not match'));
    console.log(chalk.gray(`   NEXTAUTH_URL: ${nextAuthUrl}`));
    console.log(chalk.gray(`   NEXT_PUBLIC_APP_URL: ${appUrl}`));
    console.log(chalk.gray('   These should typically be the same for production\n'));
    hasWarnings = true;
  }
} else {
  console.log(chalk.red('❌ Cannot check URL consistency - missing environment variables\n'));
}

// Supabase configuration check
console.log(chalk.yellow('🗄️  SUPABASE CONFIGURATION CHECK\n'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseAnonKey && supabaseServiceKey) {
  // Extract project ID from URL
  const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;
  
  if (projectId) {
    console.log(chalk.green(`✅ Supabase project detected: ${projectId}`));
    
    // Check if keys are for the same project (they should contain the project ID)
    if (supabaseAnonKey.includes(projectId) || supabaseServiceKey.includes(projectId)) {
      console.log(chalk.green('✅ Supabase keys appear to match the project'));
    } else {
      console.log(chalk.yellow('⚠️  Supabase keys might not match the project ID'));
      hasWarnings = true;
    }
  } else {
    console.log(chalk.yellow('⚠️  Could not extract project ID from Supabase URL'));
    hasWarnings = true;
  }
} else {
  console.log(chalk.red('❌ Incomplete Supabase configuration'));
  hasErrors = true;
}

// Auto-save specific checks
console.log(chalk.yellow('\n💾 AUTO-SAVE FUNCTIONALITY CHECK\n'));

const hasAllAuthVars = process.env.NEXTAUTH_SECRET && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasAllSupabaseVars = supabaseUrl && supabaseAnonKey && supabaseServiceKey;
const hasAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

if (hasAllAuthVars && hasAllSupabaseVars && hasAppUrl) {
  console.log(chalk.green('✅ All variables required for auto-save functionality are present'));
} else {
  console.log(chalk.red('❌ Auto-save functionality may not work properly'));
  if (!hasAllAuthVars) {
    console.log(chalk.red('   - Missing authentication configuration'));
  }
  if (!hasAllSupabaseVars) {
    console.log(chalk.red('   - Missing Supabase configuration'));
  }
  if (!hasAppUrl) {
    console.log(chalk.red('   - Missing app URL configuration'));
  }
  hasErrors = true;
}

// Final summary
console.log(chalk.blue('\n📊 VALIDATION SUMMARY\n'));

if (hasErrors) {
  console.log(chalk.red('❌ VALIDATION FAILED'));
  console.log(chalk.red('Critical environment variables are missing or invalid.'));
  console.log(chalk.red('Auto-save functionality will NOT work in production.\n'));
  
  console.log(chalk.yellow('🛠️  TO FIX IN VERCEL:'));
  console.log(chalk.gray('1. Go to your Vercel project dashboard'));
  console.log(chalk.gray('2. Navigate to Settings > Environment Variables'));
  console.log(chalk.gray('3. Add the missing critical variables listed above'));
  console.log(chalk.gray('4. Redeploy your application\n'));
  
  process.exit(1);
} else if (hasWarnings) {
  console.log(chalk.yellow('⚠️  VALIDATION PASSED WITH WARNINGS'));
  console.log(chalk.yellow('Auto-save functionality should work, but there may be configuration issues.\n'));
  process.exit(0);
} else {
  console.log(chalk.green('✅ VALIDATION PASSED'));
  console.log(chalk.green('All environment variables are properly configured.'));
  console.log(chalk.green('Auto-save functionality should work correctly in production.\n'));
  process.exit(0);
} 