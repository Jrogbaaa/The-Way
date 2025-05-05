'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config';
import { Image as ImageIcon, BarChart2, TrendingUp, ArrowRight, X } from 'lucide-react';

interface FirstTimeVisitorModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  forceOpen?: boolean;
}

export function FirstTimeVisitorModal({ 
  isOpen: externalIsOpen, 
  onOpenChange, 
  forceOpen = false 
}: FirstTimeVisitorModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [canDismiss, setCanDismiss] = useState(false);
  
  // Determine if modal should be open based on props or internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  // Function to update open state that respects both internal and external control
  const updateOpenState = (open: boolean) => {
    setInternalIsOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  
  useEffect(() => {
    // Only check first visit if not being controlled externally and not forced open
    if (externalIsOpen === undefined && !forceOpen) {
      const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
      if (!hasVisitedBefore) {
        updateOpenState(true);
        // Mark as visited
        localStorage.setItem('hasVisitedBefore', 'true');
      }
    }
    
    // Always apply non-dismissible timer when opening
    if (isOpen) {
      setCanDismiss(false);
      const timer = setTimeout(() => {
        setCanDismiss(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [externalIsOpen, forceOpen, isOpen]);

  const handleFeatureSelect = (route: string) => {
    updateOpenState(false);
    router.push(route);
  };

  const features = [
    {
      title: 'Create AI Images of You',
      description: 'Create AI images of yourself in various styles and scenarios.',
      icon: <ImageIcon className="h-6 w-6 text-blue-600" />,
      route: '/models?create=true',
      cta: 'Create Now',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'See What Works on Instagram',
      description: 'See what works on Instagram and get tips to improve engagement.',
      icon: <BarChart2 className="h-6 w-6 text-purple-600" />,
      route: ROUTES.socialAnalyzer,
      cta: 'Try It Now',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Track Social Trends',
      description: "See what's trending and performing well across social platforms.",
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      route: ROUTES.socialTrends,
      cta: 'View Trends',
      iconBg: 'bg-green-100',
    }
  ];

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (canDismiss || !open) updateOpenState(open);
      }}
    >
      <DialogContent 
        className="sm:max-w-2xl p-8 md:p-10 bg-gradient-to-br from-indigo-600 to-purple-700 border-0"
        onInteractOutside={(e) => {
          if (!canDismiss) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canDismiss) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold text-white">Welcome to OptimalPost.ai!</DialogTitle>
          <DialogDescription className="text-lg text-indigo-100 mt-2">
            Try any of our tools without signing up - experience the value first!
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white/20 backdrop-blur-sm p-6 rounded-lg border border-white/30 hover:border-white/50 hover:bg-white/25 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-full bg-white/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
              <p className="text-white mb-5 text-sm flex-grow">{feature.description}</p>
              <Button 
                onClick={() => handleFeatureSelect(feature.route)}
                size="sm"
                className="w-full mt-auto bg-white hover:bg-gray-100 text-indigo-700 font-medium transition-all duration-300 shadow hover:shadow-md whitespace-nowrap"
              >
                {feature.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {canDismiss ? (
          <DialogFooter className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => updateOpenState(false)}
              className="text-sm text-white hover:text-white border-white/30 hover:bg-white/10"
            >
              <X className="mr-1 h-4 w-4" /> Close and Browse
            </Button>
          </DialogFooter>
        ) : (
          <div className="mt-6 text-center text-sm text-indigo-100/80">
            Please take a moment to explore your options...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 