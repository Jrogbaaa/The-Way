'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { MessageCircle, Clock, Send, Plus, ArrowRight, User2, Bot, X, Zap } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

// Define ChatSession interface directly to avoid dependency on replicateChat module
interface ChatSession {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Sample chat data with fixed timestamps for initial render
const getFixedDate = (offsetMinutes = 0) => {
  // Use a fixed date that won't change between server and client render
  const fixedDate = new Date('2023-01-01T12:00:00Z');
  if (offsetMinutes) {
    fixedDate.setMinutes(fixedDate.getMinutes() - offsetMinutes);
  }
  return fixedDate;
};

// Sample chat data
const sampleChats: Record<string, {
  id: string;
  name: string;
  description: string;
  messages: Message[];
  chatSession?: ChatSession;
}> = {
  current: {
    id: 'current',
    name: 'Social Media Strategy',
    description: 'Current conversation',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Social Media Expert. I have 10+ years of experience across all major platforms. How can I help with your social media strategy today?",
        timestamp: getFixedDate(),
      }
    ]
  },
  contentCalendar: {
    id: 'contentCalendar',
    name: 'Content Calendar',
    description: 'Monthly planning',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Social Media Expert. How can I help with your content calendar today?",
        timestamp: getFixedDate(60),
      },
      {
        id: '2',
        role: 'user',
        content: "I need help creating a content calendar for my fitness brand. We post on Instagram and TikTok.",
        timestamp: getFixedDate(55),
      },
      {
        id: '3',
        role: 'assistant',
        content: "I'd be happy to help you create a content calendar for your fitness brand! Here's a weekly framework you can follow for Instagram and TikTok:\n\n**Monday - Motivation**\n- Instagram: Inspirational quote with a high-quality fitness image\n- TikTok: 30-second motivational speech with workout background\n\n**Tuesday - Tutorial**\n- Instagram: Carousel of exercise technique breakdown\n- TikTok: 60-second exercise tutorial video\n\n**Wednesday - Wellness**\n- Instagram: Nutrition tip or healthy recipe\n- TikTok: Quick healthy meal prep video\n\n**Thursday - Transformation**\n- Instagram: Before/after or client success story\n- TikTok: Client testimonial or transformation journey\n\n**Friday - Fitness Challenge**\n- Instagram: Weekend workout challenge announcement\n- TikTok: Demo of the challenge with upbeat music\n\n**Saturday - Community**\n- Instagram: Repost follower content or Q&A\n- TikTok: Answer follower questions or community highlights\n\n**Sunday - Planning**\n- Instagram: Week ahead preview or weekly tips\n- TikTok: \"Get ready with me\" style week preparation\n\nWould you like more specific content ideas for any of these categories?",
        timestamp: getFixedDate(50),
      }
    ],
    chatSession: {
      messages: [
        { role: 'assistant', content: "Hello! I'm your Social Media Expert. How can I help with your content calendar today?" },
        { role: 'user', content: "I need help creating a content calendar for my fitness brand. We post on Instagram and TikTok." },
        { role: 'assistant', content: "I'd be happy to help you create a content calendar for your fitness brand! Here's a weekly framework you can follow for Instagram and TikTok:\n\n**Monday - Motivation**\n- Instagram: Inspirational quote with a high-quality fitness image\n- TikTok: 30-second motivational speech with workout background\n\n**Tuesday - Tutorial**\n- Instagram: Carousel of exercise technique breakdown\n- TikTok: 60-second exercise tutorial video\n\n**Wednesday - Wellness**\n- Instagram: Nutrition tip or healthy recipe\n- TikTok: Quick healthy meal prep video\n\n**Thursday - Transformation**\n- Instagram: Before/after or client success story\n- TikTok: Client testimonial or transformation journey\n\n**Friday - Fitness Challenge**\n- Instagram: Weekend workout challenge announcement\n- TikTok: Demo of the challenge with upbeat music\n\n**Saturday - Community**\n- Instagram: Repost follower content or Q&A\n- TikTok: Answer follower questions or community highlights\n\n**Sunday - Planning**\n- Instagram: Week ahead preview or weekly tips\n- TikTok: \"Get ready with me\" style week preparation\n\nWould you like more specific content ideas for any of these categories?" }
      ]
    }
  },
  hashtagResearch: {
    id: 'hashtagResearch',
    name: 'Hashtag Research',
    description: 'Trending topics for health',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Social Media Expert. How can I help with hashtag research today?",
        timestamp: getFixedDate(120),
      },
      {
        id: '2',
        role: 'user',
        content: "What hashtags should I use for my health and wellness content on Instagram?",
        timestamp: getFixedDate(115),
      },
      {
        id: '3',
        role: 'assistant',
        content: "For health and wellness content on Instagram, I recommend using a strategic mix of popular, moderately competitive, and niche hashtags. Here's a curated list:\n\n**Popular Hashtags** (use 1-3 from this category):\n- #healthandwellness (17M+ posts)\n- #wellness (38M+ posts)\n- #selfcare (26M+ posts)\n- #healthylifestyle (45M+ posts)\n- #mindfulness (27M+ posts)\n\n**Medium Competition** (use 5-7 from this category):\n- #wellnessjourney (2-5M posts)\n- #holistichealth (4M+ posts)\n- #mentalhealthawareness (7M+ posts)\n- #wellnesstips (1M+ posts)\n- #healthtips (2M+ posts)\n- #mindandbody (3M+ posts)\n- #selfcareday (1M+ posts)\n\n**Niche/Specific** (use 7-10 from this category):\n- #dailywellnessroutine (under 500K posts)\n- #wellnesscoach (under 1M posts)\n- #wellnesscommunity (under 800K posts)\n- #healthandwellnessblogger (under 300K posts)\n- #wellnesswarrior (under 700K posts)\n- #wellnesslifestyle (under 1M posts)\n- #mindfuleating (under 500K posts)\n- #wellnessadvocate (under 200K posts)\n\n**Trending Health Topics 2024** (rotate these based on your content):\n- #immunehealth\n- #gutmicrobiome\n- #sleepoptimization\n- #stressmanagement\n- #functionalfitness\n- #mindsetshift\n\nFor best results, I recommend:\n1. Creating a few sets of 20-30 hashtags and rotating them\n2. Including location-based hashtags if relevant (like #NYCwellness)\n3. Creating a branded hashtag for your content\n4. Updating your hashtag research monthly as trends change\n\nWould you like me to suggest some hashtag combinations for specific types of health and wellness content?",
        timestamp: getFixedDate(110),
      }
    ],
    chatSession: {
      messages: [
        { role: 'assistant', content: "Hello! I'm your Social Media Expert. How can I help with hashtag research today?" },
        { role: 'user', content: "What hashtags should I use for my health and wellness content on Instagram?" },
        { role: 'assistant', content: "For health and wellness content on Instagram, I recommend using a strategic mix of popular, moderately competitive, and niche hashtags. Here's a curated list:\n\n**Popular Hashtags** (use 1-3 from this category):\n- #healthandwellness (17M+ posts)\n- #wellness (38M+ posts)\n- #selfcare (26M+ posts)\n- #healthylifestyle (45M+ posts)\n- #mindfulness (27M+ posts)\n\n**Medium Competition** (use 5-7 from this category):\n- #wellnessjourney (2-5M posts)\n- #holistichealth (4M+ posts)\n- #mentalhealthawareness (7M+ posts)\n- #wellnesstips (1M+ posts)\n- #healthtips (2M+ posts)\n- #mindandbody (3M+ posts)\n- #selfcareday (1M+ posts)\n\n**Niche/Specific** (use 7-10 from this category):\n- #dailywellnessroutine (under 500K posts)\n- #wellnesscoach (under 1M posts)\n- #wellnesscommunity (under 800K posts)\n- #healthandwellnessblogger (under 300K posts)\n- #wellnesswarrior (under 700K posts)\n- #wellnesslifestyle (under 1M posts)\n- #mindfuleating (under 500K posts)\n- #wellnessadvocate (under 200K posts)\n\n**Trending Health Topics 2024** (rotate these based on your content):\n- #immunehealth\n- #gutmicrobiome\n- #sleepoptimization\n- #stressmanagement\n- #functionalfitness\n- #mindsetshift\n\nFor best results, I recommend:\n1. Creating a few sets of 20-30 hashtags and rotating them\n2. Including location-based hashtags if relevant (like #NYCwellness)\n3. Creating a branded hashtag for your content\n4. Updating your hashtag research monthly as trends change\n\nWould you like me to suggest some hashtag combinations for specific types of health and wellness content?" }
      ]
    }
  },
  videoScriptIdeas: {
    id: 'videoScriptIdeas',
    name: 'Video Script Ideas',
    description: 'Short-form content',
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your Social Media Expert. How can I help with video script ideas today?",
        timestamp: getFixedDate(240),
      },
      {
        id: '2',
        role: 'user',
        content: "I need ideas for short-form video content for my tech product review channel.",
        timestamp: getFixedDate(235),
      },
      {
        id: '3',
        role: 'assistant',
        content: "Here are 10 engaging short-form video ideas for your tech product review channel that work well on platforms like TikTok, Instagram Reels, and YouTube Shorts:\n\n1. **The 30-Second Review**\n   - Script Structure: Quick intro → 3 key features → final verdict\n   - Hook: \"Is the new [Product] worth the hype? Let me break it down in 30 seconds.\"\n\n2. **Expectations vs. Reality**\n   - Script Structure: Marketing claim → your actual experience (split screen)\n   - Hook: \"[Brand] says this can [do X]. Let's see what really happens.\"\n\n3. **Hidden Features Series**\n   - Script Structure: Introduce popular product → reveal lesser-known feature → demonstrate use case\n   - Hook: \"The hidden [Product] feature that nobody talks about...\"\n\n4. **Tech Myths Debunked**\n   - Script Structure: State common belief → test it on camera → reveal truth\n   - Hook: \"Everyone says [myth about product]. Let's test if that's actually true.\"\n\n5. **Honest Pros & Cons in 60 Seconds**\n   - Script Structure: Brief product intro → 3 pros → 3 cons → who should buy\n   - Hook: \"The good, the bad, and the ugly about the new [Product].\"\n\n6. **Price Tier Comparisons**\n   - Script Structure: Show budget, mid-range, premium options → key differences → value pick\n   - Hook: \"$50 vs $200 vs $500: Which [product] is actually worth your money?\"\n\n7. **Day in the Life with [Product]**\n   - Script Structure: Morning use → afternoon use → evening use → verdict\n   - Hook: \"I used the new [Product] for everything for 24 hours. Here's what happened.\"\n\n8. **5 Accessories You NEED for [Popular Device]**\n   - Script Structure: Problem → accessory solution → quick demo of each\n   - Hook: \"These 5 accessories make your [Device] 10x better.\"\n\n9. **Tech Hacks in 60 Seconds**\n   - Script Structure: Problem statement → quick solution → demonstration\n   - Hook: \"The [Product] hack that changed my life.\"\n\n10. **Unboxing ASMR with Voiceover Review**\n    - Script Structure: Satisfying unboxing sounds → whispered first impressions → key feature highlight\n    - Hook: \"The most satisfying [Product] unboxing you'll ever hear.\"\n\nFor each of these formats, I recommend:\n- First 3 seconds should contain your hook\n- Keep scripts to 150 words or less for a 60-second video\n- End with a question to boost engagement\n- Include text overlays for key points\n\nWhich of these formats would you like me to develop into a full script example?",
        timestamp: getFixedDate(230),
      }
    ],
    chatSession: {
      messages: [
        { role: 'assistant', content: "Hello! I'm your Social Media Expert. How can I help with video script ideas today?" },
        { role: 'user', content: "I need ideas for short-form video content for my tech product review channel." },
        { role: 'assistant', content: "Here are 10 engaging short-form video ideas for your tech product review channel that work well on platforms like TikTok, Instagram Reels, and YouTube Shorts:\n\n1. **The 30-Second Review**\n   - Script Structure: Quick intro → 3 key features → final verdict\n   - Hook: \"Is the new [Product] worth the hype? Let me break it down in 30 seconds.\"\n\n2. **Expectations vs. Reality**\n   - Script Structure: Marketing claim → your actual experience (split screen)\n   - Hook: \"[Brand] says this can [do X]. Let's see what really happens.\"\n\n3. **Hidden Features Series**\n   - Script Structure: Introduce popular product → reveal lesser-known feature → demonstrate use case\n   - Hook: \"The hidden [Product] feature that nobody talks about...\"\n\n4. **Tech Myths Debunked**\n   - Script Structure: State common belief → test it on camera → reveal truth\n   - Hook: \"Everyone says [myth about product]. Let's test if that's actually true.\"\n\n5. **Honest Pros & Cons in 60 Seconds**\n   - Script Structure: Brief product intro → 3 pros → 3 cons → who should buy\n   - Hook: \"The good, the bad, and the ugly about the new [Product].\"\n\n6. **Price Tier Comparisons**\n   - Script Structure: Show budget, mid-range, premium options → key differences → value pick\n   - Hook: \"$50 vs $200 vs $500: Which [product] is actually worth your money?\"\n\n7. **Day in the Life with [Product]**\n   - Script Structure: Morning use → afternoon use → evening use → verdict\n   - Hook: \"I used the new [Product] for everything for 24 hours. Here's what happened.\"\n\n8. **5 Accessories You NEED for [Popular Device]**\n   - Script Structure: Problem → accessory solution → quick demo of each\n   - Hook: \"These 5 accessories make your [Device] 10x better.\"\n\n9. **Tech Hacks in 60 Seconds**\n   - Script Structure: Problem statement → quick solution → demonstration\n   - Hook: \"The [Product] hack that changed my life.\"\n\n10. **Unboxing ASMR with Voiceover Review**\n    - Script Structure: Satisfying unboxing sounds → whispered first impressions → key feature highlight\n    - Hook: \"The most satisfying [Product] unboxing you'll ever hear.\"\n\nFor each of these formats, I recommend:\n- First 3 seconds should contain your hook\n- Keep scripts to 150 words or less for a 60-second video\n- End with a question to boost engagement\n- Include text overlays for key points\n\nWhich of these formats would you like me to develop into a full script example?" }
      ]
    }
  }
};

