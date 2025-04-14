'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import MainLayout from '@/components/layout/MainLayout';
import { ArrowLeft } from 'lucide-react';
import PhotoEditor from '../../components/PhotoEditor';

export const metadata = {
  title: 'Photo Editor - THE WAY',
  description: 'Edit your photos using AI and enhance them with just a few clicks',
};

export default function PhotoEditorPage() {
  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-12">
        <div className="mb-6">
          <Link href={ROUTES.dashboard} className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
          <PhotoEditor />
        </div>
      </div>
    </MainLayout>
  );
} 