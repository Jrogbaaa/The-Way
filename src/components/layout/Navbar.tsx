'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import Logo from '@/components/ui/Logo';
import ButtonLink from '@/components/ui/button-link';
import { useState } from 'react';

const Navbar = () => {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    signOut();
    router.push(ROUTES.home);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSignOut();
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleMobileMenu();
    }
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link 
            href={ROUTES.home}
            className="flex items-center gap-2 text-lg font-semibold hover:opacity-90 transition-opacity rounded-md p-1 focus:outline-none border-0"
            style={{ textDecoration: 'none', outline: 'none', border: 'none' }}
            tabIndex={0}
            aria-label="Go to home page"
          >
            <Logo size="md" />
            <span style={{ border: 'none', outline: 'none' }}>Social AI Agent</span>
          </Link>
          <nav className="hidden md:flex gap-6 ml-12">
            <Link 
              href={ROUTES.models}
              className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              tabIndex={0}
              aria-label="Browse AI models"
            >
              Models
            </Link>
            <Link 
              href={ROUTES.gallery}
              className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              tabIndex={0}
              aria-label="Browse gallery"
            >
              Gallery
            </Link>
            <Link 
              href={ROUTES.chat}
              className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              tabIndex={0}
              aria-label="Chat with AI"
            >
              Chat
            </Link>
            <Link 
              href={ROUTES.uploadPost}
              className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              tabIndex={0}
              aria-label="Analyze a post"
            >
              Analyze Post
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
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
          
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href={ROUTES.dashboard}
                className="text-sm font-medium hover:text-primary"
                tabIndex={0}
                aria-label="Go to dashboard"
              >
                Dashboard
              </Link>
              <Link 
                href={ROUTES.profile}
                className="flex items-center gap-2"
                tabIndex={0}
                aria-label="View profile"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt="User avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                      {user.full_name?.[0] || user.email[0]}
                    </div>
                  )}
                </div>
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                aria-label="Sign out"
              >
                Sign Out
              </Button>
            </div>
          ) :
            <div className="hidden md:flex items-center gap-2">
              <ButtonLink 
                href={ROUTES.login}
                variant="ghost"
                className="px-4 py-2 whitespace-nowrap"
                aria-label="Sign in to your account"
              >
                Sign In
              </ButtonLink>
              <ButtonLink 
                href={ROUTES.signup}
                variant="primary"
                className="px-4 py-2 whitespace-nowrap"
                aria-label="Create a new account"
              >
                Sign Up
              </ButtonLink>
            </div>
          }
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      <div 
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? 'max-h-96 border-b border-gray-200 dark:border-gray-800' : 'max-h-0'
        }`}
      >
        <nav className="container px-4 py-3 flex flex-col space-y-2">
          <Link 
            href={ROUTES.models}
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Test AI Models"
            onClick={() => setMobileMenuOpen(false)}
          >
            Test Models
          </Link>
          <Link 
            href="/api-test"
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Test API Connections"
            onClick={() => setMobileMenuOpen(false)}
          >
            API Tests
          </Link>
          <Link 
            href={ROUTES.gallery}
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Browse gallery"
            onClick={() => setMobileMenuOpen(false)}
          >
            Gallery
          </Link>
          <Link 
            href={ROUTES.chat}
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Chat with AI"
            onClick={() => setMobileMenuOpen(false)}
          >
            Chat
          </Link>
          <Link 
            href={ROUTES.uploadPost}
            className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Analyze a post"
            onClick={() => setMobileMenuOpen(false)}
          >
            Analyze Post
          </Link>
          
          {user ? (
            <>
              <Link 
                href={ROUTES.dashboard}
                className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-label="Go to dashboard"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href={ROUTES.profile}
                className="text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-label="View profile"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                type="button" 
                className="text-left text-sm font-medium hover:text-primary transition-all duration-200 px-3 py-2.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                tabIndex={mobileMenuOpen ? 0 : -1}
                aria-label="Sign out"
              >
                Sign Out
              </button>
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
                className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 px-3 py-2.5 rounded-md"
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
    </header>
  );
};

export default Navbar; 