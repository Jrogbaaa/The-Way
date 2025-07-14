import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

// Use proper environment variables with fallbacks for different deployment contexts
const getAuthSecret = () => {
  // Check for various possible auth secret environment variables
  return process.env.NEXTAUTH_SECRET || 
         process.env.AUTH_SECRET || 
         "46bbbdb890aca5317b5979cb426ca4db0e79e5caa86ea98acccad2fe842a5acc";
};

const getAuthUrl = () => {
  // Use NEXTAUTH_URL for production, fallback to NEXT_PUBLIC_APP_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Development fallback
  return "http://localhost:3000";
};

export const authConfig: NextAuthConfig = {
  secret: getAuthSecret(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // In a real application, you would check these credentials against your database
        // For demo purposes, we're using hardcoded values
        if (credentials.email === "admin@example.com" && credentials.password === "admin123") {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Add user ID and image to the JWT token if available
      if (user) {
        token.id = user.id;
        // Capture the image from user object (NextAuth provides this from OAuth providers)
        token.picture = user.image || token.picture;
      }
      
      // For Google OAuth, also capture from profile if available
      if (account?.provider === 'google' && profile) {
        token.picture = profile.picture || token.picture;
        // Add the Google account sub as the user ID for consistency
        token.id = token.sub || profile.sub || token.id;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID and image to the session from the JWT token
      if (token && session.user) {
        session.user.id = token.id as string || token.sub as string;
        // Make sure the image is available in the session
        session.user.image = token.picture as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login page
      }
      return true;
    },
  },
  // Debug logging for production issues
  debug: process.env.NODE_ENV === "development",
  logger: {
    error: (error: Error) => {
      console.error(`NextAuth Error:`, error);
    },
    warn: (code: string) => {
      console.warn(`NextAuth Warning [${code}]`);
    },
    debug: (code: string, metadata?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`NextAuth Debug [${code}]:`, metadata);
      }
    },
  },
  // Configure trust host for Vercel deployment
  trustHost: true,
};

// Log auth configuration for debugging
console.log('NextAuth Configuration:', {
  authUrl: getAuthUrl(),
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasAuthSecret: !!getAuthSecret(),
  nodeEnv: process.env.NODE_ENV,
});

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig); 