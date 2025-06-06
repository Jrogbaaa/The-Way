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
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fuchqlpunfxtugvgxyfw.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tmpfiles.org',
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

    // Add file size limits for file uploads
    config.module.rules.push({
      test: /\.(zip|rar|7z)$/,
      use: {
        loader: 'file-loader',
        options: {
          limit: 100 * 1024 * 1024, // 100MB limit
        },
      },
    });

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
  // Fix for Vercel deployment with Next.js 15
  output: 'standalone',
  // Configure headers for file uploads
  async headers() {
    return [
      {
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 