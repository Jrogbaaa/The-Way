'use client';

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isBrowser } from '@/lib/utils';

// Define profile type (adjust based on your actual profiles table columns)
interface Profile {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  onboarded: boolean;
  // Add other profile fields here
}

// Define the shape of the context value
interface AuthContextProps {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  supabase: SupabaseClient;
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
  // Use useRef instead of useState for Supabase client to avoid SSR issues
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize Supabase client safely in useEffect (only runs in browser)
  useEffect(() => {
    // Safety check - only run in browser environment
    if (!isBrowser()) return;
    
    if (!supabaseRef.current) {
      console.log('AuthProvider: Initializing Supabase client ref');
      try {
        supabaseRef.current = getSupabaseBrowserClient();
        setIsClientInitialized(true); // Signal that the client is ready
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        // Set loading to false to prevent UI from being stuck
        setLoading(false);
      }
    }
  }, []); // Empty dependency array: runs only once on mount
  
  // Sign out function
  const handleSignOut = useCallback(async () => {
    if (!isBrowser() || !supabaseRef.current) return;
    
    console.log('AuthProvider: Signing out...');
    const { error } = await supabaseRef.current.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
    } else {
        setUser(null);
        setSession(null);
        setShowWelcomeModal(false);
        router.push(ROUTES.landing);
        router.refresh(); // Ensure layout reflects logged-out state
    }
  }, [router]);

  // Modify markUserOnboarded to remove validateSession call
  const markUserOnboarded = useCallback(async () => {
    if (!isBrowser() || !supabaseRef.current || !user) return;
    
    const supabase = supabaseRef.current;
    console.log('AuthProvider: Marking user as onboarded...');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating onboarding status:', error.message);
      } else {
        setShowWelcomeModal(false);
        if (profile) {
          setProfile({ ...profile, onboarded: true });
        }
        console.log('AuthProvider: User marked as onboarded successfully');
      }
    } catch (e) {
      console.error('Exception in markUserOnboarded:', e);
    }
  }, [user, profile]);

  // Fetch user profile function (ensure it handles its loading state correctly)
  const fetchProfile = useCallback(async (currentUser: User, clientInstance?: SupabaseClient | null): Promise<Profile | null> => {
    const supabase = clientInstance || supabaseRef.current;
    if (!supabase || !currentUser) {
      console.error('AuthProvider [fetchProfile]: Called with no Supabase client or user.');
      setLoading(false); // Set loading false if called incorrectly
      return null;
    }

    const userId = currentUser.id;
    console.log(`AuthProvider [fetchProfile]: Initiating fetch for user ${userId}...`);
    // setLoading(true); // Caller should set loading = true before calling fetchProfile

    try {
      console.log(`AuthProvider [fetchProfile]: Executing Supabase query for profile ${userId}...`);
      const { data, error, status } = await supabase
        .from('profiles')
        .select(`id, display_name, email, avatar_url, onboarded`)
        .eq('id', userId)
        .single();

      console.log(`AuthProvider [fetchProfile]: Response received for ${userId}. Status: ${status}, Has Data: ${!!data}, Has Error: ${!!error}`);
      
      // Log the actual error for better debugging
      if (error) {
        console.log(`AuthProvider [fetchProfile]: Error details:`, error);
      }

      // When no profile found (404/406), try to create one via the ensure-profile endpoint
      if ((error && (status === 406 || status === 404)) || !data) {
        console.log(`AuthProvider [fetchProfile]: No profile found, calling ensure-profile API...`);
        
        // Set loading to false if we have a user but can't find profile
        // This prevents the UI from being stuck in loading state
        if (currentUser) {
          console.log(`AuthProvider [fetchProfile]: Setting loading=false even though profile not found. Will use user metadata.`);
          setLoading(false);
        }
        
        try {
          // Get current session for access token
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession?.access_token) {
            // Call the ensure-profile API endpoint to create a profile
            const response = await fetch('/api/user/ensure-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession.access_token}`
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log(`AuthProvider [fetchProfile]: ensure-profile API result:`, result);
              
              // Try to fetch the profile again
              console.log(`AuthProvider [fetchProfile]: Refetching profile after ensure-profile call...`);
              const { data: refreshedData, error: refreshError } = await supabase
                .from('profiles')
                .select(`id, display_name, email, avatar_url, onboarded`)
                .eq('id', userId)
                .single();
              
              console.log(`AuthProvider [fetchProfile]: Refetch result:`, { 
                success: !!refreshedData && !refreshError,
                hasData: !!refreshedData,
                hasError: !!refreshError,
                error: refreshError
              });
                
              if (refreshedData && !refreshError) {
                console.log(`AuthProvider [fetchProfile]: Successfully fetched profile after ensure-profile call.`);
                const fetchedProfile = refreshedData as Profile;
                setProfile(fetchedProfile);
                setShowWelcomeModal(!fetchedProfile.onboarded);
                return fetchedProfile;
              }
            } else {
              console.error(`AuthProvider [fetchProfile]: ensure-profile API call failed:`, await response.text());
            }
          }
        } catch (ensureError) {
          console.error(`AuthProvider [fetchProfile]: Error calling ensure-profile API:`, ensureError);
        }
      }

      if (error && status !== 406) {
        console.error(`AuthProvider [fetchProfile]: Error fetching profile for user ${userId}:`, error);
        
        // FAILSAFE: Create a minimal profile from user metadata even when fetch fails
        console.log(`AuthProvider [fetchProfile]: Creating minimal profile from user metadata as fallback`);
        const minimalProfile: Profile = {
          id: currentUser.id,
          display_name: currentUser.user_metadata?.name || 
                        currentUser.user_metadata?.full_name || 
                        currentUser.email?.split('@')[0] || 
                        'User',
          email: currentUser.email,
          avatar_url: currentUser.user_metadata?.avatar_url,
          onboarded: true // Assume onboarded to prevent modal issues
        };
        
        console.log(`AuthProvider [fetchProfile]: Setting minimal profile from metadata:`, minimalProfile);
        setProfile(minimalProfile);
        return minimalProfile;
      }

      if (data) {
        const fetchedProfile = data as Profile;
        console.log(`AuthProvider [fetchProfile]: Profile data received for ${userId}. Onboarded: ${fetchedProfile.onboarded}`);
        setProfile(fetchedProfile);

        const isNewUser = currentUser.created_at && (Date.now() - new Date(currentUser.created_at).getTime()) < 60000;
        console.log(`AuthProvider [fetchProfile]: Checking onboarding for ${userId}. Onboarded: ${fetchedProfile.onboarded}, Is New User: ${isNewUser}`);
        if (!fetchedProfile.onboarded && isNewUser) {
          console.log(`AuthProvider [fetchProfile]: Showing welcome modal for ${userId}.`);
          setShowWelcomeModal(true);
        } else {
           console.log(`AuthProvider [fetchProfile]: Not showing welcome modal for ${userId} (Onboarded: ${fetchedProfile.onboarded}, New: ${isNewUser}).`);
          setShowWelcomeModal(false);
        }
        return fetchedProfile;
      } else {
        console.warn(`AuthProvider [fetchProfile]: No profile data found for user ${userId} (Status: ${status}). Setting profile null.`);
        setProfile(null);
        setShowWelcomeModal(false);
        return null;
      }
    } catch (err) {
      console.error(`AuthProvider [fetchProfile]: CATCH block error for user ${userId}:`, err instanceof Error ? err.message : String(err));
      setProfile(null);
      setShowWelcomeModal(false);
      return null;
    } finally {
      console.log(`AuthProvider [fetchProfile]: FINALLY block entered for user ${userId}. Setting loading = false.`);
      setLoading(false);
    }
   }, [setProfile, setLoading, setShowWelcomeModal]);

  // Set up listener useEffect - Runs when client is initialized
  useEffect(() => {
    // Only proceed if in browser and Supabase client ref is set
    if (!isBrowser() || !isClientInitialized || !supabaseRef.current) {
      console.log('AuthProvider: Listener useEffect waiting for client initialization...');
      return; 
    }
    
    console.log('AuthProvider: Client initialized, setting up onAuthStateChange listener.');
    setLoading(true); // Set loading initially when listener is attached

    try {
      // Verify the client has auth property before setting up listener
      if (!supabaseRef.current.auth) {
        console.error('AuthProvider: supabaseRef.current.auth is undefined. Cannot set up listener.');
        setLoading(false);
        return;
      }
  
      // Set up the onAuthStateChange listener using the ref client
      const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(async (event: string, session: Session | null) => {
        console.log(`AuthProvider Event: ${event} - Path: ${pathname} - Has Session: ${!!session}`);

        // Always update session state regardless of event
        setSession(session);
        
        // Debug the loading state
        console.log(`AuthProvider DEBUG: Loading state changed to: ${loading}`);
        // Debug the profile state
        console.log(`AuthProvider DEBUG: Profile state changed: ${profile ? profile.id : 'null'}`);

        // Use the client instance from the ref consistently
        const supabase = supabaseRef.current;
        if (!supabase) {
          console.error('AuthProvider: supabaseRef.current is null inside listener! This should not happen.');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Use getUser() to get the definitive user state
        let authUser: User | null = null;

        console.log(`AuthProvider [${event}]: Verifying auth state with getUser()...`);
        
        // Add timeout mechanism for getUser call
        try {
          // Create promise with timeout for getUser
          const timeoutPromise = new Promise<{data: {user: null}, error: Error}>((_, reject) => {
            setTimeout(() => reject(new Error('getUser timeout')), 2000);
          });
          
          // Race between the actual getUser call and a timeout
          const result = await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
          ]);
          
          console.log(`AuthProvider [${event}]: getUser() successful. User ID: ${result.data.user?.id || 'null'}`);
          authUser = result.data.user;
        } catch (error) {
          if (error instanceof Error && error.message === 'getUser timeout') {
            console.warn(`AuthProvider [${event}]: getUser() timed out after 2 seconds. Using session data instead.`);
            // Fall back to session data if getUser times out
            authUser = session?.user || null;
          } else if (error instanceof Error && error.message === 'Auth session missing!') {
            console.log(`AuthProvider [${event}]: getUser() failed with AuthSessionMissingError (expected if not logged in).`);
            authUser = null;
          } else {
            console.error(`AuthProvider [${event}]: Unexpected error calling getUser():`, error);
            authUser = null;
          }
        }
        
        console.log(`AuthProvider [${event}]: Setting user state based on getUser() result. User ID: ${authUser?.id || 'null'}`);
        setUser(authUser);

        // CRITICAL: Ensure loading doesn't stay true forever 
        // This prevents the UI from being stuck in loading state
        if (authUser) {
          setTimeout(() => {
            if (loading) {
              console.log(`AuthProvider [${event}]: Safety timeout - forcing loading=false after 5s`);
              setLoading(false);
            }
          }, 5000);
        }

        // Handle profile fetching based on the user state
        if (authUser) {
          console.log(`AuthProvider [${event}]: User authenticated (ID: ${authUser.id}), initiating profile fetch...`);
          setLoading(true); // Set loading before async fetch
          await fetchProfile(authUser, supabase);
          // Note: setLoading(false) is handled within fetchProfile's finally block
        } else {
          console.log(`AuthProvider [${event}]: No authenticated user found by getUser(). Clearing profile, setting loading=false.`);
          console.log(`AuthProvider [${event}]: Clearing profile/session state.`);
          setProfile(null);
          setShowWelcomeModal(false);
          setLoading(false);
        }
        
        // Specific event handling (mostly for logging or minor adjustments now)
        switch(event) {
            case 'SIGNED_OUT':
                console.log('AuthProvider [SIGNED_OUT]: Clearing profile/session state.');
                // State should already be cleared by the logic above, but double-check
                setProfile(null);
                setSession(null);
                setShowWelcomeModal(false);
                setLoading(false); // Ensure loading is false
                break;
            // Other cases might just log now, as the main logic is driven by getUser()
            case 'PASSWORD_RECOVERY':
            case 'USER_UPDATED': 
            case 'TOKEN_REFRESHED':
                  console.log(`AuthProvider [${event}]: Event received. State updated based on preceding getUser().`);
                  // Loading state handled by fetchProfile call or the 'else' block above
                  break;
              default:
                  // Includes INITIAL_SESSION, SIGNED_IN - primary logic handled above
                   console.log(`AuthProvider [${event}]: Event received. State updated based on preceding getUser().`);
                   break;
        }
      });
  
      // Cleanup function
      return () => {
        if (subscription) {
          subscription.unsubscribe();
          console.log('AuthProvider: Unsubscribing from auth changes.');
        }
      };
    } catch (error) {
      console.error('AuthProvider: Error setting up auth listener:', error);
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, [isClientInitialized, pathname, fetchProfile]);

  // For debugging - log profile and loading state changes
  useEffect(() => {
    console.log('AuthProvider DEBUG: Loading state changed to:', loading);
  }, [loading]);

  useEffect(() => {
    // Log profile changes, including when it becomes null
    console.log('AuthProvider DEBUG: Profile state changed:', profile ? `User ${profile.id}, Onboarded: ${profile.onboarded}` : 'null');
  }, [profile]);

  // Define the context value - with safer access
  const value: AuthContextProps = {
    user,
    profile,
    session,
    // Use a safe way to get the supabase client, with fallback to empty object
    supabase: (isBrowser() && supabaseRef.current) 
      ? supabaseRef.current 
      : {} as SupabaseClient,
    loading,
    showWelcomeModal,
    signOut: handleSignOut,
    markUserOnboarded
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 