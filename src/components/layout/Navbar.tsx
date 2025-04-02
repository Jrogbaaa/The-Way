'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import Logo from '@/components/ui/Logo';
import ButtonLink from '@/components/ui/button-link';
import { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Check if we're on an interior page (not homepage)
  const isInteriorPage = pathname !== ROUTES.home;

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

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleSidebar();
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New content analysis',
      message: 'Your Instagram post analysis is complete.',
      time: '5 minutes ago',
      read: false
    },
    {
      id: 2,
      title: 'AI model update',
      message: 'Cristina Model has been updated to v2.1.',
      time: '1 hour ago',
      read: false
    },
    {
      id: 3,
      title: 'Content goal achieved',
      message: 'You reached your weekly content goal! 🎉',
      time: '3 hours ago',
      read: true
    }
  ];

  return (
    <header className="w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {isInteriorPage && (
            <button
              type="button"
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              onClick={handleToggleSidebar}
              onKeyDown={handleSidebarKeyDown}
              tabIndex={0}
              aria-expanded={sidebarOpen}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
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
          {/* Notifications button */}
          {user && (
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                onClick={toggleNotifications}
                aria-expanded={notificationsOpen}
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 cursor-pointer ${notification.read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      href="/notifications"
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
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
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
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