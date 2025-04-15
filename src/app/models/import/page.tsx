'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';

export default function ImportModelPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Feature Removed</h2>
          
          <p className="text-gray-700 mb-6">
            The custom model import feature has been removed due to persistent technical issues.
            We apologize for any inconvenience this may cause.
          </p>
          
          <p className="text-gray-700 mb-6">
            You can still use our pre-trained models for image generation.
          </p>
          
          <Button asChild className="mt-4">
            <Link href="/models">Return to Models Gallery</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
} 