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
      name: 'Image Creator',
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
      label: 'Create images with AI models',
      color: 'purple',
    },
    {
      name: 'Video Creator',
      href: ROUTES.imageToVideo,
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
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      label: 'Convert images to videos',
      color: 'red',
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
    switch (color) {
      case 'blue':
        return {
          active: 'bg-blue-600',
          hover: 'hover:text-blue-600',
          iconBg: 'bg-blue-100 text-blue-600'
        };
      case 'purple':
        return {
          active: 'bg-purple-600',
          hover: 'hover:text-purple-600',
          iconBg: 'bg-purple-100 text-purple-600'
        };
      case 'violet':
        return {
          active: 'bg-violet-600',
          hover: 'hover:text-violet-600',
          iconBg: 'bg-violet-100 text-violet-600'
        };
      case 'green':
        return {
          active: 'bg-green-600',
          hover: 'hover:text-green-600',
          iconBg: 'bg-green-100 text-green-600'
        };
      case 'pink':
        return {
          active: 'bg-pink-600',
          hover: 'hover:text-pink-600',
          iconBg: 'bg-pink-100 text-pink-600'
        };
      case 'indigo':
        return {
          active: 'bg-indigo-600',
          hover: 'hover:text-indigo-600',
          iconBg: 'bg-indigo-100 text-indigo-600'
        };
      case 'cyan':
        return {
          active: 'bg-cyan-600',
          hover: 'hover:text-cyan-600',
          iconBg: 'bg-cyan-100 text-cyan-600'
        };
      case 'amber':
        return {
          active: 'bg-amber-600',
          hover: 'hover:text-amber-600',
          iconBg: 'bg-amber-100 text-amber-600'
        };
      case 'red':
        return {
          active: 'bg-red-600',
          hover: 'hover:text-red-600',
          iconBg: 'bg-red-100 text-red-600'
        };
      case 'orange':
        return {
          active: 'bg-orange-600',
          hover: 'hover:text-orange-600',
          iconBg: 'bg-orange-100 text-orange-600'
        };
      default:
        return {
          active: 'bg-gray-600',
          hover: 'hover:text-gray-600',
          iconBg: 'bg-gray-100 text-gray-600'
        };
    }
  };

  // Add function to navigate and close sidebar on mobile
  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
    // Check if this is a mobile device (based on window width or user agent)
    const isMobile = window.innerWidth < 768;
    
    // If we're on mobile, close the sidebar
    if (isMobile && sidebarOpen) {
      e.preventDefault(); // Prevent default navigation
      toggleSidebar(); // Close the sidebar
      
      // Use a short timeout to ensure the sidebar animation plays before navigating
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={handleToggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:shadow-none`}
      >
        {/* Logo and close button */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <Link href={ROUTES.home} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Logo />
              <span className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">Content AI Agent</span>
            </Link>
          </div>
          
          <button
            type="button"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 md:hidden"
            onClick={handleToggleSidebar}
          >
            <span className="sr-only">Close sidebar</span>
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Navigation menu */}
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto p-4">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const colorClasses = getColorClasses(item.color, isActive);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                    isActive
                      ? `${colorClasses.active} text-white`
                      : `text-gray-500 hover:bg-gray-100 ${colorClasses.hover}`
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isActive ? 'bg-white/20' : colorClasses.iconBg
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar; 