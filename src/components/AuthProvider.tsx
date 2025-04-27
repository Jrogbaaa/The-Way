'use client';

import React, { useState, useEffect, createContext, useContext, PropsWithChildren, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
    if (typeof window !== 'undefined' && !supabaseRef.current) {
      console.log('AuthProvider: Initializing Supabase client ref');
      supabaseRef.current = getSupabaseBrowserClient();
      setIsClientInitialized(true); // Signal that the client is ready
    }
  }, []); // Empty dependency array: runs only once on mount
  
  // Sign out function
  const handleSignOut = useCallback(async () => {
    if (!supabaseRef.current) return;
    
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
    if (!supabaseRef.current) return;
    
    console.log('AuthProvider: markUserOnboarded called'); 
    
    // Get current session for access token
    const { data: { session: currentSession } } = await supabaseRef.current.auth.getSession();
    
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
  }, [user]);

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
    // Only proceed if the Supabase client ref is set
    if (!isClientInitialized || !supabaseRef.current) {
      console.log('AuthProvider: Listener useEffect waiting for client initialization...');
      return; 
    }
    
    console.log('AuthProvider: Client initialized, setting up onAuthStateChange listener.');
    setLoading(true); // Set loading initially when listener is attached

    // Set up the onAuthStateChange listener using the ref client
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log(`AuthProvider Event: ${event} - Path: ${pathname} - Has Session: ${!!session}`);

      // Always update session state regardless of event
      setSession(session);

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
      let verifiedUser: User | null = null;

      // --- Always try getUser() inside the listener to verify state --- 
      console.log(`AuthProvider [${event}]: Verifying auth state with getUser()...`);
      
      // Remove the delay and replace with timeout mechanism
      let getUserResult: User | null = null;
      let getUserError: any = null;

      // Add timeout mechanism for getUser call
      try {
          // Set up a Promise.race between getUser and a timeout
          const getUserPromise = supabase.auth.getUser();
          const timeoutPromise = new Promise<{data: {user: null}, error: Error}>((_, reject) => 
              setTimeout(() => reject(new Error('getUser timeout')), 2000));
          
          // Race between the getUser call and the timeout
          const result = await Promise.race([getUserPromise, timeoutPromise]);
          console.log(`AuthProvider [${event}]: <<< Call to supabase.auth.getUser() completed.`);
          getUserResult = result.data.user;
          getUserError = result.error;
      } catch (e) {
          // Handle timeout or other errors
          if (e instanceof Error && e.message === 'getUser timeout') {
              console.warn(`AuthProvider [${event}]: getUser() timed out after 2 seconds. Using session data instead.`);
              // When getUser times out, we'll use the session data directly
              getUserResult = session?.user || null;
              getUserError = null;
          } else {
              console.error(`AuthProvider [${event}]: XXX CRITICAL ERROR during await supabase.auth.getUser():`, e);
              getUserError = e;
          }
      }

      if (getUserError) {
          // Handle specific expected error if no session
          if (getUserError.message === 'Auth session missing!') {
              console.log(`AuthProvider [${event}]: getUser() failed with AuthSessionMissingError (expected if not logged in).`);
              verifiedUser = null;
          } else {
              // Log other unexpected errors from getUser()
              console.error(`AuthProvider [${event}]: Unexpected error calling getUser():`, getUserError);
              // Reset state on unexpected error
              setUser(null);
              setProfile(null);
              setSession(null); // Clear session too
              setLoading(false); 
              return; 
          }
      } else {
          console.log(`AuthProvider [${event}]: getUser() successful. User ID:`, getUserResult?.id ?? 'null');
          verifiedUser = getUserResult;
      }
      
      // Assign the verified user (or null) - this is the most reliable source
      authUser = verifiedUser; 
      console.log(`AuthProvider [${event}]: Setting user state based on getUser() result. User ID: ${authUser?.id ?? 'null'}`);
      setUser(authUser);

      // CRITICAL: Ensure loading doesn't stay true forever if we have a user
      // This prevents the UI from being stuck in loading state
      if (authUser) {
        // We'll set loading to true again below right before fetching profile
        // But this ensures it doesn't stay true forever if profile fetch fails
        setTimeout(() => {
          if (loading) {
            console.log(`AuthProvider [${event}]: Safety timeout - forcing loading=false after 5s`);
            setLoading(false);
          }
        }, 5000);
      }

      // Handle profile fetching and loading state based ONLY on the getUser() result
      // Ensure loading is set to true *before* the async fetchProfile call
      // and set to false *after* it completes (in fetchProfile's finally block) or if no fetch is needed.
      
      if (authUser) {
          // If user is confirmed, fetch profile (fetchProfile handles its own loading state internally now)
           console.log(`AuthProvider [${event}]: User authenticated (ID: ${authUser.id}), initiating profile fetch...`);
           setLoading(true); // Set loading before async fetch
           await fetchProfile(authUser, supabase);
           // setLoading(false) is handled within fetchProfile's finally block
      } else {
          // If no user is confirmed by getUser()
          console.log(`AuthProvider [${event}]: No authenticated user found by getUser(). Clearing profile, setting loading=false.`);
          setProfile(null);
          setShowWelcomeModal(false);
          // Explicitly ensure loading is false if no user/profile fetch needed
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
      subscription?.unsubscribe();
      console.log('AuthProvider: Unsubscribing from auth changes.');
    };
  }, [isClientInitialized, pathname, fetchProfile]); // Added fetchProfile and pathname dependencies 

  // For debugging - log profile and loading state changes
  useEffect(() => {
    console.log('AuthProvider DEBUG: Loading state changed to:', loading);
  }, [loading]);

  useEffect(() => {
    // Log profile changes, including when it becomes null
    console.log('AuthProvider DEBUG: Profile state changed:', profile ? `User ${profile.id}, Onboarded: ${profile.onboarded}` : 'null');
  }, [profile]);

  // Define the context value
  const value: AuthContextProps = {
    user,
    profile,
    session,
    supabase: supabaseRef.current || getSupabaseBrowserClient() || ({} as SupabaseClient),
    loading,
    showWelcomeModal,
    signOut: handleSignOut,
    markUserOnboarded
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider; 