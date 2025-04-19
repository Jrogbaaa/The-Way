import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import { initializeScheduler } from '@/lib/services/scheduler';
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
import { WelcomeModal } from '@/components/WelcomeModal';

const inter = Inter({ subsets: ["latin"] });

// Initialize server-side services
if (typeof window === 'undefined') {
  // Only run on the server-side
  try {
    console.log('Initializing server-side services...');
    initializeScheduler();
    console.log('Server-side services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server-side services:', error);
  }
}

export const metadata: Metadata = {
  title: APP_NAME,
  description: "AI-powered social media content creation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <WelcomeModal />
          <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
            <ClientErrorBoundary>
              {children}
            </ClientErrorBoundary>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
