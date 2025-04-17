'use client';

import { useState, useEffect } from 'react';
import { Activity, Image, FileText, BarChart2, Clock, Zap, Award, TrendingUp, 
  MessageCircle, Bell, Calendar, ArrowUp, Settings, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Tooltip } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/config';
import Link from 'next/link';
import ContentCalendar from '@/components/ContentCalendar';
import SocialMediaTrends from '@/components/SocialMediaTrends';
import ActionItems from '@/components/ActionItems';
import ABTestingContentSuggestions from '@/components/ABTestingContentSuggestions';

// Mark page as dynamic to prevent static generation during build
export const dynamic = 'force-dynamic';

// Activity type definition
type ActivityItem = {
  id: string;
  title: string;
  type: 'image' | 'analysis' | 'training' | 'draft';
  timestamp: string;
  timeText: string;
  status: 'published' | 'completed' | 'in progress' | 'draft';
};

// Mock data for activities
const recentActivities: ActivityItem[] = [
  {
    id: '1',
    title: 'Beach sunset photo',
    type: 'image',
    timestamp: new Date().toISOString(),
    timeText: 'Just now',
    status: 'published'
  },
  {
    id: '2',
    title: 'Product showcase analysis',
    type: 'analysis',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    timeText: '2 hours ago',
    status: 'completed'
  },
  {
    id: '3',
    title: 'Custom model training',
    type: 'training',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    timeText: 'Yesterday',
    status: 'in progress'
  },
  {
    id: '4',
    title: 'City skyline at night',
    type: 'image',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    timeText: '2 days ago',
    status: 'draft'
  },
  {
    id: '5',
    title: 'Portrait photo analysis',
    type: 'analysis',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    timeText: '3 days ago',
    status: 'completed'
  }
];

// Suggested actions based on user data
const suggestedActions = [
  {
    id: 'sug1',
    title: "Try generating images with different styles",
    options: [
      "Create minimalist product photos with neutral backgrounds",
      "Try lifestyle shots featuring your products in real settings",
      "Generate abstract art that represents your brand values"
    ],
    route: ROUTES.models
  },
  {
    id: 'sug2',
    title: "Analyze your top-performing content",
    options: [
      "Compare engagement metrics across different content types",
      "Identify patterns in your most successful posts",
      "See which hashtags drive the most reach"
    ],
    route: ROUTES.uploadPost
  },
  {
    id: 'sug3',
    title: "Create video content from your images",
    options: [
      "Turn product photos into animated showcases",
      "Create slideshow stories from multiple images",
      "Add motion effects to static photos for more engagement"
    ],
    route: ROUTES.imageToVideo
  }
];

export default function Dashboard() {
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [expandedSuggestion, setExpandedSuggestion] = useState(false);
  const router = useRouter();

  // Switch suggestions every 10 seconds with smoother transitions
  useEffect(() => {
    const interval = setInterval(() => {
      // Use a smoother approach to switch suggestions
      setCurrentSuggestion(prev => (prev + 1) % suggestedActions.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Activity icon component
  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'analysis':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'training':
        return <BarChart2 className="h-5 w-5 text-green-500" />;
      case 'draft':
        return <Image className="h-5 w-5 text-gray-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ActivityItem['status'] }) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
            Published
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
            Completed
          </span>
        );
      case 'in progress':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
            In progress
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  // Stat card without animation
  const StatCard = ({ title, value, icon, trendValue, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trendValue?: number;
    color: string;
  }) => (
    <div 
      className={`relative overflow-hidden rounded-xl shadow-sm border border-${color}-100 bg-white p-6 hover:shadow-md transform hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 
            className={`mt-2 text-3xl font-bold text-${color}-600`}
          >
            {value}
          </h3>
          
          {trendValue && (
            <div className="mt-2 flex items-center text-xs font-medium">
              <span className={`mr-1 flex items-center text-${trendValue > 0 ? 'green' : 'red'}-500`}>
                <ArrowUp 
                  className={`h-3 w-3 ${trendValue > 0 ? '' : 'rotate-180'}`} 
                />
                {Math.abs(trendValue)}%
              </span>
              <span className="text-gray-500">vs. last week</span>
            </div>
          )}
        </div>
        
        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-${color}-100`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-${color}-400 to-${color}-600`}></div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Dashboard header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Action Items</h1>
            <p className="text-gray-600 mt-1">Review your AI-suggested tasks and content plan</p>
          </div>
          
          <div className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">3 new notifications</span>
          </div>
        </div>
        
        {/* AI Assistant Suggestion */}
        <div
          className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white overflow-hidden"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3" />
              <p className="font-medium">AI Suggestion: {suggestedActions[currentSuggestion].title}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setExpandedSuggestion(!expandedSuggestion)}
                className="px-3 py-1 rounded-full bg-white/20 text-sm hover:bg-white/30"
              >
                {expandedSuggestion ? 'Hide Options' : 'Show Options'}
              </button>
              <Link
                href={suggestedActions[currentSuggestion].route}
                className="px-3 py-1 rounded-full bg-white/20 text-sm hover:bg-white/30"
              >
                Get Started
              </Link>
            </div>
          </div>
          
          {/* Expanded options */}
          {expandedSuggestion && (
            <div className="bg-indigo-900/20 p-4 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedActions[currentSuggestion].options.map((option, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white/10 p-3 rounded-lg hover:bg-white/20 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm">{option}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Main content area - Changed from grid to stacked column */}
        <div className="space-y-8"> 
          {/* 1. Action Items */}
          <div>
            <ActionItems />
          </div>
          
          {/* 2. Content Suggestions */}
          <div>
            <ABTestingContentSuggestions />
          </div>
          
          {/* 3. Content Calendar */}
          <div>
            <ContentCalendar />
          </div>
          
          {/* 4. Social Media Trends */}
          <div>
            <SocialMediaTrends />
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 