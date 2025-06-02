import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

// Use a hardcoded secret for development - in production, use a proper environment variable
const authSecret = process.env.AUTH_SECRET || "46bbbdb890aca5317b5979cb426ca4db0e79e5caa86ea98acccad2fe842a5acc";

export const authConfig: NextAuthConfig = {
  secret: authSecret,
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
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user ID and image to the session from the JWT token
      if (token && session.user) {
        session.user.id = token.id as string;
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
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig); 