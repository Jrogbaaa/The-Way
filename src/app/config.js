// Global dynamic settings for Next.js
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Disable static optimization and pre-rendering
export const config = {
  unstable_runtimeJS: true,
  unstable_JsPreload: false
}; 