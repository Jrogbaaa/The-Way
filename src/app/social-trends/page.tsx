'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, LineChart, BarChart2, ArrowUp, Users, Eye, MessageSquare, LogIn } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import { useAuth } from '@/components/AuthProvider';

// Demo trending data for unauthenticated users
const TRENDING_TOPICS = [
  { name: 'Sustainable Fashion', growth: '+42%', category: 'Fashion' },
  { name: 'Mindful Living', growth: '+38%', category: 'Lifestyle' },
  { name: 'Plant-Based Recipes', growth: '+35%', category: 'Food' },
  { name: 'Home Office Design', growth: '+29%', category: 'Interior' },
  { name: 'No-Code Development', growth: '+27%', category: 'Technology' },
];

const TRENDING_HASHTAGS = [
  { tag: '#sustainablefashion', posts: '2.4M', growth: '+18%' },
  { tag: '#mentalhealthawareness', posts: '1.9M', growth: '+24%' },
  { tag: '#nofilter', posts: '144M', growth: '+5%' },
  { tag: '#workfromhome', posts: '12.8M', growth: '+15%' },
  { tag: '#plantbased', posts: '38.2M', growth: '+21%' },
];

const CONTENT_FORMATS = [
  { format: 'Short-form Video', engagement: 'High', growth: '+46%' },
  { format: 'Carousel Posts', engagement: 'High', growth: '+37%' },
  { format: 'Stories', engagement: 'Medium', growth: '+22%' },
  { format: 'Live Streaming', engagement: 'Medium', growth: '+19%' },
  { format: 'Static Posts', engagement: 'Low', growth: '-3%' },
];

export default function SocialTrendsPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Show login prompt after 30 seconds of browsing
  React.useEffect(() => {
    if (!isAuthenticated) {
      const timer = setTimeout(() => {
        setShowLoginPrompt(true);
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          <h1 className="text-3xl md:text-4xl font-bold">Social Media Trends Dashboard</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
          Explore current social media trends to optimize your content strategy and boost engagement.
        </p>
        <div className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-3 py-1 rounded-full text-sm">
          Demo Version - Limited Data Available
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Trending Topics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-purple-600" />
              Trending Topics
            </CardTitle>
            <CardDescription>
              Content themes gaining traction across platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TRENDING_TOPICS.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{topic.name}</p>
                    <p className="text-sm text-gray-500">{topic.category}</p>
                  </div>
                  <div className="text-green-600 font-semibold flex items-center">
                    {topic.growth} <ArrowUp className="ml-1 h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Hashtags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              Popular Hashtags
            </CardTitle>
            <CardDescription>
              Most-used hashtags with growing engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TRENDING_HASHTAGS.map((hashtag, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{hashtag.tag}</p>
                    <p className="text-sm text-gray-500">{hashtag.posts} posts</p>
                  </div>
                  <div className="text-green-600 font-semibold flex items-center">
                    {hashtag.growth} <ArrowUp className="ml-1 h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Format Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Content Format Performance
            </CardTitle>
            <CardDescription>
              Which content types are driving the most engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {CONTENT_FORMATS.map((format, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{format.format}</p>
                    <p className="text-sm text-gray-500">Engagement: {format.engagement}</p>
                  </div>
                  <div className={`font-semibold flex items-center ${format.growth.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                    {format.growth} {format.growth.startsWith('+') ? <ArrowUp className="ml-1 h-4 w-4" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Platform Demographics
            </CardTitle>
            <CardDescription>
              User demographics across major platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Instagram</span>
                  <span>18-34 age group</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>TikTok</span>
                  <span>16-24 age group</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>LinkedIn</span>
                  <span>25-45 age group</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Facebook</span>
                  <span>35-55 age group</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-700 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Posting Times */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              Optimal Posting Times
            </CardTitle>
            <CardDescription>
              When to post for maximum engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">Instagram</p>
                <p className="text-gray-600">11 AM - 1 PM, 7 PM - 9 PM</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">TikTok</p>
                <p className="text-gray-600">9 AM - 11 AM, 7 PM - 11 PM</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">LinkedIn</p>
                <p className="text-gray-600">8 AM - 10 AM, 4 PM - 6 PM</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Pinterest</p>
                <p className="text-gray-600">8 PM - 11 PM</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Twitter</p>
                <p className="text-gray-600">8 AM - 10 AM, 6 PM - 8 PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projected Growth */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Content Growth Projections
            </CardTitle>
            <CardDescription>
              Expected growth areas in next quarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>AI-Generated Content</span>
                  <span className="text-green-600">+82%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Video Content</span>
                  <span className="text-green-600">+65%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>AR Experiences</span>
                  <span className="text-green-600">+58%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Interactive Posts</span>
                  <span className="text-green-600">+47%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full" style={{ width: '47%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login CTA for unauthenticated users */}
      {!isAuthenticated && showLoginPrompt && (
        <div className="mt-8 mb-6 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-3">
            Want to see more detailed trends?
          </h3>
          <p className="text-indigo-700 dark:text-indigo-300 mb-4">
            Sign in to access real-time trends, personalized insights, and advanced analytics tailored to your audience and content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600">
              <Link href={ROUTES.signup}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign Up Free
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.login}>
                Already have an account? Sign In
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 mt-12 pb-8">
        <p>Data is based on social media trends analysis from Q2 2023.</p>
        <p>Sign in for real-time trends and personalized insights.</p>
      </div>
    </div>
  );
} 