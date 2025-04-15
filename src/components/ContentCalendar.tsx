'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Instagram, TrendingUp, Users, Video, UserIcon } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// Platform type for which we show optimal posting times
type Platform = 'instagram_reels' | 'instagram_stories' | 'tiktok';

// Day of the week type
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

// Time slot with audience activity data
type TimeSlot = {
  time: string;
  audienceActivity: number; // Percentage of active audience (0-100)
  recommended: boolean;
};

// Daily schedule type
type DailySchedule = {
  day: DayOfWeek;
  timeSlots: TimeSlot[];
};

// Platform data type with name, icon, and schedule
type PlatformData = {
  name: string;
  icon: React.ReactNode;
  schedule: DailySchedule[];
};

// Client/Talent type with their individual optimal posting schedule
type ClientSchedule = {
  id: string;
  name: string;
  avatarUrl?: string;
  platformSchedules: {
    platform: Platform;
    optimalTimes: {
      day: DayOfWeek;
      time: string;
      audienceActivity: number;
    }[];
  }[];
};

// This would come from an API in a real implementation
// We'd fetch this data from the server instead of embedding it in the client
// Moving to a centralized data store would allow for easier updates
const fetchPlatformData = async (platform: Platform): Promise<PlatformData> => {
  // In a real implementation, this would be an API call
  // For now, we're simulating with a timeout to mimic network latency
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(platformsData[platform]);
    }, 100);
  });
};

