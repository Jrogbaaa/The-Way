'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { ArrowLeft, Sparkles } from 'lucide-react';
import OnboardingWelcome from '@/components/OnboardingWelcome';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [userName, setUserName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Extract name from email for personalized welcome
    // Make it more user-friendly by removing numbers and capitalizing first letter
    let nameFromEmail = email.split('@')[0];
    // Remove numbers and special characters at the end
    nameFromEmail = nameFromEmail.replace(/[0-9_.-]+$/, '');
    // Capitalize first letter
    nameFromEmail = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    
    setUserName(nameFromEmail);
    
    // For presentation, simulate signup and show onboarding modal
    setTimeout(() => {
      setLoading(false);
      setSignupComplete(true);
    }, 1500);
  };

  const handleOnboardingClosed = () => {
    // Redirect to dashboard after onboarding is closed
    window.location.href = ROUTES.dashboard;
  };
  
  // Add Google Sign In handler
  const handleGoogleSignIn = useCallback(async () => {
    // Use the singleton Supabase client
    const supabase = getSupabaseBrowserClient();
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('Signup: Initiating Google sign-in using the singleton client');
    console.log('Signup: Using redirect URL:', redirectUrl);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error.message);
        // Handle error appropriately (e.g., show a notification)
      } else {
        console.log('Signup: OAuth initiated successfully, redirect data:', data);
      }
    } catch (e) {
      console.error('Exception during Google sign-in:', e);
    }
    // Supabase handles the redirect, no explicit redirect here needed generally
  }, []);
  
  return (
    <div className="flex min-h-screen flex-col">
      {signupComplete && <OnboardingWelcome userName={userName} onClose={handleOnboardingClosed} />}
      
      <div className="flex flex-1">
        {/* Left side - signup form */}
        <div className="flex flex-col w-full lg:w-1/2 px-4 py-12 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8">
              <Link 
                href={ROUTES.home}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to home
              </Link>
            </div>
            
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Start your free trial</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    href={ROUTES.login} 
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company name (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      id="company-name"
                      name="company-name"
                      type="text"
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                      placeholder="Your company name"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-base"
                    disabled={loading}
                  >
                    {loading ? 'Creating your account...' : 'Start free trial'}
                  </Button>
                </div>
                
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  No credit card required • Free 14-day trial • Cancel anytime
                </p>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-950 dark:text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full inline-flex items-center justify-center space-x-2"
                  type="button"
                  onClick={handleGoogleSignIn}
                  aria-label="Sign in with Google"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  <span>Google</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                >
                  GitHub
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - visual benefits */}
        <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-indigo-600 to-violet-600">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-lg">
              <div className="mb-8 inline-flex items-center justify-center rounded-full bg-white/10 p-2">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Create perfect social media content in minutes</h2>
              <ul className="space-y-4">
                {[
                  "AI-generated content ideas tailored to your brand",
                  "Intelligent targeting to reach your ideal audience",
                  "One streamlined workflow from idea to publication",
                  "Performance analytics to improve engagement"
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <svg
                      className="h-6 w-6 text-green-400 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-white text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-lg italic text-white mb-3">
                  "Content AI Agent transformed how we create content. We've cut our production time in half while doubling engagement."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-300 mr-3"></div>
                  <div>
                    <p className="text-white font-medium">Sarah Johnson</p>
                    <p className="text-indigo-200 text-sm">Marketing Director, TechCorp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 