'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import ErrorBoundary with no SSR
const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), { 
  ssr: false 
});

export default function ClientErrorBoundary({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 