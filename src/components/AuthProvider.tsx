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
      // You could add logic here to check if this is a new user
      // For example, check localStorage or a user property from session
      const hasOnboarded = localStorage.getItem('userOnboarded');
      if (!hasOnboarded) {
        setShowWelcomeModal(true);
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