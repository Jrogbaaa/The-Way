/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Add other domains here if needed in the future
    ],
  },
  // Enable source maps in development
  webpack: (config, { isServer, dev }) => {
    // Handle CSS imports better
    const oneOfRule = config.module.rules.find(
      (rule) => typeof rule.oneOf === 'object'
    );

    if (oneOfRule) {
      const cssRule = oneOfRule.oneOf.find(
        (rule) => rule.test && rule.test.toString().includes('css')
      );
      
      if (cssRule) {
        cssRule.issuer = undefined; // Allow CSS imports from anywhere
      }
    }

    return config;
  },
  // Ensure we have fallback environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig; 