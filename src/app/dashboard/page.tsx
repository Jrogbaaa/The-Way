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
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState(false);
  const router = useRouter();

  // Switch suggestions every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSuggestion(prev => (prev + 1) % suggestedActions.length);
        setFadeIn(true);
        setExpandedSuggestion(false);
      }, 500);
    }, 10000);
    
    setFadeIn(true);
    
    return () => clearInterval(interval);
  }, []);

  // Simulate stats loading for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
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

  // Stat card with animation
  const StatCard = ({ title, value, icon, trendValue, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trendValue?: number;
    color: string;
  }) => (
    <div 
      className={`relative overflow-hidden rounded-xl shadow-sm border border-${color}-100 bg-white p-6 transition-all duration-500 hover:shadow-md transform hover:-translate-y-1 opacity-0 animate-fade-in`}
      style={{
        animationDelay: '0.2s',
        animationFillMode: 'forwards'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 
            className={`mt-2 text-3xl font-bold text-${color}-600 transition-all duration-500`}
            style={{
              opacity: statsLoaded ? 1 : 0,
              transform: statsLoaded ? 'scale(1)' : 'scale(0.8)'
            }}
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
          <div
            className="opacity-0 animate-slide-in"
            style={{
              animationDelay: '0.1s',
              animationFillMode: 'forwards'
            }}
          >
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your content overview</p>
          </div>
          
          <div 
            className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center opacity-0 animate-slide-in"
            style={{
              animationDelay: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <Bell className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">3 new notifications</span>
          </div>
        </div>
        
        {/* AI Assistant Suggestion */}
        <div
          className={`rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white overflow-hidden transition-opacity duration-500 ease-in-out ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-3" />
              <p className="font-medium">AI Suggestion: {suggestedActions[currentSuggestion].title}</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setExpandedSuggestion(!expandedSuggestion)}
                className="px-3 py-1 rounded-full bg-white/20 text-sm hover:bg-white/30 transition-colors"
              >
                {expandedSuggestion ? 'Hide Options' : 'Show Options'}
              </button>
              <Link
                href={suggestedActions[currentSuggestion].route}
                className="px-3 py-1 rounded-full bg-white/20 text-sm hover:bg-white/30 transition-colors"
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
                    className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
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
        
        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Posts" 
            value={42} 
            icon={<Calendar className="h-6 w-6 text-blue-600" />}
            trendValue={12}
            color="blue"
          />
          <StatCard 
            title="Published Posts" 
            value={38} 
            icon={<Image className="h-6 w-6 text-violet-600" />}
            trendValue={8}
            color="violet"
          />
          <StatCard 
            title="Engagement Rate" 
            value="24%" 
            icon={<TrendingUp className="h-6 w-6 text-pink-600" />}
            trendValue={-3}
            color="pink"
          />
          <StatCard 
            title="AI Analyses" 
            value={56} 
            icon={<BarChart2 className="h-6 w-6 text-amber-600" />}
            trendValue={22}
            color="amber"
          />
        </div>
        
        {/* Content Calendar */}
        <div 
          className="opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.4s',
            animationFillMode: 'forwards'
          }}
        >
          <ContentCalendar />
        </div>
        
        {/* Action Items */}
        <div 
          className="opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.45s',
            animationFillMode: 'forwards'
          }}
        >
          <ActionItems />
        </div>
        
        {/* AB Testing Content Suggestions */}
        <div 
          className="opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.5s',
            animationFillMode: 'forwards'
          }}
        >
          <ABTestingContentSuggestions />
        </div>
        
        {/* Social Media Trends */}
        <div 
          className="opacity-0 animate-fade-in"
          style={{
            animationDelay: '0.5s',
            animationFillMode: 'forwards'
          }}
        >
          <SocialMediaTrends />
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md">
          <div className="p-6 border-b flex justify-between items-center">
            <div className="flex items-center">
              <Activity className="h-5 w-5 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold">Recent Activity</h2>
            </div>
            <Tooltip content="View all activity history">
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors flex items-center">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </Tooltip>
          </div>
          <div>
            {recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 transition-all duration-300 cursor-pointer opacity-0 animate-fade-in"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex items-center">
                  <div className="mr-4 p-2 rounded-full bg-gray-100">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium">{activity.title}</h3>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.timeText}
                    </div>
                  </div>
                </div>
                <StatusBadge status={activity.status} />
              </div>
            ))}
          </div>
        </div>
        
        {/* Achievements & Goals section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <Award className="h-5 w-5 text-amber-500 mr-2" />
                Your Content Goals
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Content Goal (5/7)</span>
                  <span className="text-sm text-gray-500">71%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-in-out" 
                    style={{ width: statsLoaded ? '71%' : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Engagement Growth (Monthly)</span>
                  <span className="text-sm text-gray-500">42%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-in-out"
                    style={{ width: statsLoaded ? '42%' : '0%', transitionDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">AI Optimization Usage</span>
                  <span className="text-sm text-gray-500">85%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000 ease-in-out"
                    style={{ width: statsLoaded ? '85%' : '0%', transitionDelay: '0.4s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center">
                <MessageCircle className="h-5 w-5 text-green-500 mr-2" />
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <button className="w-full p-3 rounded-xl flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 transition-all duration-300 hover:shadow-md hover:translate-x-1">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-indigo-100 mr-3">
                    <Image className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-medium text-sm">Create New Post</span>
                </div>
                <ChevronRight className="h-4 w-4 text-indigo-400" />
              </button>
              
              <button className="w-full p-3 rounded-xl flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 transition-all duration-300 hover:shadow-md hover:translate-x-1">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-100 mr-3">
                    <BarChart2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium text-sm">Analyze Content</span>
                </div>
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </button>
              
              <button className="w-full p-3 rounded-xl flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 transition-all duration-300 hover:shadow-md hover:translate-x-1">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 mr-3">
                    <Settings className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-sm">Train Custom Model</span>
                </div>
                <ChevronRight className="h-4 w-4 text-green-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-in-out;
        }
      `}</style>
    </MainLayout>
  );
} 