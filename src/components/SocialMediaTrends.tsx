'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Instagram, Twitter, Video, Filter, Search, Loader2, RefreshCw } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// Types for trend data
type TrendItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  category: string;
  platforms: string[];
  contentTypes: string[];
  discoveredAt: Date;
  relevanceScore: number;
  expiresAt: Date;
  implementationOptions?: ImplementationOption[];
};

type ImplementationOption = {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: number; // 1-10
  timeToImplement: string;
};

// Platform icons mapping
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className="h-4 w-4 text-pink-500" />;
    case 'twitter':
    case 'x':
      return <Twitter className="h-4 w-4 text-blue-400" />;
    case 'tiktok':
      return <Video className="h-4 w-4 text-teal-500" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-500" />;
  }
};

// Category pill styling
const getCategoryColor = (category: string): string => {
  const categories: Record<string, string> = {
    instagram: 'bg-pink-100 text-pink-800',
    tiktok: 'bg-teal-100 text-teal-800',
    engagement: 'bg-purple-100 text-purple-800',
    timing: 'bg-blue-100 text-blue-800',
    collaboration: 'bg-amber-100 text-amber-800',
    statistics: 'bg-green-100 text-green-800',
    marketing: 'bg-indigo-100 text-indigo-800'
  };
  
  return categories[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

type SocialMediaTrendsProps = {
  limit?: number;
  filter?: string;
  showFilters?: boolean;
  className?: string;
};

const SocialMediaTrends = ({ 
  limit = 5,
  filter = '',
  showFilters = true,
  className = ''
}: SocialMediaTrendsProps) => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // Manual test trends function
  const handleTestTrends = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/trends/manual-refresh', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Web scraping result:', result);
        
        const message = result.realDataFound > 0 
          ? `🌐 Real web scraping successful! Found ${result.realDataFound} live trends from ${result.scrapedSources} sources.`
          : `📊 Scraping attempted from ${result.scrapedSources} sources. Using ${result.trendsFound} realistic examples.`;
          
        alert(message);
        // Refresh trends after scraping
        window.location.reload();
      } else {
        const error = await response.json();
        console.error('❌ Web scraping error:', error);
        alert(`❌ Web scraping failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Trend test network error:', error);
      alert(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  // Fetch trends data
  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        // Fetch from the real API
        const response = await fetch(`/api/trends?${new URLSearchParams({
          ...(activeFilter ? { category: activeFilter } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          limit: limit.toString()
        })}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Raw API response:', data);
          
          if (data && data.trends && Array.isArray(data.trends) && data.trends.length > 0) {
            // Map API data to our TrendItem format
            const apiTrends = data.trends.map((trend: any) => ({
              id: trend.id,
              title: trend.title,
              summary: trend.summary,
              source: trend.source,
              sourceUrl: trend.source_url,
              category: trend.category,
              platforms: trend.platforms || [],
              contentTypes: trend.content_types || [],
              discoveredAt: new Date(trend.discovered_at),
              relevanceScore: trend.relevance_score,
              expiresAt: new Date(trend.expires_at),
              implementationOptions: [] // API trends don't have implementation options yet
            }));
            
            setTrends(apiTrends);
            console.log(`✅ Loaded ${apiTrends.length} trends from API`);
            return; // Exit early if API data is available
          } else {
            console.log('📝 API returned no trends data');
          }
        } else {
          console.log('❌ API request failed:', response.status, response.statusText);
        }
        
        // No data available - show empty state
        setTrends([]);
        console.log('📝 No trends data available');
        
      } catch (error) {
        console.error('❌ Error fetching trends:', error);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrends();
  }, [limit, activeFilter, searchQuery]);
  
  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };
  
  // Get difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-amber-100 text-amber-800',
      hard: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[difficulty as keyof typeof styles]}`}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
      </span>
    );
  };
  
  // Format impact score with color
  const getImpactScore = (score: number) => {
    let color = 'gray';
    
    if (score >= 9) color = 'green';
    else if (score >= 7) color = 'blue';
    else if (score >= 5) color = 'amber';
    else color = 'red';
    
    return (
      <span className={`text-xs font-medium text-${color}-600`}>
        Impact: {score}/10
      </span>
    );
  };
  
  // Toggle expanded trend
  const toggleExpandTrend = (trendId: string) => {
    setExpandedTrend(prev => prev === trendId ? null : trendId);
  };
  
  // Check if trend has implementation options
  const hasTrendOptions = (trend: TrendItem) => {
    return trend.implementationOptions && trend.implementationOptions.length > 0;
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md ${className}`}>
      <div className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
          <h2 className="text-xl font-semibold">Social Media Trends</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestTrends}
            disabled={isTesting}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Scrape Real Trends
              </>
            )}
          </button>
          <Tooltip content="Trends updated weekly from industry sources">
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              Weekly Updates
            </div>
          </Tooltip>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <button
                onClick={() => setActiveFilter('')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === '' 
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                tabIndex={0}
                aria-label="Show all trends"
              >
                All Trends
              </button>
              
              <button
                onClick={() => setActiveFilter('instagram')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  activeFilter === 'instagram' 
                    ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                tabIndex={0}
                aria-label="Filter by Instagram trends"
              >
                <Instagram className="h-3.5 w-3.5 mr-1" />
                Instagram
              </button>
              
              <button
                onClick={() => setActiveFilter('tiktok')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center ${
                  activeFilter === 'tiktok' 
                    ? 'bg-teal-100 text-teal-700 border border-teal-200' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                tabIndex={0}
                aria-label="Filter by TikTok trends"
              >
                <Video className="h-3.5 w-3.5 mr-1" />
                TikTok
              </button>
              
              <button
                onClick={() => setActiveFilter('engagement')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === 'engagement' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
                tabIndex={0}
                aria-label="Filter by engagement trends"
              >
                Engagement
              </button>
            </div>
            
            <div className="relative sm:ml-auto">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search trends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Trend list */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-gray-200 h-10 w-10 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : trends.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900">No trends found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeFilter ? `No trends for ${activeFilter} category` : 'Check back soon for the latest trends'}
            </p>
          </div>
        ) : (
          trends.map(trend => (
            <div key={trend.id} className="p-5 hover:bg-gray-50 transition-colors">
              <div 
                className="cursor-pointer"
                onClick={() => toggleExpandTrend(trend.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-base font-medium text-gray-900">{trend.title}</h3>
                      {hasTrendOptions(trend) && (
                        <div className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                          {trend.implementationOptions?.length} options
                        </div>
                      )}
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">{trend.summary}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(trend.category)}`}>
                        {trend.category.charAt(0).toUpperCase() + trend.category.slice(1)}
                      </span>
                      
                      {trend.platforms.map(platform => (
                        <div key={platform} className="flex items-center px-2 py-1 bg-gray-100 rounded-full text-xs">
                          <PlatformIcon platform={platform} />
                          <span className="ml-1 capitalize">{platform}</span>
                        </div>
                      ))}
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatRelativeTime(trend.discoveredAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-end">
                    <div className="flex items-center bg-indigo-50 rounded-full px-2 py-1">
                      <TrendingUp className={`h-3 w-3 ${trend.relevanceScore >= 8 ? 'text-green-500' : 'text-gray-500'}`} />
                      <span className="ml-1 text-xs font-medium">{trend.relevanceScore}/10</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Implementation options - displayed when expanded */}
              {expandedTrend === trend.id && hasTrendOptions(trend) && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Implementation Options:</h4>
                  <div className="space-y-3">
                    {trend.implementationOptions?.map(option => (
                      <div 
                        key={option.id} 
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-medium">{option.title}</h5>
                          <div className="flex items-center space-x-2">
                            {getDifficultyBadge(option.difficulty)}
                            <span className="text-xs text-gray-500">{option.timeToImplement}</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">{option.description}</p>
                        <div className="mt-2 flex justify-between items-center">
                          {getImpactScore(option.estimatedImpact)}
                          <button className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded transition-colors">
                            Choose this approach
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <button 
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                      onClick={() => setExpandedTrend(null)}
                    >
                      Hide options
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocialMediaTrends; 