'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

export default function ImageToVideoRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct path
    router.replace('/models/image-to-video');
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600 mb-6">
          The Image to Video page has moved. You'll be redirected automatically.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-indigo-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
} 