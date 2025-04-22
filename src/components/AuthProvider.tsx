'use client';

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback, useRef } from 'react';
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
  validateSession: () => Promise<boolean>;
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
  
  // Add session refresh throttling
  const lastRefreshAttempt = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  const refreshCooldownMs = 5000; // 5 seconds between refresh attempts
  const sessionValidUntil = useRef<number | null>(null);

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
        sessionValidUntil.current = null;
        // Redirect to home or login page after sign out
        router.push(ROUTES.landing);
        router.refresh(); // Ensure layout reflects logged-out state
    }
  }, [router]);

  // Add a session validation function with throttling
  const validateSession = useCallback(async (): Promise<boolean> => {
    // If we have a valid session time and it's in the future, return true without validation
    if (sessionValidUntil.current && sessionValidUntil.current > Date.now()) {
      console.log('AuthProvider: Using cached session validation');
      return true;
    }
    
    // Check if we're already refreshing to avoid multiple concurrent refreshes
    if (isRefreshing.current) {
      console.log('AuthProvider: Session refresh already in progress, waiting...');
      // Wait for the existing refresh to complete
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!isRefreshing.current) {
          return sessionValidUntil.current !== null && sessionValidUntil.current > Date.now();
        }
      }
      console.warn('AuthProvider: Timed out waiting for session refresh');
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshAttempt.current;
    
    // If we recently attempted a refresh and failed, don't try again too soon
    if (timeSinceLastRefresh < refreshCooldownMs) {
      console.log(`AuthProvider: Refresh cooldown active. Wait ${(refreshCooldownMs - timeSinceLastRefresh)/1000}s`);
      return false;
    }
    
    console.log('AuthProvider: Validating session with server');
    lastRefreshAttempt.current = now;
    isRefreshing.current = true;
    
    try {
      // First try the server endpoint which is more reliable
      try {
        const response = await fetch('/api/auth/validate-session', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('AuthProvider: Session successfully validated with server');
          if (data.session?.expires_at) {
            // Set session valid until 5 minutes before actual expiry as a safety margin
            const expiresAt = data.session.expires_at * 1000; // Convert to milliseconds
            sessionValidUntil.current = expiresAt - (5 * 60 * 1000); // 5 minutes before expiry
            isRefreshing.current = false;
            return true;
          }
        }
      } catch (serverError) {
        console.warn('AuthProvider: Server validation failed, falling back to client:', 
          serverError instanceof Error ? serverError.message : String(serverError));
      }
      
      // Fall back to client-side refresh if server validation fails
      console.log('AuthProvider: Attempting client-side session refresh');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthProvider: Failed to refresh session client-side:', error.message);
        if (error.message.includes('rate limit')) {
          console.warn('AuthProvider: Hit rate limit, backing off');
          // Extend cooldown if rate limited
          lastRefreshAttempt.current = now + 10000; // Add 10 more seconds to cooldown
        }
        isRefreshing.current = false;
        return false;
      }
      
      if (data.session) {
        console.log('AuthProvider: Successfully refreshed session client-side');
        setSession(data.session);
        setUser(data.session.user);
        // Add null check for session before accessing expires_at
        const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : null;
        if (expiresAt) {
          sessionValidUntil.current = expiresAt - (5 * 60 * 1000); // 5 minutes before expiry
        } else {
          sessionValidUntil.current = null; // Set to null if expires_at is missing
          console.warn('AuthProvider: Session refreshed but expires_at is missing.');
        }
        isRefreshing.current = false;
        return true;
      }
      
      isRefreshing.current = false;
      return false;

    } catch (error) {
      console.error('AuthProvider: Error during session validation:', 
        error instanceof Error ? error.message : String(error));
      isRefreshing.current = false;
      return false;
    }
  }, []);

  // Modify markUserOnboarded to validate session first
  const markUserOnboarded = useCallback(async () => {
    console.log('AuthProvider: markUserOnboarded called'); 
    if (!user) { 
      console.log('AuthProvider: No user found, exiting markUserOnboarded');
      return; 
    }
    
    // Immediately hide modal for better UX
    setShowWelcomeModal(false); 
    console.log('AuthProvider: Hiding welcome modal');
    
    // Validate session first
    const isSessionValid = await validateSession();
    if (!isSessionValid) {
      console.error('AuthProvider: Session validation failed before marking user onboarded');
      return;
    }
    
    try {
      console.log('AuthProvider: Attempting fetch to /api/user/mark-onboarded');
      const response = await fetch('/api/user/mark-onboarded', {
         method: 'POST',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      console.log('AuthProvider: Fetch response status:', response.status);
      if (!response.ok) {
        let errorData = { error: `Request failed with status ${response.status}` };
        try {
           errorData = await response.json(); 
        } catch (jsonError) {
           console.error('AuthProvider: Could not parse error response as JSON:', jsonError);
        }
        console.error('AuthProvider: Failed to mark user as onboarded:', errorData.error);
      } else {
        console.log('AuthProvider: Successfully marked user as onboarded on server.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('AuthProvider: Error calling mark-onboarded API:', errorMessage);
    }
  }, [user, validateSession]);

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
        if (session?.expires_at) {
          const expiresAt = session.expires_at * 1000; // Convert to milliseconds
          sessionValidUntil.current = expiresAt - (5 * 60 * 1000); // 5 minutes before expiry
        }
      }
      setLoading(false);
    };

    getSession();

    // Auth State Change Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthProvider Event:', event, '- Path:', pathname, '- Has Session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update session expiry cache when session changes
      if (session?.expires_at) {
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        sessionValidUntil.current = expiresAt - (5 * 60 * 1000); // 5 minutes before expiry
      } else {
        sessionValidUntil.current = null;
      }
      
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
        sessionValidUntil.current = null;
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
    validateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 