export default function ChatPage() {
  const [activeChat, setActiveChat] = useState('current');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [showTip, setShowTip] = useState(true);

  // Mark component as hydrated
  useEffect(() => {
    setIsClient(true);
    setMessages(sampleChats[activeChat].messages);
    
    // Trigger animations after initial render
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    // Auto-hide tip after 8 seconds
    const tipTimer = setTimeout(() => {
      setShowTip(false);
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(tipTimer);
    };
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat data when active chat changes
  useEffect(() => {
    if (isClient) {
      const selectedChat = sampleChats[activeChat];
      setMessages(selectedChat.messages);
      setChatSession(selectedChat.chatSession || null);
    }
  }, [activeChat, isClient]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    try {
      // Call the API to get a response from the social media expert
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: chatSession
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from the chatbot API');
      }
      
      const data = await response.json();
      
      // Update chat session with the new messages
      setChatSession(data.chatSession);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveChat('current');
    setMessages(sampleChats.current.messages);
    setChatSession(null);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MainLayout>
      <div className={`h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4 transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        {/* Sidebar */}
        <div className="w-full md:w-64 lg:w-80 bg-white rounded-xl border shadow-sm overflow-hidden opacity-0 animate-slide-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <h2 className="text-lg font-semibold flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-indigo-600" />
              Chat Assistant
            </h2>
          </div>
          
          {/* New Chat Button */}
          <div className="p-3">
            <Button 
              onClick={handleStartNewChat}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 hover:-translate-y-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
          
          {/* Chat History */}
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Conversations</h3>
            <div className="space-y-2">
              {Object.values(sampleChats).map((chat, index) => (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 transform hover:-translate-x-1 ${
                    activeChat === chat.id 
                      ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 font-medium shadow-sm' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  style={{
                    animationDelay: `${0.2 + (index * 0.05)}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${activeChat === chat.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="ml-2 overflow-hidden">
                      <div className="font-medium truncate">{chat.name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center">
                        <Clock className="h-3 w-3 mr-1 inline" />
                        {formatTime(chat.messages[chat.messages.length - 1].timestamp)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          {/* Chat Header */}
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
            <div>
              <h2 className="font-semibold">{sampleChats[activeChat].name}</h2>
              <p className="text-xs text-gray-500">{sampleChats[activeChat].description}</p>
            </div>
            <Tooltip content="Start a new conversation">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStartNewChat}
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            </Tooltip>
          </div>
          
          {/* AI Tip */}
          {showTip && (
            <div
              className="p-3 m-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between transition-all duration-500 ease-in-out animate-fade-in"
            >
              <div className="flex items-center">
                <Zap className="h-5 w-5 mr-3" />
                <p className="text-sm font-medium">Try asking about content strategy, posting schedules, or engagement tactics</p>
              </div>
              <button 
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                onClick={() => setShowTip(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      {message.role === 'assistant' ? (
                        <div className="p-1 mr-2 rounded-full bg-indigo-100">
                          <Bot className="h-3 w-3 text-indigo-600" />
                        </div>
                      ) : (
                        <div className="p-1 mr-2 rounded-full bg-white/30">
                          <User2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                      <span className={`text-xs ${message.role === 'user' ? 'text-gray-200' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="whitespace-pre-line">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl px-4 py-3 max-w-[80%] border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-full bg-indigo-100">
                        <Bot className="h-3 w-3 text-indigo-600" />
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse"></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full px-4 py-2 pr-10 h-12 resize-none overflow-auto border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-shadow duration-200"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !newMessage.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all duration-300 hover:-translate-y-1"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2 flex items-center">
              <ArrowRight className="h-3 w-3 mr-1" />
              Press Enter to send, Shift+Enter for a new line
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