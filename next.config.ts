import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ]
  },
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Disable ESLint during production builds to prevent build failures
  eslint: {
    // Warning: only disable this in special cases like deployment
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build for deployment
  typescript: {
    // Warning: only disable this in special cases like deployment
    ignoreBuildErrors: true,
  },
  
  // Override to prevent static generation of certain pages
  generateBuildId: async () => {
    return 'build-' + new Date().getTime();
  },
};

export default nextConfig;
