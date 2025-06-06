'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useAuth } from '@/components/AuthProvider';
import { ROUTES } from '@/lib/config';
import { Image as ImageIcon, Bot, Wand2, ArrowRight, TrendingUp, BarChart2 } from 'lucide-react';

export function WelcomeModal() {
  const { showWelcomeModal, markUserOnboarded, user } = useAuth();
  const [canDismiss, setCanDismiss] = useState(false);
  
  // Make the modal non-dismissable for 5 seconds
  useEffect(() => {
    if (showWelcomeModal) {
      setCanDismiss(false);
      const timer = setTimeout(() => {
        setCanDismiss(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showWelcomeModal]);

  const features = [
    {
      title: 'Create Custom Model',
      description: 'Create AI-generated images of yourself in various styles and scenarios.',
      icon: <ImageIcon className="h-6 w-6 text-blue-600" />,
      link: ROUTES.models,
      cta: 'Get Started',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Analyze Your Post',
      description: 'Get insights and optimization tips to improve your social media content.',
      icon: <BarChart2 className="h-6 w-6 text-purple-600" />,
      link: ROUTES.uploadPost,
      cta: 'Analyze Content',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Track Social Trends',
      description: 'Monitor what\'s performing well and stay ahead of trending topics.',
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      link: ROUTES.dashboard,
      cta: 'View Trends',
      iconBg: 'bg-green-100',
    }
  ];

  const handleClose = () => {
    console.log('WelcomeModal: handleClose triggered');
    markUserOnboarded();
  };

  const displayName = user?.user_metadata?.full_name || user?.email || 'there';

  return (
    <Dialog open={showWelcomeModal} onOpenChange={(open) => !open && canDismiss && handleClose()}> 
      <DialogContent 
        className="sm:max-w-2xl p-8 md:p-10" 
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
          <DialogTitle className="text-3xl font-bold">Welcome to Your Content AI Agent, {displayName}!</DialogTitle>
          <DialogDescription className="text-lg text-gray-500 mt-1">
            You're all set up! Here's what creators are doing on The Way:
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-full ${feature.iconBg} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-500 mb-5 text-sm flex-grow">{feature.description}</p>
              <Button 
                asChild 
                size="sm"
                className="w-full mt-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300 shadow hover:shadow-md group-hover:opacity-95"
              >
                <Link 
                  href={feature.link} 
                  className="flex items-center justify-center whitespace-nowrap w-full"
                  onClick={handleClose}
                >
                  {feature.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {canDismiss ? (
        <DialogFooter className="mt-6 justify-center">
          <Button 
            variant="link" 
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline px-4 py-2"
          >
            Skip for now & Go to Dashboard
          </Button>
        </DialogFooter>
        ) : (
          <div className="mt-6 text-center text-sm text-gray-500">
            Please take a moment to explore your options...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 