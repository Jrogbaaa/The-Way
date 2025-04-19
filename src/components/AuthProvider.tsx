'use client';

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/lib/config';
import type { Session, User } from '@supabase/supabase-js';

// Define the shape of the context value
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Create the context with a default value (can be undefined or null, handled by consumer)
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// The AuthProvider component
const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Sign out function
  const handleSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        // Optionally handle error state
    } else {
        // Clear local state immediately for faster UI update
        setUser(null);
        setSession(null);
        // Redirect to home or login page after sign out
        router.push(ROUTES.home);
        router.refresh(); // Ensure layout reflects logged-out state
    }
  }, [router]);

  useEffect(() => {
    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error("Error getting initial session:", error);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Ensure loading is false after state change
      
      // If user signs out, redirect them from protected areas (example)
      if (_event === 'SIGNED_OUT' && pathname.startsWith(ROUTES.dashboard)) {
           router.push(ROUTES.login);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Router dependency removed based on common patterns, monitor if needed

  useEffect(() => {
    if (loading) return; // Don't redirect until session status is known

    const isAuthPage = pathname === ROUTES.login || pathname === ROUTES.signup;

    // Only redirect logged-in users if they are specifically on the login/signup pages
    if (session && isAuthPage) {
      console.log("User logged in, redirecting from auth page to dashboard...");
      router.push(ROUTES.dashboard);
    }
    
    // --- Removed Redirect Block ---
    // Protect dashboard route if user is logged out - Now handled at action level
    // if (!session && pathname.startsWith(ROUTES.dashboard)) {
    //    console.log("User logged out, redirecting from protected page to login...");
    //    router.push(ROUTES.login); 
    // }
    // --- End Removed Redirect Block ---

  }, [session, pathname, router, loading]); // Dependencies for the redirect logic

  // Context value
  const value: AuthContextProps = {
    user,
    session,
    loading,
    signOut: handleSignOut, // Provide the signOut function via context
  };

  // Don't render children until loading is complete to avoid flashes
  // or render a specific loading UI
  // if (loading) {
  //   return <div>Loading Application...</div>; // Or a proper spinner component
  // }

  return (
      <AuthContext.Provider value={value}>
          {children}
      </AuthContext.Provider>
  );
};

export default AuthProvider; 