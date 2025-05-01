'use client';

import { useSession } from 'next-auth/react';

export function useAuthUser() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  return {
    user: session?.user ?? null,
    isLoading,
    isAuthenticated
  };
} 