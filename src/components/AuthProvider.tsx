'use client';

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
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
  // Initialize Supabase client using ssr helper
  const [supabase] = useState(() => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Sign out function
  const handleSignOut = useCallback(async () => {
    console.log('AuthProvider: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        setUser(null);
        setSession(null);
        setShowWelcomeModal(false);
        router.push(ROUTES.landing);
        router.refresh(); // Ensure layout reflects logged-out state
    }
  }, [supabase, router]);

  // Modify markUserOnboarded to remove validateSession call
  const markUserOnboarded = useCallback(async () => {
    console.log('AuthProvider: markUserOnboarded called'); 
    
    // Get current session for access token (still potentially useful, but middleware should handle refresh)
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!user || !currentSession?.access_token) { 
      console.error('AuthProvider: No user or access token for markUserOnboarded');
      return; 
    }
    
    const accessToken = currentSession.access_token;
    
    setShowWelcomeModal(false); 
    console.log('AuthProvider: Hiding welcome modal');
    
    try {
      console.log('AuthProvider: Attempting fetch to /api/user/mark-onboarded with token');
      // Use standard fetch - the middleware and ssr client handle cookies
      const response = await fetch('/api/user/mark-onboarded', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           // Include Bearer token for API routes that might expect it explicitly
           // (Though cookie-based auth via createServerClient in the API route is preferred)
           'Authorization': `Bearer ${accessToken}` 
         }
       });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to mark user onboarded: ${response.status}`);
      }
      console.log('AuthProvider: Successfully marked user onboarded via API');
    } catch (error) {
      console.error('AuthProvider: Error marking user onboarded:', 
        error instanceof Error ? error.message : String(error));
    }
  }, [user, supabase]);

  // Fetch initial session and profile, set up listener
  useEffect(() => {
    setLoading(true);
    console.log('AuthProvider: Initializing... Path:', pathname);

    // Immediately try to get the session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      console.log('AuthProvider: Initial getSession result:', initialSession ? `Session for ${initialSession.user.id}` : 'No initial session');
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      // Fetch profile if user exists
      if (initialSession?.user) {
        await fetchProfile(initialSession.user);
      } else {
        setLoading(false); // No user, stop loading
      }
    });

    // Set up the onAuthStateChange listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthProvider Event: ${event} - Path: ${pathname} - Has Session: ${!!session}`);
      
      // Update session and user state
      setSession(session);
      setUser(session?.user ?? null);
      
      switch (event) {
        case 'INITIAL_SESSION':
          break;
        case 'SIGNED_IN':
          if (session?.user) {
            await fetchProfile(session.user);
          } else {
            setLoading(false);
          }
          break;
        
        case 'SIGNED_OUT':
          setUser(null);
          setSession(null);
          setShowWelcomeModal(false);
          setLoading(false);
          break;
        
        case 'PASSWORD_RECOVERY':
          // Handle password recovery event
          setLoading(false);
          break;
        
        case 'TOKEN_REFRESHED':
          console.log('AuthProvider: Token refreshed by listener');
          // Session state already updated
          setLoading(false); // Ensure loading is false after refresh
          break;
        
        case 'USER_UPDATED':
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user); // Re-fetch profile if user data might have changed
          } else {
            setLoading(false);
          }
          break;
        
        default:
          setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, pathname, router]);

  // Fetch user profile and check onboarding status
  const fetchProfile = async (currentUser: User) => {
    console.log(`AuthProvider: Fetching profile for user ${currentUser.id}`);
    try {
      // Use the ssr client instance for the query
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching profile:', error.message);
        if (error.code === 'PGRST116') { // PGRST116: Row not found
          console.warn(`AuthProvider: Profile not found for user ${currentUser.id}. Possibly waiting for trigger.`);
          // Keep loading for a short period to allow trigger to run?
          // Or assume not onboarded for now?
          setShowWelcomeModal(true); // Assume not onboarded if profile doesn't exist yet
        } else {
          // Handle other errors (e.g., network, RLS)
        }
      } else if (profile) {
        console.log(`AuthProvider: Profile fetched - onboarded: ${profile.onboarded}`);
        if (!profile.onboarded) {
          setShowWelcomeModal(true);
        } else {
          setShowWelcomeModal(false);
        }
      }
    } catch (err) {
      console.error('AuthProvider: Unexpected error fetching profile:', err);
    } finally {
      setLoading(false); // Stop loading after profile fetch attempt
    }
  };

  // Define the context value
  const value: AuthContextProps = {
    user,
    session,
    loading,
    showWelcomeModal,
    signOut: handleSignOut,
    markUserOnboarded
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 