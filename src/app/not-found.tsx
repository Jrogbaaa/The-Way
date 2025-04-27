'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/config';
import { isBrowser } from '@/lib/utils';

export default function NotFound() {
  const [isClient, setIsClient] = useState(false);
  
  // Only run client-side code after component has mounted
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Page not found
      </h2>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="mt-6">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
} 