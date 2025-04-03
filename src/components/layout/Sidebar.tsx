'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';
import { ROUTES } from '@/lib/config';
import Logo from '@/components/ui/Logo';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
};

const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: ROUTES.dashboard,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      label: 'View your dashboard',
      color: 'blue',
    },
    {
      name: 'Models',
      href: ROUTES.models,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 2H2v10h10V2Z" />
          <path d="M12 12H2v10h10V12Z" />
          <path d="M22 2h-10v10h10V2Z" />
          <path d="M22 12h-10v10h10V12Z" />
        </svg>
      ),
      label: 'Explore AI models',
      color: 'purple',
    },
    {
      name: 'Create Model',
      href: ROUTES.createModel,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M12 2v20" />
          <path d="M2 12h20" />
        </svg>
      ),
      label: 'Create a new AI model',
      color: 'violet',
    },
    {
      name: 'Analyze Post',
      href: ROUTES.uploadPost,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      ),
      label: 'Analyze a new post',
      color: 'green',
    },
    {
      name: 'Cristina Model',
      href: ROUTES.cristinaModel,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
      label: 'Use the Cristina model',
      color: 'pink',
    },
    {
      name: 'Jaime Model',
      href: ROUTES.jaimeModel,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
      label: 'Use the Jaime model',
      color: 'indigo',
    },
    {
      name: 'Chat',
      href: ROUTES.chat,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
          <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
        </svg>
      ),
      label: 'Chat with AI',
      color: 'cyan',
    },
    {
      name: 'Gallery',
      href: ROUTES.gallery,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="m21 9-9 6-9-6" />
          <path d="M3 9v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9" />
        </svg>
      ),
      label: 'Browse content gallery',
      color: 'amber',
    },
    {
      name: 'Profile',
      href: ROUTES.profile,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: 'View your profile',
      color: 'orange',
    },
  ];

  const handleToggleSidebar = () => {
    toggleSidebar();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleToggleSidebar();
    }
  };

  // Helper function to get the appropriate color classes based on nav item's color
  const getColorClasses = (color: string, isActive: boolean) => {
    const colorMap: Record<string, { active: string, hover: string, icon: { active: string, inactive: string } }> = {
      blue: {
        active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-l-4 border-blue-500',
        hover: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 hover:border-l-4 hover:border-blue-500',
        icon: {
          active: 'text-blue-600 dark:text-blue-400',
          inactive: 'text-blue-500 group-hover:text-blue-600 dark:text-blue-400'
        }
      },
      purple: {
        active: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-l-4 border-purple-500',
        hover: 'hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300 hover:border-l-4 hover:border-purple-500',
        icon: {
          active: 'text-purple-600 dark:text-purple-400',
          inactive: 'text-purple-500 group-hover:text-purple-600 dark:text-purple-400'
        }
      },
      violet: {
        active: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-l-4 border-violet-500',
        hover: 'hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/20 dark:hover:text-violet-300 hover:border-l-4 hover:border-violet-500',
        icon: {
          active: 'text-violet-600 dark:text-violet-400',
          inactive: 'text-violet-500 group-hover:text-violet-600 dark:text-violet-400'
        }
      },
      green: {
        active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-l-4 border-green-500',
        hover: 'hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300 hover:border-l-4 hover:border-green-500',
        icon: {
          active: 'text-green-600 dark:text-green-400',
          inactive: 'text-green-500 group-hover:text-green-600 dark:text-green-400'
        }
      },
      pink: {
        active: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-l-4 border-pink-500',
        hover: 'hover:bg-pink-50 hover:text-pink-700 dark:hover:bg-pink-900/20 dark:hover:text-pink-300 hover:border-l-4 hover:border-pink-500',
        icon: {
          active: 'text-pink-600 dark:text-pink-400',
          inactive: 'text-pink-500 group-hover:text-pink-600 dark:text-pink-400'
        }
      },
      indigo: {
        active: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-l-4 border-indigo-500',
        hover: 'hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300 hover:border-l-4 hover:border-indigo-500',
        icon: {
          active: 'text-indigo-600 dark:text-indigo-400',
          inactive: 'text-indigo-500 group-hover:text-indigo-600 dark:text-indigo-400'
        }
      },
      cyan: {
        active: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-l-4 border-cyan-500',
        hover: 'hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-900/20 dark:hover:text-cyan-300 hover:border-l-4 hover:border-cyan-500',
        icon: {
          active: 'text-cyan-600 dark:text-cyan-400',
          inactive: 'text-cyan-500 group-hover:text-cyan-600 dark:text-cyan-400'
        }
      },
      amber: {
        active: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-l-4 border-amber-500',
        hover: 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-300 hover:border-l-4 hover:border-amber-500',
        icon: {
          active: 'text-amber-600 dark:text-amber-400',
          inactive: 'text-amber-500 group-hover:text-amber-600 dark:text-amber-400'
        }
      },
      orange: {
        active: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-l-4 border-orange-500',
        hover: 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-900/20 dark:hover:text-orange-300 hover:border-l-4 hover:border-orange-500',
        icon: {
          active: 'text-orange-600 dark:text-orange-400',
          inactive: 'text-orange-500 group-hover:text-orange-600 dark:text-orange-400'
        }
      }
    };

    return {
      linkClasses: isActive ? colorMap[color].active : colorMap[color].hover,
      iconClasses: isActive ? colorMap[color].icon.active : colorMap[color].icon.inactive
    };
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-gradient-to-b from-white to-gray-50 transition-transform duration-300 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <Link 
          href={ROUTES.home}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-0"
          style={{ textDecoration: 'none', outline: 'none' }}
          tabIndex={0}
          aria-label="Go to home page"
        >
          <Logo size="md" />
          <span className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Content AI Agent</span>
        </Link>
        <button
          type="button"
          className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          onClick={handleToggleSidebar}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
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
            <path d="m18 6-12 12" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="mb-4 px-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Navigation</h2>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const { linkClasses, iconClasses } = getColorClasses(item.color, isActive);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 ${linkClasses} ${isActive ? 'shadow-sm' : ''}`}
                  tabIndex={0}
                  aria-label={item.label}
                >
                  <div className={`transition-transform duration-200 group-hover:scale-110 ${iconClasses}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current"></span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 px-3">
          <div className="rounded-md bg-gradient-to-r from-violet-500/20 to-indigo-500/20 p-3 dark:from-violet-600/10 dark:to-indigo-600/10">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Need Help?</h3>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Check out our documentation or contact support for assistance.
            </p>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar; 