'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false); 
    }
  };
  
  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout} 
      disabled={isLoading}
      className="w-full justify-start"
      aria-label="Sign out"
      tabIndex={0}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
} 