// Mock data for optimal posting times
const platformsData: Record<Platform, PlatformData> = {
  instagram_reels: {
    name: 'Instagram Reels',
    icon: <Instagram className="h-5 w-5 text-pink-600" />,
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { time: '6:00 AM', audienceActivity: 45, recommended: false },
          { time: '12:00 PM', audienceActivity: 78, recommended: true },
          { time: '6:00 PM', audienceActivity: 89, recommended: true },
          { time: '9:00 PM', audienceActivity: 67, recommended: false },
        ],
      },
      {
        day: 'Tuesday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 52, recommended: false },
          { time: '1:00 PM', audienceActivity: 75, recommended: true },
          { time: '7:00 PM', audienceActivity: 81, recommended: true },
          { time: '10:00 PM', audienceActivity: 59, recommended: false },
        ],
      },
      {
        day: 'Wednesday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 57, recommended: false },
          { time: '12:00 PM', audienceActivity: 82, recommended: true },
          { time: '6:00 PM', audienceActivity: 86, recommended: true },
          { time: '9:00 PM', audienceActivity: 72, recommended: true },
        ],
      },
      {
        day: 'Thursday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 51, recommended: false },
          { time: '1:00 PM', audienceActivity: 79, recommended: true },
          { time: '7:00 PM', audienceActivity: 91, recommended: true },
          { time: '10:00 PM', audienceActivity: 68, recommended: false },
        ],
      },
      {
        day: 'Friday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 48, recommended: false },
          { time: '1:00 PM', audienceActivity: 72, recommended: true },
          { time: '6:00 PM', audienceActivity: 85, recommended: true },
          { time: '9:00 PM', audienceActivity: 90, recommended: true },
        ],
      },
      {
        day: 'Saturday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 61, recommended: false },
          { time: '2:00 PM', audienceActivity: 75, recommended: true },
          { time: '8:00 PM', audienceActivity: 92, recommended: true },
          { time: '11:00 PM', audienceActivity: 82, recommended: true },
        ],
      },
      {
        day: 'Sunday',
        timeSlots: [
          { time: '10:00 AM', audienceActivity: 70, recommended: true },
          { time: '2:00 PM', audienceActivity: 83, recommended: true },
          { time: '7:00 PM', audienceActivity: 88, recommended: true },
          { time: '10:00 PM', audienceActivity: 73, recommended: true },
        ],
      },
    ],
  },
  instagram_stories: {
    name: 'Instagram Stories',
    icon: <Instagram className="h-5 w-5 text-purple-600" />,
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 62, recommended: false },
          { time: '12:00 PM', audienceActivity: 81, recommended: true },
          { time: '5:00 PM', audienceActivity: 86, recommended: true },
          { time: '9:00 PM', audienceActivity: 75, recommended: true },
        ],
      },
      {
        day: 'Tuesday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 59, recommended: false },
          { time: '12:00 PM', audienceActivity: 78, recommended: true },
          { time: '5:00 PM', audienceActivity: 84, recommended: true },
          { time: '9:00 PM', audienceActivity: 77, recommended: true },
        ],
      },
      {
        day: 'Wednesday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 65, recommended: false },
          { time: '12:00 PM', audienceActivity: 83, recommended: true },
          { time: '5:00 PM', audienceActivity: 88, recommended: true },
          { time: '9:00 PM', audienceActivity: 79, recommended: true },
        ],
      },
      {
        day: 'Thursday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 60, recommended: false },
          { time: '12:00 PM', audienceActivity: 76, recommended: true },
          { time: '5:00 PM', audienceActivity: 85, recommended: true },
          { time: '9:00 PM', audienceActivity: 80, recommended: true },
        ],
      },
      {
        day: 'Friday',
        timeSlots: [
          { time: '7:00 AM', audienceActivity: 58, recommended: false },
          { time: '12:00 PM', audienceActivity: 75, recommended: true },
          { time: '5:00 PM', audienceActivity: 87, recommended: true },
          { time: '9:00 PM', audienceActivity: 89, recommended: true },
        ],
      },
      {
        day: 'Saturday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 69, recommended: true },
          { time: '1:00 PM', audienceActivity: 82, recommended: true },
          { time: '6:00 PM', audienceActivity: 91, recommended: true },
          { time: '10:00 PM', audienceActivity: 85, recommended: true },
        ],
      },
      {
        day: 'Sunday',
        timeSlots: [
          { time: '10:00 AM', audienceActivity: 73, recommended: true },
          { time: '2:00 PM', audienceActivity: 85, recommended: true },
          { time: '6:00 PM', audienceActivity: 92, recommended: true },
          { time: '10:00 PM', audienceActivity: 81, recommended: true },
        ],
      },
    ],
  },
  tiktok: {
    name: 'TikTok',
    icon: <Video className="h-5 w-5 text-teal-600" />,
    schedule: [
      {
        day: 'Monday',
        timeSlots: [
          { time: '8:00 AM', audienceActivity: 55, recommended: false },
          { time: '1:00 PM', audienceActivity: 76, recommended: true },
          { time: '7:00 PM', audienceActivity: 88, recommended: true },
          { time: '10:00 PM', audienceActivity: 79, recommended: true },
        ],
      },
      {
        day: 'Tuesday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 57, recommended: false },
          { time: '2:00 PM', audienceActivity: 78, recommended: true },
          { time: '7:00 PM', audienceActivity: 86, recommended: true },
          { time: '11:00 PM', audienceActivity: 77, recommended: true },
        ],
      },
      {
        day: 'Wednesday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 59, recommended: false },
          { time: '1:00 PM', audienceActivity: 77, recommended: true },
          { time: '7:00 PM', audienceActivity: 90, recommended: true },
          { time: '10:00 PM', audienceActivity: 82, recommended: true },
        ],
      },
      {
        day: 'Thursday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 61, recommended: false },
          { time: '2:00 PM', audienceActivity: 80, recommended: true },
          { time: '7:00 PM', audienceActivity: 89, recommended: true },
          { time: '11:00 PM', audienceActivity: 81, recommended: true },
        ],
      },
      {
        day: 'Friday',
        timeSlots: [
          { time: '9:00 AM', audienceActivity: 63, recommended: false },
          { time: '2:00 PM', audienceActivity: 81, recommended: true },
          { time: '8:00 PM', audienceActivity: 93, recommended: true },
          { time: '11:00 PM', audienceActivity: 86, recommended: true },
        ],
      },
      {
        day: 'Saturday',
        timeSlots: [
          { time: '10:00 AM', audienceActivity: 72, recommended: true },
          { time: '3:00 PM', audienceActivity: 85, recommended: true },
          { time: '8:00 PM', audienceActivity: 95, recommended: true },
          { time: '12:00 AM', audienceActivity: 88, recommended: true },
        ],
      },
      {
        day: 'Sunday',
        timeSlots: [
          { time: '11:00 AM', audienceActivity: 75, recommended: true },
          { time: '3:00 PM', audienceActivity: 87, recommended: true },
          { time: '7:00 PM', audienceActivity: 91, recommended: true },
          { time: '11:00 PM', audienceActivity: 84, recommended: true },
        ],
      },
    ],
  },
};

