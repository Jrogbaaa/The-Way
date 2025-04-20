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
  showWelcomeModal: boolean;
  signOut: () => Promise<void>;
  markUserOnboarded: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthProvider component
const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
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
        setShowWelcomeModal(false);
        // Redirect to home or login page after sign out
        router.push(ROUTES.landing);
        router.refresh(); // Ensure layout reflects logged-out state
    }
  }, [router]);

  // Mark User Onboarded function
  const markUserOnboarded = useCallback(async () => {
    console.log('AuthProvider: markUserOnboarded called'); // Log start
    if (!user) { 
      console.log('AuthProvider: No user found, exiting markUserOnboarded');
      return; 
    }
    
    // Immediately hide modal for better UX
    setShowWelcomeModal(false); 
    console.log('AuthProvider: Hiding welcome modal');
    
    try {
      console.log('AuthProvider: Attempting fetch to /api/user/mark-onboarded'); // Log before fetch
      // Add credentials: 'include' to this fetch call
      const response = await fetch('/api/user/mark-onboarded', {
         method: 'POST',
         credentials: 'include' // Explicitly include cookies
      });
      
      console.log('AuthProvider: Fetch response status:', response.status); // Log fetch status
      if (!response.ok) {
        // Use response.json() cautiously, might not be JSON on failure
        let errorData = { error: `Request failed with status ${response.status}` };
        try {
           errorData = await response.json(); 
        } catch (jsonError) {
           console.error('AuthProvider: Could not parse error response as JSON:', jsonError);
        }
        console.error('AuthProvider: Failed to mark user as onboarded:', errorData.error);
      } else {
        console.log('AuthProvider: Successfully marked user as onboarded on server.'); // Log success
      }
      // Successfully marked on server or handled error
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('AuthProvider: Error calling mark-onboarded API:', errorMessage);
    }
  }, [user]);

  useEffect(() => {
    // Initial Session Check (No profile API call here)
    const getSession = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting initial session:', sessionError);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    };

    getSession();

    // Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider Event:', event, '- Path:', pathname, '- Has Session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      let shouldSetLoadingFalse = true; 
      const isAuthPage = pathname === ROUTES.login || pathname === ROUTES.signup;

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('AuthProvider: SIGNED_IN handling');
        shouldSetLoadingFalse = false; 
        setLoading(true); 
        try {
          // Ensure session and access token are available
          if (!session?.access_token) {
             console.error('No access token found in session after SIGNED_IN event.');
             throw new Error("No access token available after sign in.");
          }

          // --- Call Edge Function instead of API Route ---
          const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ensure-profile`;
          console.log(`Calling Edge Function: ${edgeFunctionUrl}`); // Log the URL

          const profileResponse = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json' // Good practice to set Content-Type
            },
            // No 'credentials: include' needed now
            // body: JSON.stringify({}) // Can send empty body if function doesn't expect one
          });
          // --- End Edge Function Call ---

          console.log('Edge Function response status:', profileResponse.status); // Log status

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile check response (from Edge Function):', profileData); // Updated log message
            if (profileData.success && profileData.onboarded === false) {
              console.log('Setting showWelcomeModal to true');
              setShowWelcomeModal(true);
            } else {
              console.log('Setting showWelcomeModal to false (already onboarded or error)');
              setShowWelcomeModal(false);
            }
          } else {
             const errorBody = await profileResponse.text(); // Get error body for more info
             console.error('Failed Edge Function call to ensure/check profile, status:', profileResponse.status, 'Body:', errorBody);
             setShowWelcomeModal(false);
          }
        } catch (error) {
           // Add type check for error
           const errorMessage = error instanceof Error ? error.message : String(error);
           console.error('Error calling ensure-profile Edge Function after SIGNED_IN:', errorMessage);
           setShowWelcomeModal(false);
        }
        
        // Redirect to dashboard (existing logic)
        if (pathname !== ROUTES.dashboard) { 
            console.log(`AuthProvider: SIGNED_IN - Redirecting to dashboard from ${pathname}`);
            router.push(ROUTES.dashboard);
        }
        setLoading(false); // Set loading false after async check

      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider: SIGNED_OUT handling');
        setShowWelcomeModal(false); 
        console.log(`AuthProvider: SIGNED_OUT - Redirecting to landing from ${pathname}`);
        router.push(ROUTES.landing);
        // setLoading(false); // Set below

      } else if (event === 'INITIAL_SESSION' && session) {
         console.log('AuthProvider: INITIAL_SESSION (with session) handling');
         if (isAuthPage) {
             console.log(`AuthProvider: INITIAL_SESSION - Redirecting logged-in user from auth page (${pathname}) to dashboard`);
             router.push(ROUTES.dashboard); 
         }
         // setLoading(false); // Set below
      } else if (event === 'INITIAL_SESSION' && !session) {
          console.log('AuthProvider: INITIAL_SESSION (no session) handling');
          // Allow access to public pages and specific dashboard-related pages when logged out
          const isPubliclyAccessible = 
            pathname === ROUTES.landing || 
            pathname === ROUTES.dashboard ||
            pathname === ROUTES.models ||
            pathname === ROUTES.chat ||
            pathname === ROUTES.gallery ||
            pathname === ROUTES.profile ||
            pathname === ROUTES.uploadPost; // Add other public routes if needed
            
          if (!isAuthPage && !isPubliclyAccessible) {
              console.log(`AuthProvider: INITIAL_SESSION - Redirecting logged-out user to login from protected page (${pathname})`);
              router.push(ROUTES.login);
          }
          // setLoading(false); // Set below
      } else if (session && isAuthPage) {
          console.log('AuthProvider: Session exists, on auth page - Redirecting to dashboard');
          router.push(ROUTES.dashboard);
          // setLoading(false); // Set below
      } else if (!session && !isAuthPage) {
         // Allow access to public pages and specific dashboard-related pages when logged out
         const isPubliclyAccessible = 
            pathname === ROUTES.landing || 
            pathname === ROUTES.dashboard ||
            pathname === ROUTES.models ||
            pathname === ROUTES.chat ||
            pathname === ROUTES.gallery ||
            pathname === ROUTES.profile ||
            pathname === ROUTES.uploadPost; // Add other public routes if needed
            
         if (!isPubliclyAccessible) {
             console.log('AuthProvider: No session, not on public/dashboard page - Redirecting to login');
             router.push(ROUTES.login);
         }
         // setLoading(false); // Set below
      } else {
         console.log('AuthProvider: No redirect condition met.');
      }

      // Set loading false if not handled by async SIGNED_IN logic
      if (shouldSetLoadingFalse) {
          console.log('AuthProvider: Setting loading to false (end of sync handling)');
          setLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Context value
  const value: AuthContextProps = {
    user,
    session,
    loading,
    showWelcomeModal,
    signOut: handleSignOut,
    markUserOnboarded,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 