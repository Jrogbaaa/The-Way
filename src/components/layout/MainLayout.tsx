'use client';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useUIStore } from '@/lib/store';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showSidebar = true,
}) => {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex flex-1">
        {showSidebar && <Sidebar />}
        <main
          className={`flex-1 overflow-x-hidden p-4 pt-6 transition-all duration-300 md:p-6 md:pt-6 ${
            showSidebar ? 'md:ml-64' : ''
          }`}
        >
          {children}
        </main>
      </div>
      <div
        className={`fixed inset-0 z-40 bg-gray-900/60 transition-opacity md:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
        aria-hidden="true"
      />
    </div>
  );
};

export default MainLayout; 