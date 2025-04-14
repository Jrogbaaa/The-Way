'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Clock, Calendar, TrendingUp, Zap, User, Users, ThumbsUp, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// Types
type ActionPriority = 'high' | 'medium' | 'low';
type ActionStatus = 'pending' | 'completed';
type ActionCategory = 'content' | 'engagement' | 'growth' | 'analytics';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  category: ActionCategory;
  dueDate?: string;
  status: ActionStatus;
  platform?: string;
  relatedGoal?: string;
}

// Priority label renderer
const PriorityLabel = ({ priority }: { priority: ActionPriority }) => {
  const classes = {
    high: "bg-red-100 text-red-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-green-100 text-green-800"
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Category icon renderer
const CategoryIcon = ({ category }: { category: ActionCategory }) => {
  switch (category) {
    case 'content':
      return <Calendar className="h-4 w-4 text-purple-500" />;
    case 'engagement':
      return <Users className="h-4 w-4 text-blue-500" />;
    case 'growth':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'analytics':
      return <ThumbsUp className="h-4 w-4 text-orange-500" />;
    default:
      return <CheckSquare className="h-4 w-4 text-gray-500" />;
  }
};

// Mock data for action items
const mockActionItems: ActionItem[] = [
  {
    id: '1',
    title: 'Create Instagram Reel during peak engagement time',
    description: 'Schedule a new reel for today at 7:00 PM to maximize audience reach',
    priority: 'high',
    category: 'content',
    dueDate: 'Today',
    status: 'pending',
    platform: 'Instagram',
    relatedGoal: 'Increase engagement by 15%'
  },
  {
    id: '2',
    title: 'Respond to high-priority comments',
    description: 'Reply to all comments with high engagement potential from the last 24 hours',
    priority: 'high',
    category: 'engagement',
    dueDate: 'Today',
    status: 'pending',
    platform: 'All Platforms',
    relatedGoal: 'Improve audience retention'
  },
  {
    id: '3',
    title: 'Review last week\'s content performance',
    description: 'Analyze which posts performed best and identify patterns',
    priority: 'medium',
    category: 'analytics',
    dueDate: 'Tomorrow',
    status: 'pending',
    relatedGoal: 'Optimize content strategy'
  },
  {
    id: '4',
    title: 'Incorporate trending hashtags in next TikTok post',
    description: 'Research and include 3-5 trending hashtags in your content plan',
    priority: 'medium',
    category: 'growth',
    dueDate: 'This week',
    status: 'pending',
    platform: 'TikTok',
    relatedGoal: 'Expand reach to new audiences'
  },
  {
    id: '5',
    title: 'Update profile bio with latest achievements',
    description: 'Refresh your bio to highlight recent milestones and current focus',
    priority: 'low',
    category: 'growth',
    dueDate: 'This week',
    status: 'pending',
    platform: 'All Platforms',
    relatedGoal: 'Strengthen personal brand'
  }
];

const ActionItems = () => {
  const [actions, setActions] = useState<ActionItem[]>(mockActionItems);
  const [filter, setFilter] = useState<'all' | ActionPriority>('all');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  // Filter actions by priority
  const filteredActions = actions.filter(
    action => filter === 'all' || action.priority === filter
  );

  // Toggle action completion status
  const handleToggleStatus = (id: string) => {
    setActions(prev => 
      prev.map(action => 
        action.id === id 
          ? { ...action, status: action.status === 'completed' ? 'pending' : 'completed' } 
          : action
      )
    );
  };

  // Toggle action details expansion
  const handleToggleExpand = (id: string) => {
    setExpandedAction(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <CheckSquare className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="font-semibold text-lg">Action Items</h3>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('high')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'high' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            High Priority
          </button>
          <button 
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'medium' 
                ? 'bg-amber-600 text-white' 
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            Medium
          </button>
          <button 
            onClick={() => setFilter('low')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              filter === 'low' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
          >
            Low
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100">
        {filteredActions.length > 0 ? (
          filteredActions.map(action => (
            <div 
              key={action.id} 
              className={`p-4 transition-colors ${
                action.status === 'completed' ? 'bg-gray-50' : 'hover:bg-indigo-50/30'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <button
                    onClick={() => handleToggleStatus(action.id)}
                    className="focus:outline-none group"
                    aria-label={action.status === 'completed' ? "Mark as pending" : "Mark as completed"}
                  >
                    {action.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-500 group-hover:text-green-600" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 group-hover:border-indigo-500 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-transparent group-hover:bg-indigo-200" />
                      </div>
                    )}
                  </button>
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 
                      className={`text-sm font-medium ${
                        action.status === 'completed' 
                          ? 'text-gray-500 line-through' 
                          : 'text-gray-900'
                      }`}
                    >
                      {action.title}
                    </h4>
                    <div className="ml-2 flex items-center space-x-2">
                      {action.dueDate && (
                        <Tooltip content={`Due: ${action.dueDate}`}>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {action.dueDate}
                          </div>
                        </Tooltip>
                      )}
                      <PriorityLabel priority={action.priority} />
                    </div>
                  </div>
                  
                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <CategoryIcon category={action.category} />
                      <span className="ml-1 capitalize">{action.category}</span>
                    </div>
                    
                    {action.platform && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{action.platform}</span>
                      </div>
                    )}
                    
                    {action.relatedGoal && (
                      <Tooltip content={`Goal: ${action.relatedGoal}`}>
                        <div className="flex items-center">
                          <Zap className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[150px]">{action.relatedGoal}</span>
                        </div>
                      </Tooltip>
                    )}
                  </div>
                  
                  {expandedAction === action.id && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <p>{action.description}</p>
                      {action.relatedGoal && (
                        <div className="mt-2 flex items-center text-xs font-medium text-indigo-600">
                          <Zap className="h-3 w-3 mr-1" />
                          Goal: {action.relatedGoal}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleToggleExpand(action.id)}
                  className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
                  aria-label="Toggle details"
                >
                  <ArrowRight 
                    className={`h-5 w-5 transition-transform ${
                      expandedAction === action.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <CheckCircle className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No action items</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter !== 'all' 
                ? `No ${filter} priority actions found` 
                : "You've completed all your actions!"}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <button 
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
        >
          View all action items
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ActionItems; 