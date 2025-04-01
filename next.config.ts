import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'replicate.delivery', // Allow images from Replicate API
      'pbxt.replicate.delivery',
      'images.unsplash.com', // Allow images from Unsplash
      'i.pravatar.cc', // Allow images from Pravatar
      'placehold.co' // Allow images from Placehold.co
    ],
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
  
  // Output as a standalone build for better Netlify compatibility
  output: "standalone",
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;
