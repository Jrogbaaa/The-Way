'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LinkButton } from '@/components/ui/link-button';
import { ROUTES } from '@/lib/config';
import Logo from '@/components/ui/Logo';
import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Check, LogOut, User as UserIcon, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { FirstTimeVisitorModal } from '@/components/FirstTimeVisitorModal';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleMobileMenu();
    }
  };

  // Ensure component is mounted before using theme
  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false); 
  };

  const renderThemeToggle = () => {
    if (!mounted) return <Skeleton className="h-8 w-8 rounded-full" />;
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>
    );
  };

  const renderAuthButtons = (isMobile: boolean) => {
    const buttonSize = isMobile ? 'default' : 'sm';
    const commonButtonClasses = isMobile ? "w-full justify-start" : "whitespace-nowrap";
    const linkClasses = isMobile ? "text-base font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400" : "";

    if (loading) {
      return (
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
          <Skeleton className={`h-9 ${isMobile ? 'w-full' : 'w-20'}`} />
          <Skeleton className={`h-9 ${isMobile ? 'w-full' : 'w-20'}`} />
        </div>
      );
    }
    
    if (user) {
      const displayName = user.user_metadata?.full_name || user.email || 'Account';
      const avatarUrl = user.user_metadata?.avatar_url;
      return (
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
          <Button asChild variant={isMobile ? "ghost" : "outline"} size={buttonSize} className={commonButtonClasses}>
            <Link href={ROUTES.dashboard} className={`${linkClasses} flex items-center gap-2`}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="User avatar" width={24} height={24} className="rounded-full" />
              ) : (
                <UserIcon className={`h-4 w-4 ${isMobile ? 'mr-2' : ''}`} />
              )}
              <span className={isMobile ? '' : 'whitespace-nowrap'}>{displayName}</span>
            </Link>
          </Button>
          <Button variant={isMobile ? "ghost" : "outline"} size={buttonSize} onClick={handleSignOut} className={`${commonButtonClasses} ${isMobile ? 'text-red-600 dark:text-red-400' : ''}`}>
            <LogOut className={`h-4 w-4 ${isMobile ? 'mr-2' : ''}`}/> {isMobile ? 'Sign Out' : ''}
            {!isMobile && <span className="whitespace-nowrap">Sign Out</span>}
          </Button>
        </div>
      );
    } else {
      return (
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
          <Button asChild variant="outline" size={buttonSize} className={commonButtonClasses}>
            <Link href={ROUTES.login} className={linkClasses}>Sign In</Link>
          </Button>
          <Button asChild size={buttonSize} className={`${commonButtonClasses} bg-indigo-600 hover:bg-indigo-700 text-white`}>
            <Link href={ROUTES.signup} className={linkClasses}>Sign Up</Link>
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="container mx-auto w-full px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                href={ROUTES.home}
                className="flex items-center gap-2 text-lg font-semibold"
                tabIndex={0}
                aria-label="Go to home page"
              >
                <Logo size="md" />
                <span>optimalpost.ai</span>
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={toggleMobileMenu}
                onKeyDown={handleMobileMenuKeyDown}
                tabIndex={0}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-6 w-6"
                >
                  {mobileMenuOpen ? (
                    <>
                      <path d="M18 6L6 18" />
                      <path d="M6 6L18 18" />
                    </>
                  ) : (
                    <>
                      <path d="M4 6h16" />
                      <path d="M4 12h16" />
                      <path d="M4 18h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-4">
              {/* Conditional Auth Buttons - Desktop */}
              {loading ? (
                <>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-9 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </>
              ) : user ? (
                <>
              <Link 
                    href={ROUTES.dashboard}
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                    aria-label="Go to dashboard"
                  >
                    <div className="relative h-6 w-6 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600">
                    {user.user_metadata?.avatar_url ? (
                        <Image
                        src={user.user_metadata.avatar_url}
                          alt="User avatar"
                          fill
                          className="object-cover"
                          sizes="24px"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                          {(user.user_metadata?.name?.[0] || 
                            user.user_metadata?.full_name?.[0] || 
                            user.email?.[0] || 'U').toUpperCase()}
                        </div>
                    )}
                    </div>
                    <span className="truncate max-w-[150px]"> 
                      {user.user_metadata?.name || user.user_metadata?.full_name || user.email}
                    </span>
              </Link>
                  <Button 
                    variant="outline"
                    onClick={signOut} 
                    aria-label="Sign out"
                    className="text-sm whitespace-nowrap"
                  >
                    <LogOut className="mr-2 h-4 w-4"/>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
              <Link 
                href={ROUTES.login}
                className="text-sm font-medium hover:text-primary px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                tabIndex={0}
                aria-label="Sign in to your account"
              >
                Sign In
              </Link>
                  <Button asChild>
                <Link 
                  href={ROUTES.signup}
                  tabIndex={0}
                  aria-label="Create a new account"
                >
                  Sign Up
                </Link>
              </Button>
                </>
              )}
            </nav>
          </div>
          
          {/* Mobile menu dropdown */}
          <div 
            className={`md:hidden transition-all duration-300 overflow-hidden ${
              mobileMenuOpen ? 'max-h-96 py-3 border-t border-gray-200 dark:border-gray-800' : 'max-h-0'
            }`}
          >
            <nav className="flex flex-col space-y-2">
              {/* Conditional Auth Buttons - Mobile */}
              {loading ? (
                  <>
                    <div className="px-3 py-2.5">
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="px-3 py-2.5">
                       <div className="h-8 w-full bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    </div>
                  </>
              ) : user ? (
                <>
                  <LinkButton 
                    href={ROUTES.dashboard}
                    variant="ghost"
                    className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 justify-start"
                tabIndex={mobileMenuOpen ? 0 : -1}
                    aria-label="Go to dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                    <div className="relative h-6 w-6 overflow-hidden rounded-full border border-gray-300 dark:border-gray-600 mr-2 flex-shrink-0">
                      {user.user_metadata?.avatar_url ? (
                        <Image
                          src={user.user_metadata.avatar_url}
                          alt="User avatar"
                          fill
                          className="object-cover"
                          sizes="24px"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                          {(user.user_metadata?.name?.[0] || 
                            user.user_metadata?.full_name?.[0] || 
                            user.email?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="truncate max-w-[150px]"> 
                      {user.user_metadata?.name || user.user_metadata?.full_name || user.email}
                    </span>
                  </LinkButton>
                  <Button 
                    variant="ghost"
                    onClick={() => { signOut(); setMobileMenuOpen(false); }} 
                    aria-label="Sign out"
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 justify-start text-red-600 dark:text-red-500 dark:hover:bg-red-900/20 hover:text-red-700"
                  >
                     <LogOut className="mr-2 h-4 w-4"/>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
              <Link 
                href={ROUTES.login}
                className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-label="Sign in to your account"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                href={ROUTES.signup}
                    className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 px-3 py-2.5 rounded-md text-center"
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-label="Create a new account"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {/* Hero Section - Simplified & focused */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-br from-violet-600 to-indigo-700">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6 max-w-2xl mx-auto lg:mx-0">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                    We know what's best for your social media. We're gonna show you how it's done.
                  </h1>
                  <p className="text-xl text-violet-100 md:text-xl/relaxed font-light">
                    Our AI-powered platform guides you through content creation, targeting, and distribution in one seamless flow.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    size="lg" 
                    onClick={() => setWelcomeModalOpen(true)}
                    className={`bg-white text-indigo-600 hover:bg-gray-100 w-full sm:w-auto text-center py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                    aria-label="Try our tools"
                  >
                    Create Posts
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <p className="text-sm text-violet-200 font-medium">
                    No login required • Try instantly
                  </p>
                </div>
                
                {/* Trust indicators */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center text-white mt-6">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm">AI-driven targeting</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm">Integrated analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-sm">Content calendar</span>
                  </div>
                </div>
              </div>
              
              {/* Visual element - modern UI preview */}
              <div className="hidden lg:block relative">
                <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-2 transform rotate-1 transition-all duration-500 hover:rotate-0">
                  <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 rounded-lg overflow-hidden">
                    <div className="p-8 flex flex-col items-center justify-center h-full">
                      <Sparkles className="h-16 w-16 text-indigo-500 mb-4" />
                      <div className="w-2/3 h-4 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-3"></div>
                      <div className="w-1/2 h-4 bg-indigo-100 dark:bg-indigo-900 rounded-full"></div>
                      
                      <div className="mt-8 grid grid-cols-3 gap-3 w-full">
                        <div className="aspect-square bg-pink-400 dark:bg-pink-600 rounded-lg shadow-sm"></div>
                        <div className="aspect-square bg-blue-400 dark:bg-blue-600 rounded-lg shadow-sm"></div>
                        <div className="aspect-square bg-purple-400 dark:bg-purple-600 rounded-lg shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-2xl shadow-lg flex items-center text-white font-medium">
                  <Sparkles className="h-5 w-5 mr-2" />
                  <span>AI-Generated</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Social Proof Section */}
        <section className="w-full py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <p className="text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Trusted by content creators worldwide</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                {/* Brand logos - placeholders */}
                <div className="h-6 w-24 bg-gray-400 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-28 bg-gray-400 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-20 bg-gray-400 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-32 bg-gray-400 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-24 bg-gray-400 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Simplified and focused */}
        <section className="w-full py-16 md:py-24 bg-white dark:bg-gray-950">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  The complete content creation workflow
                </h2>
                <p className="text-lg text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our streamlined process takes you from idea to publishable content in minutes
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1: Idea Generation */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 p-3 text-violet-600 dark:text-violet-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M9 18h6"></path>
                    <path d="M10 22h4"></path>
                    <path d="M15.5 2c-1.74 0-3.41.81-4.5 2.09C9.91 2.81 8.24 2 6.5 2 3.46 2 1 4.46 1 7.5c0 3.4 3.44 6.8 10 12.55 6.56-5.75 10-9.15 10-12.55C21 4.46 18.54 2 15.5 2Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">1. AI-Powered Ideas</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Tell us your goal and audience, and our AI generates tailored content ideas</p>
                <Button 
                  variant="link" 
                  className="text-indigo-600 hover:text-indigo-800"
                  onClick={() => setWelcomeModalOpen(true)}
                >
                  Try Now
                </Button>
              </div>
              
              {/* Step 2: Content Generation */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3 text-indigo-600 dark:text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M12 3v12"></path>
                    <path d="m8 11 4 4 4-4"></path>
                    <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Create & Refine</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Instantly transform ideas into visuals, captions, and engaging content</p>
                <Button 
                  variant="link" 
                  className="text-indigo-600 hover:text-indigo-800"
                  onClick={() => setWelcomeModalOpen(true)}
                >
                  Try Now
                </Button>
              </div>
              
              {/* Step 3: Targeting & Optimization */}
              <div className="flex flex-col items-center text-center p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-900">
                <div className="mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                    <path d="M17 14V2"></path>
                    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Target & Optimize</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Get AI-suggested @mentions and optimize content for maximum engagement</p>
                <Button 
                  variant="link" 
                  className="text-indigo-600 hover:text-indigo-800"
                  onClick={() => setWelcomeModalOpen(true)}
                >
                  Try Now
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-indigo-600 to-violet-600">
          <div className="container mx-auto w-full px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to transform your social media content?
                </h2>
                <p className="text-xl text-indigo-100 md:text-xl/relaxed">
                  Join thousands of creators who are saving time and getting better results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  onClick={() => setWelcomeModalOpen(true)}
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-gray-100 min-w-[200px] py-6 text-lg font-medium"
                  aria-label="Try our tools without login"
                >
                  Try Without Login
                </Button>
                <LinkButton 
                  href={ROUTES.signup}
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 min-w-[200px] py-6 text-lg font-medium"
                  aria-label="Sign up for a free trial"
                >
                  Start Free Trial
                </LinkButton>
              </div>
              <p className="text-sm text-white/80 pt-4">
                Experience the value first • No login required
              </p>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
                <span className="text-lg font-semibold">Content AI Agent</span>
              </div>
              <p className="text-sm text-gray-400">
                Empowering content creators with AI-powered tools for better social media content.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:text-white">Features</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:text-white">About</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Careers</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm hover:text-white">Privacy</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Terms</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Cookies</Link></li>
                <li><Link href="#" className="text-sm hover:text-white">Licenses</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Content AI Agent. All rights reserved.
          </div>
        </div>
      </footer>
      <FirstTimeVisitorModal 
        isOpen={welcomeModalOpen} 
        onOpenChange={setWelcomeModalOpen} 
      />
    </div>
  );
}
