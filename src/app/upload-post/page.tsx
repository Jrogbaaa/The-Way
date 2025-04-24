'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowLeft } from 'lucide-react';
import SocialMediaAnalyzer from '@/components/SocialMediaAnalyzer';

export default function UploadPostPage() {
  return (
    <MainLayout>
      <div className="container max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={ROUTES.dashboard} className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to dashboard
          </Link>
        </div>
        
        <SocialMediaAnalyzer />
        
      </div>
    </MainLayout>
  );
} 