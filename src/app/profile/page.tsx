'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { User, Settings, Edit, Instagram, Twitter, Globe, Mail, Bell, Shield, Save, Check, UserCircle2, Info, Moon } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import Image from 'next/image';

// Custom TikTok icon component since it's not in lucide-react
const TikTok = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-5 w-5"
  >
    <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    <path d="M20 8.94a8 8 0 0 1-1.5-.15l-.49-1.82A8 8 0 0 1 20 6.2V4a12.3 12.3 0 0 0-7.5 1.87V13a4 4 0 1 1-5-3.07V6.79A8 8 0 0 0 4 15.59a8.23 8.23 0 0 0 2 5.41A8 8 0 0 0 12 24c2.1 0 4.5-5 7.9-2.9a8 8 0 0 0 4.1-7.1v-8a12.29 12.29 0 0 0 4-3h-4a8.24 8.24 0 0 1-4 1.94z" />
  </svg>
);

export default function ProfilePage() {
  // Example user data for presentation
  const [userData, setUserData] = useState({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: '/placeholder-avatar.jpg',
    bio: 'Social media content creator specializing in lifestyle and travel photography.',
    website: 'example.com/janesmith',
    socialMedia: {
      instagram: '@janesmith',
      twitter: '@janesmith',
      tiktok: '@janesmith',
    },
    preferences: {
      emailNotifications: true,
      publicProfile: true,
      darkMode: false,
    },
  });
  
  const [activeSection, setActiveSection] = useState('profile');
  const [animateIn, setAnimateIn] = useState(false);
  const [changesSaved, setChangesSaved] = useState(false);

  // Trigger animations after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., socialMedia.instagram)
      const [parent, child] = name.split('.');
      
      // Type safe approach
      if (parent === 'socialMedia' && (child === 'instagram' || child === 'twitter' || child === 'tiktok')) {
        setUserData(prev => ({
          ...prev,
          socialMedia: {
            ...prev.socialMedia,
            [child]: value.startsWith('@') ? value : `@${value}`,
          }
        }));
      }
    } else {
      // Handle top-level properties
      setUserData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle toggle changes
  const handleToggle = (preference: keyof typeof userData.preferences) => {
    setUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: !prev.preferences[preference]
      }
    }));
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    // Simulate saving
    setChangesSaved(true);
    setTimeout(() => setChangesSaved(false), 3000);
  };

  return (
    <MainLayout>
      <div className={`transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 opacity-0 animate-slide-in"
          style={{
            animationDelay: '0.1s',
            animationFillMode: 'forwards'
          }}
        >
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and preferences</p>
          </div>
          
          <Button
            onClick={handleSaveChanges}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            {changesSaved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Sidebar */}
          <div 
            className="md:col-span-1 space-y-6 opacity-0 animate-fade-in"
            style={{
              animationDelay: '0.2s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 text-2xl font-bold overflow-hidden">
                    {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <button className="absolute bottom-0 right-0 rounded-full bg-indigo-500 p-1.5 text-white hover:bg-indigo-600 transition-colors duration-300">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold">{userData.name}</h2>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Mail className="h-3.5 w-3.5 mr-1" />
                  {userData.email}
                </p>
                <div className="mt-4 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full transition-all duration-300 hover:-translate-y-1"
                  >
                    <UserCircle2 className="h-4 w-4 mr-2" />
                    Edit Profile Picture
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-lg font-medium mb-4">Account Links</h3>
              <nav className="space-y-2">
                <button 
                  onClick={() => setActiveSection('profile')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:-translate-x-1 ${
                    activeSection === 'profile' 
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <User className="h-5 w-5 mr-2" />
                  General Information
                </button>
                <button 
                  onClick={() => setActiveSection('social')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:-translate-x-1 ${
                    activeSection === 'social' 
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Globe className="h-5 w-5 mr-2" />
                  Social Profiles
                </button>
                <button 
                  onClick={() => setActiveSection('preferences')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:-translate-x-1 ${
                    activeSection === 'preferences' 
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Preferences
                </button>
                <button 
                  onClick={() => setActiveSection('security')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-300 hover:-translate-x-1 ${
                    activeSection === 'security' 
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Security
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* General Information */}
            <div 
              id="profile" 
              className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 transition-all duration-500 ${
                activeSection === 'profile' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              } opacity-0 animate-fade-in`}
              style={{
                animationDelay: '0.3s',
                animationFillMode: 'forwards'
              }}
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-indigo-600" />
                General Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={userData.name}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    name="bio"
                    value={userData.bio}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={userData.website}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Social Profiles */}
            <div 
              id="social" 
              className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 transition-all duration-500 ${
                activeSection === 'social' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              } opacity-0 animate-fade-in`}
              style={{
                animationDelay: '0.3s',
                animationFillMode: 'forwards'
              }}
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                Social Profiles
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    <Instagram className="h-4 w-4 mr-1 text-pink-500" />
                    Instagram
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      name="socialMedia.instagram"
                      value={userData.socialMedia.instagram.replace('@', '')}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 pl-7 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    <Twitter className="h-4 w-4 mr-1 text-blue-400" />
                    Twitter
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      name="socialMedia.twitter"
                      value={userData.socialMedia.twitter.replace('@', '')}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 pl-7 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    <TikTok />
                    TikTok
                  </label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      name="socialMedia.tiktok"
                      value={userData.socialMedia.tiktok.replace('@', '')}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 pl-7 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center">
                  <Tooltip content="Connect your social accounts to enable cross-posting and analytics">
                    <div className="flex items-center">
                      <Info className="h-4 w-4 mr-1" />
                      Social Media Integration
                    </div>
                  </Tooltip>
                </h4>
                <p className="text-xs text-indigo-700">
                  Link your social media accounts to enable cross-posting, performance analytics, and audience insights.
                </p>
                <div className="mt-3 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs flex items-center bg-white transition-all duration-300 hover:-translate-y-1"
                  >
                    <Instagram className="h-3.5 w-3.5 mr-1 text-pink-500" />
                    Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs flex items-center bg-white transition-all duration-300 hover:-translate-y-1"
                  >
                    <Twitter className="h-3.5 w-3.5 mr-1 text-blue-400" />
                    Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs flex items-center bg-white transition-all duration-300 hover:-translate-y-1"
                  >
                    <TikTok />
                    Connect
                  </Button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div 
              id="preferences" 
              className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 transition-all duration-500 ${
                activeSection === 'preferences' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              } opacity-0 animate-fade-in`}
              style={{
                animationDelay: '0.3s',
                animationFillMode: 'forwards'
              }}
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Bell className="h-4 w-4 mr-1 text-indigo-600" />
                      Email Notifications
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your account activity</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${userData.preferences.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${userData.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Globe className="h-4 w-4 mr-1 text-indigo-600" />
                      Public Profile
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to view your profile and content</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('publicProfile')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${userData.preferences.publicProfile ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${userData.preferences.publicProfile ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Moon className="h-4 w-4 mr-1 text-indigo-600" />
                      Dark Mode
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Use dark theme for the interface</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleToggle('darkMode')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${userData.preferences.darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${userData.preferences.darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Security */}
            <div 
              id="security" 
              className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 transition-all duration-500 ${
                activeSection === 'security' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 hidden'
              } opacity-0 animate-fade-in`}
              style={{
                animationDelay: '0.3s',
                animationFillMode: 'forwards'
              }}
            >
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-indigo-600" />
                Security Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Password</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Current Password</label>
                      <input
                        type="password"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">New Password</label>
                      <input
                        type="password"
                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-shadow duration-200"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="transition-all duration-300 hover:-translate-y-1"
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account by enabling two-factor authentication.</p>
                  <Button 
                    variant="outline"
                    className="transition-all duration-300 hover:-translate-y-1"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Enable 2FA
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Sessions</h4>
                  <p className="text-sm text-gray-500 mb-4">Manage your active sessions and sign out from other devices.</p>
                  <Button 
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:-translate-y-1"
                  >
                    Sign Out All Other Devices
                  </Button>
                </div>
              </div>
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