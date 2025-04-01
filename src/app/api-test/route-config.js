// Server-side route configuration for the API test page
// This will be recognized by Next.js routing system
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = false;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Exclude from builds
export const config = {
  unstable_excludePage: true
}; 