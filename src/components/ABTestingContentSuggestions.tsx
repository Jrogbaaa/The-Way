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
  ArrowRight,
  AlignLeft,
  Shuffle,
  Zap,
  BarChart2,
  ChevronDown,
  Maximize2,
  RefreshCw
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

// Prediction score element with improved visualization
const PredictionScore = ({ score, size = 'sm' }: { score: number, size?: 'sm' | 'lg' }) => {
  let color = 'gray';
  
  if (score >= 90) color = 'green';
  else if (score >= 75) color = 'emerald';
  else if (score >= 60) color = 'blue';
  else if (score >= 45) color = 'amber';
  else color = 'red';
  
  const isLarge = size === 'lg';
  
  return (
    <div className={`rounded-full bg-${color}-100 flex items-center ${isLarge ? 'p-2' : 'p-1.5'} gap-1`}>
      {isLarge && <Zap className={`h-4 w-4 text-${color}-500`} />}
      {!isLarge && <LineChart className={`h-3.5 w-3.5 text-${color}-500`} />}
      <span className={`font-medium text-${color}-700 ${isLarge ? 'text-sm' : 'text-xs'}`}>
        {score}% {isLarge && 'Predicted Engagement'}
      </span>
    </div>
  );
};

// Type badge
const TypeBadge = ({ type, size = 'sm' }: { type: ContentSuggestionType, size?: 'sm' | 'lg' }) => {
  const config = {
    image: { text: 'Image', icon: <ImageIcon className={size === 'lg' ? 'h-4 w-4 mr-1.5' : 'h-3 w-3 mr-1'} />, color: 'blue' },
    text: { text: 'Text', icon: <MessageSquare className={size === 'lg' ? 'h-4 w-4 mr-1.5' : 'h-3 w-3 mr-1'} />, color: 'purple' },
    video: { text: 'Video', icon: <BarChart className={size === 'lg' ? 'h-4 w-4 mr-1.5' : 'h-3 w-3 mr-1'} />, color: 'pink' },
    carousel: { text: 'Carousel', icon: <Copy className={size === 'lg' ? 'h-4 w-4 mr-1.5' : 'h-3 w-3 mr-1'} />, color: 'indigo' }
  };
  
  const { text, icon, color } = config[type];
  
  return (
    <div className={`px-2 py-1 rounded-full bg-${color}-50 border border-${color}-100 flex items-center`}>
      {icon}
      <span className={`font-medium text-${color}-700 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>{text}</span>
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

// Suggestion card component for reuse
const SuggestionCard = ({ 
  suggestion, 
  isSelected, 
  onSelect,
  showFullDetails = false
}: { 
  suggestion: ContentSuggestion; 
  isSelected: boolean; 
  onSelect: () => void;
  showFullDetails?: boolean;
}) => (
  <div 
    className={`relative rounded-lg border overflow-hidden transition-all duration-300 ${
      isSelected
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
          <TypeBadge type={suggestion.type} size={showFullDetails ? 'lg' : 'sm'} />
        </div>
      )}
      
      {/* Prediction score overlay */}
      <div className="absolute top-2 right-2">
        <PredictionScore score={suggestion.predictedEngagement} size={showFullDetails ? 'lg' : 'sm'} />
      </div>
    </div>
    
    {/* Content details */}
    <div className="p-4">
      <div className="flex items-start justify-between">
        <h4 className={`font-medium text-gray-900 ${showFullDetails ? 'text-base' : 'text-sm'}`}>{suggestion.title}</h4>
        {!showFullDetails && <TypeBadge type={suggestion.type} />}
      </div>
      
      <p className={`mt-1 text-gray-600 line-clamp-2 ${showFullDetails ? 'text-sm' : 'text-xs'}`}>{suggestion.description}</p>
      
      {suggestion.caption && (
        <div className={`mt-3 bg-gray-50 p-2 rounded-md ${showFullDetails ? 'mb-3' : ''}`}>
          <p className={`italic text-gray-600 ${showFullDetails ? 'text-sm' : 'text-xs line-clamp-3'}`}>"{suggestion.caption}"</p>
        </div>
      )}
      
      {suggestion.hashtags && suggestion.hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {suggestion.hashtags.map(tag => (
            <span key={tag} className={`text-indigo-600 ${showFullDetails ? 'text-sm' : 'text-xs'}`}>#{tag}</span>
          ))}
        </div>
      )}
      
      {suggestion.trend && (
        <div className="mt-2 flex items-center">
          <TrendingUp className={`text-pink-500 mr-1 ${showFullDetails ? 'h-4 w-4' : 'h-3 w-3'}`} />
          <span className={`text-pink-600 ${showFullDetails ? 'text-sm' : 'text-xs'}`}>Trending: {suggestion.trend}</span>
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
        onClick={onSelect}
        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center ${
          isSelected
            ? 'bg-green-100 text-green-700'
            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        }`}
      >
        {isSelected ? (
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
);

// Main component
const ABTestingContentSuggestions = () => {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
  const [currentGroup, setCurrentGroup] = useState<string>(mockSuggestionGroups[0].id);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [suggestionA, setSuggestionA] = useState<string | null>(null);
  const [suggestionB, setSuggestionB] = useState<string | null>(null);
  
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

  // Handle adding a suggestion to comparison
  const handleAddToComparison = (suggestionId: string) => {
    if (!suggestionA) {
      setSuggestionA(suggestionId);
    } else if (!suggestionB) {
      setSuggestionB(suggestionId);
      setComparisonMode(true);
    } else {
      // Replace the oldest selection
      setSuggestionA(suggestionB);
      setSuggestionB(suggestionId);
    }
  };

  // Reset comparison
  const handleResetComparison = () => {
    setSuggestionA(null);
    setSuggestionB(null);
    setComparisonMode(false);
  };

  // Toggle comparison mode
  const handleToggleComparisonMode = () => {
    if (comparisonMode) {
      setComparisonMode(false);
    } else {
      if (suggestionA && suggestionB) {
        setComparisonMode(true);
      }
    }
  };

  // Get suggestion by ID
  const getSuggestionById = (id: string) => {
    return activeSuggestionGroup.suggestions.find(s => s.id === id) || null;
  };

  const suggestionAObj = suggestionA ? getSuggestionById(suggestionA) : null;
  const suggestionBObj = suggestionB ? getSuggestionById(suggestionB) : null;

  // Randomly select suggestions for comparison
  const handleRandomComparison = () => {
    const suggestions = activeSuggestionGroup.suggestions;
    if (suggestions.length < 2) return;
    
    const randomIndexA = Math.floor(Math.random() * suggestions.length);
    let randomIndexB = Math.floor(Math.random() * suggestions.length);
    
    // Ensure we get two different suggestions
    while (randomIndexB === randomIndexA) {
      randomIndexB = Math.floor(Math.random() * suggestions.length);
    }
    
    setSuggestionA(suggestions[randomIndexA].id);
    setSuggestionB(suggestions[randomIndexB].id);
    setComparisonMode(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="font-semibold text-lg">Content Suggestions</h3>
          </div>
          
          <div className="flex space-x-3">
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

            <div className="border-l border-gray-200 pl-3 flex space-x-1">
              <Tooltip content={comparisonMode ? "Exit A/B comparison" : "Compare A/B options"}>
                <button 
                  onClick={handleToggleComparisonMode}
                  disabled={!suggestionA || !suggestionB}
                  className={`p-1.5 rounded-full transition-colors ${
                    comparisonMode 
                      ? 'bg-indigo-600 text-white' 
                      : suggestionA && suggestionB 
                        ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
              </Tooltip>
              
              <Tooltip content="Try random comparison">
                <button 
                  onClick={handleRandomComparison}
                  className="p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
              </Tooltip>
              
              {(suggestionA || suggestionB) && (
                <Tooltip content="Reset comparison">
                  <button 
                    onClick={handleResetComparison}
                    className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
            </div>
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
      
      {comparisonMode && suggestionAObj && suggestionBObj ? (
        // A/B Comparison View
        <div className="border-b border-gray-200">
          <div className="bg-indigo-50 p-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-indigo-700 flex items-center">
              <BarChart2 className="h-4 w-4 mr-1.5" />
              A/B Testing Comparison
            </h4>
            <button 
              onClick={() => setComparisonMode(false)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Back to all suggestions
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-0.5 p-0.5">
            <div className="p-4 bg-white">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mr-2">A</span>
                  <h5 className="font-medium">{suggestionAObj.title}</h5>
                </div>
                <PredictionScore score={suggestionAObj.predictedEngagement} size="lg" />
              </div>
              
              <SuggestionCard 
                suggestion={suggestionAObj} 
                isSelected={isSuggestionSelected(activeSuggestionGroup.id, suggestionAObj.id)}
                onSelect={() => handleSelectSuggestion(activeSuggestionGroup.id, suggestionAObj.id)}
                showFullDetails
              />
            </div>
            
            <div className="p-4 bg-white">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold mr-2">B</span>
                  <h5 className="font-medium">{suggestionBObj.title}</h5>
                </div>
                <PredictionScore score={suggestionBObj.predictedEngagement} size="lg" />
              </div>
              
              <SuggestionCard 
                suggestion={suggestionBObj} 
                isSelected={isSuggestionSelected(activeSuggestionGroup.id, suggestionBObj.id)}
                onSelect={() => handleSelectSuggestion(activeSuggestionGroup.id, suggestionBObj.id)}
                showFullDetails
              />
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <h5 className="font-medium text-sm mb-2">Comparison Insights</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Predicted Engagement</div>
                <div className="text-lg font-bold">
                  {suggestionAObj.predictedEngagement > suggestionBObj.predictedEngagement ? (
                    <span className="text-green-600">Option A wins by {(suggestionAObj.predictedEngagement - suggestionBObj.predictedEngagement).toFixed(0)}%</span>
                  ) : suggestionBObj.predictedEngagement > suggestionAObj.predictedEngagement ? (
                    <span className="text-green-600">Option B wins by {(suggestionBObj.predictedEngagement - suggestionAObj.predictedEngagement).toFixed(0)}%</span>
                  ) : (
                    <span className="text-amber-600">It's a tie!</span>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Recommended Action</div>
                <div className="font-medium text-sm">
                  {suggestionAObj.predictedEngagement >= suggestionBObj.predictedEngagement ? (
                    <div className="flex items-center text-indigo-600">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Select option A for {activeSuggestionGroup.goal.toLowerCase()}
                    </div>
                  ) : (
                    <div className="flex items-center text-indigo-600">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Select option B for {activeSuggestionGroup.goal.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal grid view
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeSuggestionGroup.suggestions.map(suggestion => (
            <div key={suggestion.id} className="relative">
              <SuggestionCard 
                suggestion={suggestion} 
                isSelected={isSuggestionSelected(activeSuggestionGroup.id, suggestion.id)}
                onSelect={() => handleSelectSuggestion(activeSuggestionGroup.id, suggestion.id)}
              />
              
              <button
                onClick={() => handleAddToComparison(suggestion.id)}
                className={`absolute top-3 left-3 p-1.5 rounded-full bg-white/90 border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors ${
                  suggestionA === suggestion.id || suggestionB === suggestion.id 
                    ? 'text-indigo-600 bg-indigo-50 border-indigo-300' 
                    : 'text-gray-500'
                }`}
              >
                <Tooltip content={
                  suggestionA === suggestion.id 
                    ? "Added as option A" 
                    : suggestionB === suggestion.id 
                      ? "Added as option B" 
                      : "Add to A/B comparison"
                }>
                  <Maximize2 className="h-3.5 w-3.5" />
                </Tooltip>
              </button>
            </div>
          ))}
        </div>
      )}
      
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