// Mock data for clients/talents optimal posting times
const clientsData: ClientSchedule[] = [
  {
    id: '1',
    name: 'Bea Archidona',
    avatarUrl: 'https://i.pravatar.cc/150?img=23',
    platformSchedules: [
      {
        platform: 'instagram_stories',
        optimalTimes: [
          { day: 'Monday', time: '12:00 PM', audienceActivity: 83 },
          { day: 'Tuesday', time: '1:00 PM', audienceActivity: 79 },
          { day: 'Wednesday', time: '12:00 PM', audienceActivity: 85 },
          { day: 'Thursday', time: '12:00 PM', audienceActivity: 81 },
          { day: 'Friday', time: '5:00 PM', audienceActivity: 92 },
          { day: 'Saturday', time: '1:00 PM', audienceActivity: 87 },
          { day: 'Sunday', time: '2:00 PM', audienceActivity: 89 }
        ]
      },
      {
        platform: 'instagram_reels',
        optimalTimes: [
          { day: 'Monday', time: '6:00 PM', audienceActivity: 92 },
          { day: 'Tuesday', time: '7:00 PM', audienceActivity: 85 },
          { day: 'Wednesday', time: '6:00 PM', audienceActivity: 88 },
          { day: 'Thursday', time: '7:00 PM', audienceActivity: 94 },
          { day: 'Friday', time: '6:00 PM', audienceActivity: 89 },
          { day: 'Saturday', time: '8:00 PM', audienceActivity: 95 },
          { day: 'Sunday', time: '7:00 PM', audienceActivity: 91 }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Jaime Lorente',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    platformSchedules: [
      {
        platform: 'tiktok',
        optimalTimes: [
          { day: 'Monday', time: '7:00 PM', audienceActivity: 91 },
          { day: 'Tuesday', time: '2:00 PM', audienceActivity: 82 },
          { day: 'Wednesday', time: '7:00 PM', audienceActivity: 93 },
          { day: 'Thursday', time: '2:00 PM', audienceActivity: 84 },
          { day: 'Friday', time: '8:00 PM', audienceActivity: 96 },
          { day: 'Saturday', time: '3:00 PM', audienceActivity: 89 },
          { day: 'Sunday', time: '7:00 PM', audienceActivity: 94 }
        ]
      },
      {
        platform: 'instagram_reels',
        optimalTimes: [
          { day: 'Monday', time: '12:00 PM', audienceActivity: 84 },
          { day: 'Tuesday', time: '1:00 PM', audienceActivity: 78 },
          { day: 'Wednesday', time: '12:00 PM', audienceActivity: 86 },
          { day: 'Thursday', time: '1:00 PM', audienceActivity: 82 },
          { day: 'Friday', time: '1:00 PM', audienceActivity: 79 },
          { day: 'Saturday', time: '2:00 PM', audienceActivity: 81 },
          { day: 'Sunday', time: '2:00 PM', audienceActivity: 87 }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Marcus Chen',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    platformSchedules: [
      {
        platform: 'instagram_stories',
        optimalTimes: [
          { day: 'Monday', time: '5:00 PM', audienceActivity: 89 },
          { day: 'Tuesday', time: '5:00 PM', audienceActivity: 87 },
          { day: 'Wednesday', time: '5:00 PM', audienceActivity: 92 },
          { day: 'Thursday', time: '5:00 PM', audienceActivity: 88 },
          { day: 'Friday', time: '12:00 PM', audienceActivity: 83 },
          { day: 'Saturday', time: '6:00 PM', audienceActivity: 94 },
          { day: 'Sunday', time: '6:00 PM', audienceActivity: 93 }
        ]
      },
      {
        platform: 'tiktok',
        optimalTimes: [
          { day: 'Monday', time: '1:00 PM', audienceActivity: 81 },
          { day: 'Tuesday', time: '7:00 PM', audienceActivity: 88 },
          { day: 'Wednesday', time: '1:00 PM', audienceActivity: 83 },
          { day: 'Thursday', time: '7:00 PM', audienceActivity: 91 },
          { day: 'Friday', time: '8:00 PM', audienceActivity: 95 },
          { day: 'Saturday', time: '8:00 PM', audienceActivity: 97 },
          { day: 'Sunday', time: '3:00 PM', audienceActivity: 90 }
        ]
      }
    ]
  },
  {
    id: '4',
    name: 'Cristina Pedroche',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    platformSchedules: [
      {
        platform: 'instagram_stories',
        optimalTimes: [
          { day: 'Monday', time: '1:00 PM', audienceActivity: 86 },
          { day: 'Tuesday', time: '2:00 PM', audienceActivity: 82 },
          { day: 'Wednesday', time: '1:00 PM', audienceActivity: 88 },
          { day: 'Thursday', time: '2:00 PM', audienceActivity: 84 },
          { day: 'Friday', time: '7:00 PM', audienceActivity: 91 },
          { day: 'Saturday', time: '3:00 PM', audienceActivity: 90 },
          { day: 'Sunday', time: '4:00 PM', audienceActivity: 92 }
        ]
      },
      {
        platform: 'instagram_reels',
        optimalTimes: [
          { day: 'Monday', time: '7:00 PM', audienceActivity: 90 },
          { day: 'Tuesday', time: '8:00 PM', audienceActivity: 88 },
          { day: 'Wednesday', time: '7:00 PM', audienceActivity: 92 },
          { day: 'Thursday', time: '8:00 PM', audienceActivity: 89 },
          { day: 'Friday', time: '9:00 PM', audienceActivity: 93 },
          { day: 'Saturday', time: '9:00 PM', audienceActivity: 95 },
          { day: 'Sunday', time: '8:00 PM', audienceActivity: 91 }
        ]
      },
      {
        platform: 'tiktok',
        optimalTimes: [
          { day: 'Monday', time: '8:00 PM', audienceActivity: 89 },
          { day: 'Tuesday', time: '7:00 PM', audienceActivity: 87 },
          { day: 'Wednesday', time: '8:00 PM', audienceActivity: 91 },
          { day: 'Thursday', time: '7:00 PM', audienceActivity: 90 },
          { day: 'Friday', time: '9:00 PM', audienceActivity: 94 },
          { day: 'Saturday', time: '8:00 PM', audienceActivity: 96 },
          { day: 'Sunday', time: '7:00 PM', audienceActivity: 93 }
        ]
      }
    ]
  }
];

// Extract to a separate file in a real app, e.g., src/lib/utils/dateUtils.ts
const dateUtils = {
  getCurrentDay: (): DayOfWeek => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as DayOfWeek[];
    return days[new Date().getDay()];
  }
};

// This could be a custom hook in a real app, e.g., src/hooks/useContentCalendar.ts
const useContentCalendar = (initialPlatform: Platform = 'instagram_reels') => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(initialPlatform);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(dateUtils.getCurrentDay());
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientView, setShowClientView] = useState(true); // Already set to true by default
  
  // Fetch platform data when selected platform changes
  useEffect(() => {
    const loadPlatformData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPlatformData(selectedPlatform);
        setPlatformData(data);
      } catch (error) {
        console.error('Failed to fetch platform data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlatformData();
  }, [selectedPlatform]);
  
  // Set current day on initial load
  useEffect(() => {
    setSelectedDay(dateUtils.getCurrentDay());
  }, []);
  
  // Memoize time slots for selected day to prevent unnecessary recalculations
  const timeSlotsForSelectedDay = useMemo(() => {
    if (!platformData) return [];
    
    return platformData.schedule.find(schedule => schedule.day === selectedDay)?.timeSlots || [];
  }, [platformData, selectedDay]);
  
  // Memoize best time calculation to prevent unnecessary recalculations
  const bestTimeForSelectedDay = useMemo(() => {
    const timeSlots = timeSlotsForSelectedDay;
    if (!timeSlots.length) return 'No data available';
    
    return timeSlots.reduce((prev, current) => 
      (current.audienceActivity > prev.audienceActivity) ? current : prev
    ).time;
  }, [timeSlotsForSelectedDay]);
  
  // Get client-specific recommendations for selected day
  const clientRecommendationsForDay = useMemo(() => {
    return clientsData.flatMap(client => {
      return client.platformSchedules
        .filter(ps => ps.platform === selectedPlatform)
        .flatMap(ps => {
          const optimalTime = ps.optimalTimes.find(ot => ot.day === selectedDay);
          if (!optimalTime) return [];
          
          return [{
            clientId: client.id,
            clientName: client.name,
            avatarUrl: client.avatarUrl,
            platform: ps.platform,
            time: optimalTime.time,
            audienceActivity: optimalTime.audienceActivity
          }];
        });
    }).sort((a, b) => b.audienceActivity - a.audienceActivity);
  }, [selectedPlatform, selectedDay]);
  
  // Toggle between general and client-specific views
  const toggleViewMode = () => {
    setShowClientView(prev => !prev);
  };
  
  // Calculate highest activity percentage for UI
  const highestActivityPercentage = useMemo(() => {
    const timeSlots = timeSlotsForSelectedDay;
    if (!timeSlots.length) return 0;
    
    const highestActivity = Math.max(...timeSlots.map(slot => slot.audienceActivity));
    return highestActivity;
  }, [timeSlotsForSelectedDay]);
  
  // Handle platform selection
  const handlePlatformSelect = useCallback((platform: Platform) => {
    setSelectedPlatform(platform);
  }, []);
  
  // Handle day selection
  const handleDaySelect = useCallback((day: DayOfWeek) => {
    setSelectedDay(day);
  }, []);
  
  return {
    selectedPlatform,
    selectedDay,
    platformData,
    isLoading,
    timeSlotsForSelectedDay,
    bestTimeForSelectedDay,
    highestActivityPercentage,
    clientRecommendationsForDay,
    showClientView,
    toggleViewMode,
    handlePlatformSelect,
    handleDaySelect
  };
};

const ContentCalendar = () => {
  const {
    selectedPlatform,
    selectedDay,
    platformData,
    isLoading,
    timeSlotsForSelectedDay,
    bestTimeForSelectedDay,
    highestActivityPercentage,
    clientRecommendationsForDay,
    showClientView,
    toggleViewMode,
    handlePlatformSelect,
    handleDaySelect
  } = useContentCalendar();

  // Return loading state while fetching data
  if (isLoading || !platformData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-2 text-gray-500">Loading calendar data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-500 hover:shadow-md">
      <div className="p-6 border-b flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
          <h2 className="text-xl font-semibold">Content Calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleViewMode} 
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium flex items-center transition-all"
          >
            <UserIcon className="h-3 w-3 mr-1" />
            {showClientView ? "View General Times" : "View Client Times"}
          </button>
          <Tooltip content="AI-optimized posting schedule based on audience activity patterns">
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              AI Optimized
            </div>
          </Tooltip>
        </div>
      </div>
      
      {/* Platform selection */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <button
            onClick={() => handlePlatformSelect('instagram_reels')}
            className={`px-4 py-2 rounded-lg flex items-center transition-all ${
              selectedPlatform === 'instagram_reels'
                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                : 'bg-white border hover:bg-gray-50'
            }`}
            tabIndex={0}
            aria-label="Select Instagram Reels"
          >
            <Instagram className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Reels</span>
          </button>
          
          <button
            onClick={() => handlePlatformSelect('instagram_stories')}
            className={`px-4 py-2 rounded-lg flex items-center transition-all ${
              selectedPlatform === 'instagram_stories'
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-white border hover:bg-gray-50'
            }`}
            tabIndex={0}
            aria-label="Select Instagram Stories"
          >
            <Instagram className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Stories</span>
          </button>
          
          <button
            onClick={() => handlePlatformSelect('tiktok')}
            className={`px-4 py-2 rounded-lg flex items-center transition-all ${
              selectedPlatform === 'tiktok'
                ? 'bg-teal-100 text-teal-700 border border-teal-200'
                : 'bg-white border hover:bg-gray-50'
            }`}
            tabIndex={0}
            aria-label="Select TikTok"
          >
            <Video className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">TikTok</span>
          </button>
        </div>
      </div>
      
      {/* Calendar Week View */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-7 gap-2">
          {platformData.schedule.map((daySchedule) => (
            <button
              key={daySchedule.day}
              onClick={() => handleDaySelect(daySchedule.day)}
              className={`p-2 rounded-lg flex flex-col items-center transition-all ${
                selectedDay === daySchedule.day
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white border hover:bg-gray-50'
              }`}
              tabIndex={0}
              aria-label={`Select ${daySchedule.day}`}
            >
              <span className="text-xs font-medium">{daySchedule.day.substring(0, 3)}</span>
              <div className="mt-1 flex">
                {daySchedule.timeSlots.filter(slot => slot.recommended).length > 0 && (
                  <Tooltip content="Has recommended posting times">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </Tooltip>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {showClientView ? (
        /* Client-specific recommendations */
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Users className="h-4 w-4 mr-1 text-indigo-600" />
            Client Recommendations for {selectedDay}
          </h3>
          
          <div className="space-y-3">
            {clientRecommendationsForDay.length > 0 ? (
              clientRecommendationsForDay.map((rec, index) => (
                <div key={`${rec.clientId}-${index}`} className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      {rec.avatarUrl ? (
                        <img src={rec.avatarUrl} alt={rec.clientName} className="w-8 h-8 rounded-full" />
                      ) : (
                        <UserIcon className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rec.clientName}</p>
                      <span className="text-xs text-gray-500">
                        {selectedPlatform === 'instagram_reels' && 'Instagram Reels'}
                        {selectedPlatform === 'instagram_stories' && 'Instagram Stories'}
                        {selectedPlatform === 'tiktok' && 'TikTok'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{rec.time}</p>
                    <span className="text-xs text-gray-500">{rec.audienceActivity}% audience</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-sm text-gray-500">
                No client-specific recommendations for this day and platform
              </div>
            )}
          </div>
        </div>
      ) : (
        /* General Best Time Highlight */
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-indigo-100 mr-3">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <span className="text-xs text-gray-500">Best time to post on {selectedDay}</span>
              <p className="font-medium">{bestTimeForSelectedDay}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 mr-3">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <span className="text-xs text-gray-500">Expected audience activity</span>
              <p className="font-medium">{highestActivityPercentage}%</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Time Slots */}
      {!showClientView && (
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Activity Heatmap</h3>
          <div className="space-y-2">
            {timeSlotsForSelectedDay.map((slot, i) => (
              <div key={i} className="flex items-center">
                <span className="text-xs font-medium w-16">{slot.time}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden ml-2">
                  <div 
                    className={`h-full ${
                      slot.audienceActivity > 80 ? 'bg-green-500' : 
                      slot.audienceActivity > 60 ? 'bg-green-400' : 
                      slot.audienceActivity > 40 ? 'bg-yellow-400' : 'bg-gray-300'
                    } transition-all duration-500 rounded-lg`}
                    style={{ width: `${slot.audienceActivity}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-12 text-right">{slot.audienceActivity}%</span>
                {slot.recommended && (
                  <Tooltip content="Recommended posting time">
                    <div className="p-1 rounded-full bg-green-100 ml-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    </div>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendar; 