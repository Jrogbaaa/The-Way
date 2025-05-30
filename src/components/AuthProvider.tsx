'use client';

import { SessionProvider, useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Create an auth context
interface AuthContextType {
  user: any;
  showWelcomeModal: boolean;
  markUserOnboarded: () => void;
  loading: boolean;
  session: any;
  signOut: () => Promise<void>;
  profile: any;
  supabase?: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  showWelcomeModal: false,
  markUserOnboarded: () => {},
  loading: true,
  session: null,
  signOut: async () => {},
  profile: null,
  supabase: null
});

// Custom provider that includes both SessionProvider and our AuthContext
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

// Internal context provider with our custom auth logic
function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [supabase, setSupabase] = useState<any>(null);
  
  // Initialize Supabase client
  useEffect(() => {
    try {
      const client = getSupabaseBrowserClient();
      setSupabase(client);
      console.log('Supabase client initialized in AuthProvider');
    } catch (error) {
      console.error('Failed to initialize Supabase client in AuthProvider:', error);
    }
  }, []);
  
  // Check if user should see welcome modal
  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      // Don't show welcome modal if user is in a training flow
      const tempConfigId = localStorage.getItem('tempConfigId');
      const pendingTrainingState = localStorage.getItem('pendingTrainingState');
      const hasOnboarded = localStorage.getItem('userOnboarded');
      const isTrainingFlow = tempConfigId || pendingTrainingState;
      
      console.log('AuthProvider welcome modal check:', {
        hasOnboarded,
        isTrainingFlow,
        tempConfigId,
        pendingTrainingState,
        userEmail: session.user.email
      });
      
      // Check if this is a fresh page load vs OAuth redirect
      // If there's a training session ongoing, don't show welcome modal
      // Also check if user might have existing models (alternative to localStorage)
      if (!hasOnboarded && !isTrainingFlow) {
        console.log('Checking if user has existing models...');
        // Additional check: see if user has models (indicates they're not new)
        fetch('/api/modal/user-models', {
          method: 'GET',
          credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
          console.log('User models check result:', data);
          if (data.status === 'success' && data.models && data.models.length > 0) {
            // User has existing models, mark as onboarded and don't show modal
            localStorage.setItem('userOnboarded', 'true');
            console.log('User has existing models, skipping welcome modal');
          } else if (data.debug?.possibleModels && data.debug.possibleModels.length > 0) {
            // Debug found possible models but they weren't in main query - still mark as onboarded
            localStorage.setItem('userOnboarded', 'true');
            console.log('Debug found possible models for user, skipping welcome modal');
          } else {
            // User is genuinely new, show welcome modal
            console.log('User is new, showing welcome modal');
            setShowWelcomeModal(true);
          }
        })
        .catch(error => {
          console.warn('Could not check user models, showing welcome modal by default:', error);
          setShowWelcomeModal(true);
        });
      } else {
        console.log('Skipping welcome modal - user onboarded or in training flow');
      }
    }
  }, [session, status]);
  
  const markUserOnboarded = useCallback(() => {
    localStorage.setItem('userOnboarded', 'true');
    setShowWelcomeModal(false);
  }, []);
  
  // Format the user object to match what WelcomeModal expects
  const formattedUser = session?.user ? {
    ...session.user,
    user_metadata: {
      full_name: session.user.name
    },
    email: session.user.email
  } : null;
  
  const handleSignOut = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out of Supabase:', e);
      }
    }
    await nextAuthSignOut();
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: formattedUser,
        showWelcomeModal,
        markUserOnboarded,
        loading: status === 'loading',
        session,
        signOut: handleSignOut,
        profile,
        supabase
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider; 