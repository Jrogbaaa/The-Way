#!/usr/bin/env node
/**
 * Pre-push validation script
 * 
 * This script performs basic validation checks before code is pushed to GitHub
 * Run with: node scripts/pre-push-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { red: t => t, green: t => t, yellow: t => t, blue: t => t };

// Configuration
const ROUTES_CONFIG_PATH = path.join(__dirname, '../src/lib/config.ts');
const APP_DIR = path.join(__dirname, '../src/app');
const API_DIR = path.join(__dirname, '../src/app/api');

console.log(chalk.blue('📋 Starting pre-push validation checks...'));

let errors = 0;
let warnings = 0;

// Check if routes defined in ROUTES exist as directories/files
function checkRoutes() {
  console.log(chalk.blue('\n🔍 Checking route definitions...'));
  
  try {
    const configFile = fs.readFileSync(ROUTES_CONFIG_PATH, 'utf8');
    const routesMatch = configFile.match(/export\s+const\s+ROUTES\s*=\s*{([^}]*)}/s);
    
    if (!routesMatch) {
      console.log(chalk.red('❌ Could not find ROUTES object in config.ts'));
      errors++;
      return;
    }
    
    const routesContent = routesMatch[1];
    const routeLines = routesContent.split('\n').filter(line => line.includes(':'));
    
    routeLines.forEach(line => {
      // Extract route path from the line
      const match = line.match(/['"](\/[^'"]*)['"]/);
      if (!match) return;
      
      const routePath = match[1];
      if (routePath === '/') return; // Skip root path
      
      // Check if route exists as a directory or page file
      const routeDir = path.join(APP_DIR, routePath.slice(1));
      const routePage = `${routeDir}.tsx`;
      const routeDirExists = fs.existsSync(routeDir);
      const routePageExists = fs.existsSync(routePage);
      
      if (!routeDirExists && !routePageExists) {
        console.log(chalk.yellow(`⚠️ Route '${routePath}' is defined but no directory or page file exists`));
        warnings++;
        
        // Check if it's in /models/
        const modelsRoute = path.join(APP_DIR, 'models', routePath.slice(1));
        if (fs.existsSync(modelsRoute)) {
          console.log(chalk.green(`   Found at: /models${routePath}`));
        } else {
          // Suggest adding redirect
          console.log(chalk.blue(`   💡 Consider adding a redirect page at: src/app${routePath}/page.tsx`));
        }
      } else {
        console.log(chalk.green(`✅ Route '${routePath}' exists`));
      }
    });
  } catch (error) {
    console.log(chalk.red(`❌ Error checking routes: ${error.message}`));
    errors++;
  }
}

// Check for missing environment variables
function checkEnvVariables() {
  console.log(chalk.blue('\n🔍 Checking environment variables...'));
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
    'REPLICATE_API_TOKEN',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.log(chalk.yellow(`⚠️ Environment variable ${varName} is not set`));
      warnings++;
    } else {
      console.log(chalk.green(`✅ Environment variable ${varName} is set`));
    }
  });
}

// Detect API endpoints that might not be in use
function checkUnusedApiEndpoints() {
  console.log(chalk.blue('\n🔍 Checking for potentially unused API endpoints...'));
  
  // Get all API routes
  const apiRoutes = [];
  function scanDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.name === 'route.ts' || item.name === 'route.js') {
        const relativePath = fullPath.replace(API_DIR, '').replace(/\\/g, '/').replace('/route.ts', '').replace('/route.js', '');
        apiRoutes.push(`/api${relativePath}`);
      }
    }
  }
  
  try {
    scanDir(API_DIR);
    
    // Now grep the codebase for these routes
    for (const route of apiRoutes) {
      try {
        // The grep command to search for this route in the project (excluding node_modules)
        const grepCmd = `grep -r "${route}" --include="*.{ts,tsx,js,jsx}" --exclude-dir=node_modules .`;
        const result = execSync(grepCmd, { cwd: path.join(__dirname, '..'), stdio: 'pipe' }).toString();
        
        // Count occurrences by counting lines
        const occurrences = result.split('\n').filter(Boolean).length;
        
        if (occurrences <= 1) { // Only found in the definition file
          console.log(chalk.yellow(`⚠️ API route ${route} might be unused (found in ${occurrences} file)`));
          warnings++;
        } else {
          console.log(chalk.green(`✅ API route ${route} is used in ${occurrences} files`));
        }
      } catch (error) {
        // grep returns non-zero exit code when no matches are found
        console.log(chalk.yellow(`⚠️ API route ${route} might be unused (no references found)`));
        warnings++;
      }
    }
  } catch (error) {
    console.log(chalk.red(`❌ Error checking API endpoints: ${error.message}`));
    errors++;
  }
}

// Run TypeScript type checking
function runTypeCheck() {
  console.log(chalk.blue('\n🔍 Running TypeScript type check...'));
  
  try {
    execSync('npx tsc --noEmit', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    console.log(chalk.green('✅ TypeScript check passed'));
  } catch (error) {
    console.log(chalk.red('❌ TypeScript check failed'));
    console.log(error.stdout.toString());
    errors++;
  }
}

// Check for Git conflicts
function checkGitConflicts() {
  console.log(chalk.blue('\n🔍 Checking for Git conflicts...'));
  
  try {
    const grepCmd = `grep -r "^<<<<<<< HEAD" --include="*.{ts,tsx,js,jsx,css,json,md}" .`;
    const result = execSync(grepCmd, { cwd: path.join(__dirname, '..'), stdio: 'pipe' }).toString();
    
    if (result.trim()) {
      console.log(chalk.red('❌ Git conflicts found:'));
      console.log(result);
      errors++;
    } else {
      console.log(chalk.green('✅ No Git conflicts found'));
    }
  } catch (error) {
    // grep returns non-zero exit code when no matches are found, which is good
    console.log(chalk.green('✅ No Git conflicts found'));
  }
}

// Run checks
checkRoutes();
checkGitConflicts();
runTypeCheck();

// Summary
console.log(chalk.blue('\n🔍 Validation Summary:'));
if (errors > 0) {
  console.log(chalk.red(`❌ ${errors} errors found`));
}
if (warnings > 0) {
  console.log(chalk.yellow(`⚠️ ${warnings} warnings found`));
}
if (errors === 0 && warnings === 0) {
  console.log(chalk.green('✅ All checks passed!'));
}

// Exit with appropriate code
process.exit(errors > 0 ? 1 : 0); 