'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '@/lib/store';
import { ROUTES, APP_NAME } from '@/lib/config';
import Logo from '@/components/ui/Logo';
import { 
    LayoutGrid, Sparkles, Clapperboard, Image, BarChart, 
    MessageSquare, GalleryVerticalEnd, User, Upload, MessageCircle, 
    Wand2,
    ListChecks,
    UploadCloud
} from 'lucide-react';

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
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      name: 'Action Items',
      href: ROUTES.dashboard,
      icon: <ListChecks className="h-5 w-5" />,
      label: 'View your action items',
      color: 'blue',
    },
    {
      name: 'Create Content',
      href: ROUTES.models || '/create',
      icon: <Wand2 className="h-5 w-5" />,
      label: 'Create images, videos, and edit photos',
      color: 'purple',
    },
    {
      name: 'Analyze a Post',
      href: ROUTES.uploadPost,
      icon: <UploadCloud className="h-5 w-5" />,
      label: 'Analyze a new post',
      color: 'green',
    },
    {
      name: 'My Expert Chat',
      href: ROUTES.chat,
      icon: <MessageCircle className="h-5 w-5" />,
      label: 'Chat with your AI expert',
      color: 'cyan',
    },
    {
      name: 'My Gallery',
      href: ROUTES.gallery,
      icon: <GalleryVerticalEnd className="h-5 w-5" />,
      label: 'Browse your content gallery',
      color: 'amber',
    },
    {
      name: 'Profile',
      href: ROUTES.profile,
      icon: <User className="h-5 w-5" />,
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
      case 'teal':
        return {
          active: 'bg-teal-600',
          hover: 'hover:text-teal-600',
          iconBg: 'bg-teal-100 text-teal-600'
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
    // Check if this is a mobile device
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    // If on mobile and sidebar is open, handle the navigation with animation
    if (isMobile && sidebarOpen) {
      e.preventDefault(); // Prevent default navigation
      
      // First close the sidebar
      toggleSidebar();
      
      // Then navigate after a short delay to allow the animation to play
      setTimeout(() => {
        // Force hide the sidebar element as a fallback for any state issues
        const sidebarElement = document.querySelector('aside.fixed.left-0');
        if (sidebarElement) {
          sidebarElement.classList.add('-translate-x-full');
          sidebarElement.classList.remove('translate-x-0');
        }
        
        // Remove backdrop if present
        const backdropElement = document.querySelector('div.fixed.inset-0.bg-black\\/30');
        if (backdropElement) {
          backdropElement.remove();
        }
        
        // Navigate to the new page
        router.push(href);
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
              <span className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">{APP_NAME}</span>
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