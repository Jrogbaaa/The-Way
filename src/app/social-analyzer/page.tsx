'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';

export default function SocialAnalyzerRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the analyze post page
    router.replace(ROUTES.uploadPost);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-gray-600">Redirecting to Analyze Post...</p>
    </div>
  );
} 