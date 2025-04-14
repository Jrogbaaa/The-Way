'use client';

import { useState } from 'react';
import { 
  LineChart, 
  CheckCircle, 
  ThumbsUp, 
  Copy, 
  TrendingUp, 
  Users, 
  Image as ImageIcon,
  MessageSquare,
  BarChart,
  ArrowRight
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// Types
type ContentSuggestionType = 'image' | 'text' | 'video' | 'carousel';
type TargetPlatform = 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'linkedin';

interface ContentSuggestion {
  id: string;
  type: ContentSuggestionType;
  title: string;
  description: string;
  caption?: string;
  hashtags?: string[];
  predictedEngagement: number; // 0-100
  targetPlatforms: TargetPlatform[];
  imageUrl?: string;
  trend?: string;
}

interface SuggestionGroup {
  id: string;
  title: string;
  description: string;
  goal: string;
  targetPlatform: TargetPlatform;
  suggestions: ContentSuggestion[];
}

// Mock data for content suggestions
const mockSuggestionGroups: SuggestionGroup[] = [
  {
    id: 'group1',
    title: 'Product showcase',
    description: 'Content to highlight your new product line',
    goal: 'Increase product awareness',
    targetPlatform: 'instagram',
    suggestions: [
      {
        id: 'sug1',
        type: 'image',
        title: 'Clean product flat lay',
        description: 'Minimal product shot on neutral background with natural lighting',
        caption: 'Introducing our new collection — designed with sustainability in mind. Which color is your favorite? 💫 #sustainablefashion #newcollection',
        hashtags: ['sustainablefashion', 'newcollection', 'ecofriendly'],
        predictedEngagement: 87,
        targetPlatforms: ['instagram', 'facebook'],
        imageUrl: '/images/suggestions/product-flatlay.jpg',
        trend: 'Minimalist product photography'
      },
      {
        id: 'sug2',
        type: 'carousel',
        title: 'Product features carousel',
        description: 'Multiple images showcasing different product features and benefits',
        caption: 'Swipe to discover all the features that make our new collection special. Made from recycled materials, designed for durability. ♻️ #sustainablestyle',
        hashtags: ['sustainablestyle', 'ecofashion', 'recycledmaterials'],
        predictedEngagement: 82,
        targetPlatforms: ['instagram', 'facebook'],
        imageUrl: '/images/suggestions/product-carousel.jpg',
        trend: 'Educational carousels'
      },
      {
        id: 'sug3',
        type: 'video',
        title: 'Product lifestyle video',
        description: 'Short video showing the product in use in everyday situations',
        caption: 'See how our new collection fits seamlessly into your daily life. Comfort meets style meets sustainability. 🌿 #sustainableliving',
        hashtags: ['sustainableliving', 'ecofriendly', 'lifestylevideo'],
        predictedEngagement: 91,
        targetPlatforms: ['instagram', 'tiktok'],
        imageUrl: '/images/suggestions/product-lifestyle.jpg',
        trend: 'Day-in-the-life content'
      }
    ]
  },
  {
    id: 'group2',
    title: 'Audience engagement',
    description: 'Content to boost interaction with your followers',
    goal: 'Increase comment rate by 25%',
    targetPlatform: 'instagram',
    suggestions: [
      {
        id: 'sug4',
        type: 'text',
        title: 'Question prompt',
        description: 'Thought-provoking question to encourage comments and discussion',
        caption: 'If you could change one thing about the fashion industry, what would it be? 💭 Share your thoughts below! #fashionrevolution',
        hashtags: ['fashionrevolution', 'sustainablefashion', 'fashionfuture'],
        predictedEngagement: 78,
        targetPlatforms: ['instagram', 'twitter'],
        trend: 'Conversation starters'
      },
      {
        id: 'sug5',
        type: 'image',
        title: 'This or That poll',
        description: 'Visual comparison between two product options',
        caption: 'Black or white? Tap to vote for your favorite and tell us why in the comments! 👇 #thisorthat #fashionpoll',
        hashtags: ['thisorthat', 'fashionpoll', 'stylecheck'],
        predictedEngagement: 85,
        targetPlatforms: ['instagram', 'facebook'],
        imageUrl: '/images/suggestions/this-or-that.jpg',
        trend: 'Interactive polls'
      },
      {
        id: 'sug6',
        type: 'carousel',
        title: 'Hot take carousel',
        description: 'Series of slides with controversial opinions about your industry',
        caption: 'Hot takes about sustainable fashion that might ruffle some feathers. Do you agree with #3? 👀 Share your thoughts! #hottakes #sustainablefashion',
        hashtags: ['hottakes', 'sustainablefashion', 'unpopularopinion'],
        predictedEngagement: 89,
        targetPlatforms: ['instagram', 'linkedin'],
        imageUrl: '/images/suggestions/hot-takes.jpg',
        trend: 'Controversial statements'
      }
    ]
  }
];

// Prediction score element
const PredictionScore = ({ score }: { score: number }) => {
  let color = 'gray';
  
  if (score >= 90) color = 'green';
  else if (score >= 75) color = 'emerald';
  else if (score >= 60) color = 'blue';
  else if (score >= 45) color = 'amber';
  else color = 'red';
  
  return (
    <div className={`p-1.5 rounded-full bg-${color}-100 flex items-center space-x-1`}>
      <LineChart className={`h-3.5 w-3.5 text-${color}-500`} />
      <span className={`text-xs font-medium text-${color}-700`}>{score}%</span>
    </div>
  );
};

// Type badge
const TypeBadge = ({ type }: { type: ContentSuggestionType }) => {
  const config = {
    image: { text: 'Image', icon: <ImageIcon className="h-3 w-3 mr-1" />, color: 'blue' },
    text: { text: 'Text', icon: <MessageSquare className="h-3 w-3 mr-1" />, color: 'purple' },
    video: { text: 'Video', icon: <BarChart className="h-3 w-3 mr-1" />, color: 'pink' },
    carousel: { text: 'Carousel', icon: <Copy className="h-3 w-3 mr-1" />, color: 'indigo' }
  };
  
  const { text, icon, color } = config[type];
  
  return (
    <div className={`px-2 py-1 rounded-full bg-${color}-50 border border-${color}-100 flex items-center`}>
      {icon}
      <span className={`text-xs font-medium text-${color}-700`}>{text}</span>
    </div>
  );
};

// Platform icon
const PlatformIcon = ({ platform }: { platform: TargetPlatform }) => {
  const icons = {
    instagram: '/icons/instagram.svg',
    tiktok: '/icons/tiktok.svg',
    twitter: '/icons/twitter.svg',
    facebook: '/icons/facebook.svg',
    linkedin: '/icons/linkedin.svg'
  };
  
  return (
    <Tooltip content={platform.charAt(0).toUpperCase() + platform.slice(1)}>
      <div className="w-6 h-6 rounded-full bg-gray-100 p-1 flex items-center justify-center">
        <img 
          src={icons[platform]} 
          alt={platform} 
          className="w-4 h-4 object-contain" 
        />
      </div>
    </Tooltip>
  );
};

const ABTestingContentSuggestions = () => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [currentGroup, setCurrentGroup] = useState<string>(mockSuggestionGroups[0].id);
  
  // Get the current suggestion group
  const activeSuggestionGroup = mockSuggestionGroups.find(group => group.id === currentGroup) || mockSuggestionGroups[0];
  
  // Handle selecting a suggestion within a group
  const handleSelectSuggestion = (groupId: string, suggestionId: string) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [groupId]: suggestionId
    }));
  };
  
  // Handle switching between suggestion groups
  const handleChangeGroup = (groupId: string) => {
    setCurrentGroup(groupId);
  };
  
  // Check if a suggestion is selected
  const isSuggestionSelected = (groupId: string, suggestionId: string) => {
    return selectedSuggestions[groupId] === suggestionId;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-lg">Content Suggestions</h3>
          </div>
          
          <div className="flex space-x-1">
            {mockSuggestionGroups.map(group => (
              <button
                key={group.id}
                onClick={() => handleChangeGroup(group.id)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  currentGroup === group.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {group.title}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-2">
          <p className="text-sm text-gray-600">{activeSuggestionGroup.description}</p>
          <div className="mt-1 flex items-center">
            <div className="flex items-center text-xs text-indigo-600 font-medium">
              <Users className="h-3.5 w-3.5 mr-1" />
              Goal: {activeSuggestionGroup.goal}
            </div>
            <div className="mx-2 h-4 border-r border-gray-200"></div>
            <div className="flex items-center text-xs text-gray-500">
              <PlatformIcon platform={activeSuggestionGroup.targetPlatform} />
              <span className="ml-1 capitalize">{activeSuggestionGroup.targetPlatform}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeSuggestionGroup.suggestions.map(suggestion => (
          <div 
            key={suggestion.id}
            className={`relative rounded-lg border overflow-hidden transition-all duration-300 ${
              isSuggestionSelected(activeSuggestionGroup.id, suggestion.id)
                ? 'border-green-500 shadow-md shadow-green-100 ring-1 ring-green-500'
                : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
            }`}
          >
            {/* Image or placeholder */}
            <div className="aspect-video bg-gray-100 relative">
              {suggestion.imageUrl ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  {/* In real implementation, this would be an actual image */}
                  <div className="text-sm text-gray-500">Image Preview</div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <TypeBadge type={suggestion.type} />
                </div>
              )}
              
              {/* Prediction score overlay */}
              <div className="absolute top-2 right-2">
                <PredictionScore score={suggestion.predictedEngagement} />
              </div>
            </div>
            
            {/* Content details */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medium text-gray-900">{suggestion.title}</h4>
                <TypeBadge type={suggestion.type} />
              </div>
              
              <p className="mt-1 text-xs text-gray-600 line-clamp-2">{suggestion.description}</p>
              
              {suggestion.caption && (
                <div className="mt-3 bg-gray-50 p-2 rounded-md">
                  <p className="text-xs italic text-gray-600 line-clamp-3">"{suggestion.caption}"</p>
                </div>
              )}
              
              {suggestion.hashtags && suggestion.hashtags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestion.hashtags.map(tag => (
                    <span key={tag} className="text-xs text-indigo-600">#{tag}</span>
                  ))}
                </div>
              )}
              
              {suggestion.trend && (
                <div className="mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 text-pink-500 mr-1" />
                  <span className="text-xs text-pink-600">Trending: {suggestion.trend}</span>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-1.5">
                {suggestion.targetPlatforms.map(platform => (
                  <PlatformIcon key={platform} platform={platform} />
                ))}
              </div>
              
              <button
                onClick={() => handleSelectSuggestion(activeSuggestionGroup.id, suggestion.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center ${
                  isSuggestionSelected(activeSuggestionGroup.id, suggestion.id)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {isSuggestionSelected(activeSuggestionGroup.id, suggestion.id) ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Selected
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                    Choose This
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Suggestions are based on your content goals and audience analytics
        </div>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
          View all suggestions
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ABTestingContentSuggestions; 