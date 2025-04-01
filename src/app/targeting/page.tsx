'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

type AudiencePersona = {
  id: string;
  name: string;
  description: string;
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
    income: string;
    education: string;
  };
  interests: string[];
  painPoints: string[];
  goals: string[];
  platforms: {
    name: string;
    usage: 'high' | 'medium' | 'low';
  }[];
  contentPreferences: string[];
};

export default function TargetingPage() {
  // Example audience personas for presentation
  const [personas, setPersonas] = useState<AudiencePersona[]>([
    {
      id: '1',
      name: 'Tech-Savvy Professionals',
      description: 'Young professionals in tech industries who are early adopters of new technologies and digital tools.',
      demographics: {
        ageRange: '25-34',
        gender: 'Mixed (55% male, 45% female)',
        location: 'Urban areas, tech hubs',
        income: '$75,000 - $150,000',
        education: "Bachelor's degree or higher"
      },
      interests: ['Technology trends', 'Productivity tools', 'Career advancement', 'Fitness', 'Travel'],
      painPoints: ['Limited time', 'Work-life balance', 'Information overload', 'Career advancement pressure'],
      goals: ['Career growth', 'Work-life balance', 'Learning new skills', 'Network expansion'],
      platforms: [
        { name: 'LinkedIn', usage: 'high' },
        { name: 'Twitter', usage: 'high' },
        { name: 'Instagram', usage: 'medium' },
        { name: 'TikTok', usage: 'low' },
      ],
      contentPreferences: ['How-to guides', 'Industry insights', 'Data-driven content', 'Quick visual content', 'Podcasts'],
    },
    {
      id: '2',
      name: 'Health-Conscious Parents',
      description: 'Parents focused on wellness for themselves and their families, seeking healthy lifestyle solutions.',
      demographics: {
        ageRange: '30-45',
        gender: 'Mixed (65% female, 35% male)',
        location: 'Suburban areas',
        income: '$60,000 - $120,000',
        education: 'Mixed education levels',
      },
      interests: ['Family wellness', 'Nutrition', 'Parenting tips', 'Fitness', 'Work-life balance'],
      painPoints: ['Time constraints', 'Budget concerns', 'Meal planning', 'Childcare challenges'],
      goals: ['Healthy family lifestyle', 'Quality family time', 'Personal wellness', 'Efficiency in daily routine'],
      platforms: [
        { name: 'Facebook', usage: 'high' },
        { name: 'Instagram', usage: 'high' },
        { name: 'Pinterest', usage: 'high' },
        { name: 'YouTube', usage: 'medium' },
      ],
      contentPreferences: ['Practical tips', 'Quick recipes', 'Family activity ideas', 'Product reviews', 'Inspirational stories'],
    },
    {
      id: '3',
      name: 'Creative Entrepreneurs',
      description: 'Independent business owners in creative fields looking to grow their brand and customer base.',
      demographics: {
        ageRange: '28-40',
        gender: 'Mixed (55% female, 45% male)',
        location: 'Urban and suburban areas',
        income: '$40,000 - $100,000',
        education: 'Varied, often self-taught',
      },
      interests: ['Design trends', 'Business growth', 'Marketing', 'Creative inspiration', 'Networking'],
      painPoints: ['Client acquisition', 'Pricing services', 'Work consistency', 'Business management'],
      goals: ['Business growth', 'Creative fulfillment', 'Financial stability', 'Brand recognition'],
      platforms: [
        { name: 'Instagram', usage: 'high' },
        { name: 'Pinterest', usage: 'high' },
        { name: 'TikTok', usage: 'medium' },
        { name: 'LinkedIn', usage: 'medium' },
      ],
      contentPreferences: ['Visual portfolios', 'Business tips', 'Behind-the-scenes content', 'Tutorials', 'Success stories'],
    },
  ]);

  const [activePersona, setActivePersona] = useState<string>(personas[0].id);
  const [activeTab, setActiveTab] = useState('overview');

  const selectedPersona = personas.find(p => p.id === activePersona);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'interests', label: 'Interests & Goals' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'content', label: 'Content Strategy' },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Audience Targeting</h1>
          <Button>Create New Persona</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona Cards */}
          <div className="md:col-span-1 space-y-4">
            {personas.map((persona) => (
              <div 
                key={persona.id} 
                className={`rounded-lg border p-4 cursor-pointer transition-all ${
                  activePersona === persona.id 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700'
                }`}
                onClick={() => setActivePersona(persona.id)}
              >
                <h3 className="text-lg font-medium">{persona.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{persona.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs dark:bg-gray-800 dark:text-gray-200">
                    {persona.demographics.ageRange}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs dark:bg-gray-800 dark:text-gray-200">
                    {persona.platforms.filter(p => p.usage === 'high').map(p => p.name).join(', ')}
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900">
              <div className="flex flex-col items-center justify-center py-3">
                <div className="rounded-full bg-gray-100 p-2 dark:bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">Add New Persona</p>
              </div>
            </div>
          </div>

          {/* Persona Details */}
          {selectedPersona && (
            <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                          : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedPersona.name}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedPersona.description}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Demographics</h3>
                        <ul className="mt-2 space-y-1">
                          <li className="text-sm"><span className="font-medium">Age:</span> {selectedPersona.demographics.ageRange}</li>
                          <li className="text-sm"><span className="font-medium">Gender:</span> {selectedPersona.demographics.gender}</li>
                          <li className="text-sm"><span className="font-medium">Location:</span> {selectedPersona.demographics.location}</li>
                        </ul>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Platforms</h3>
                        <ul className="mt-2 space-y-1">
                          {selectedPersona.platforms
                            .filter(p => p.usage === 'high')
                            .map(platform => (
                              <li key={platform.name} className="text-sm">{platform.name}</li>
                            ))}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Content Recommendations</h3>
                      <ul className="mt-2 space-y-1">
                        {selectedPersona.contentPreferences.slice(0, 3).map((pref, index) => (
                          <li key={index} className="text-sm">{pref}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'demographics' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Demographic Profile</h2>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age Range</h3>
                          <p className="mt-1">{selectedPersona.demographics.ageRange}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</h3>
                          <p className="mt-1">{selectedPersona.demographics.gender}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                          <p className="mt-1">{selectedPersona.demographics.location}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Income Level</h3>
                          <p className="mt-1">{selectedPersona.demographics.income}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Education</h3>
                          <p className="mt-1">{selectedPersona.demographics.education}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="mr-2">Edit Demographics</Button>
                      <Button variant="outline">Advanced Analytics</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'interests' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                        <h3 className="font-medium">Interests</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPersona.interests.map((interest, index) => (
                            <span key={index} className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-200">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                        <h3 className="font-medium">Pain Points</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPersona.painPoints.map((point, index) => (
                            <span key={index} className="px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs dark:bg-red-900 dark:text-red-200">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <h3 className="font-medium">Goals</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedPersona.goals.map((goal, index) => (
                          <span key={index} className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs dark:bg-green-900 dark:text-green-200">
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline">Edit Interests & Goals</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'platforms' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Platform Usage</h2>
                    <div className="rounded-lg border border-gray-200 overflow-hidden dark:border-gray-800">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Platform
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Usage Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                              Recommendation
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-950 dark:divide-gray-800">
                          {selectedPersona.platforms.map((platform) => (
                            <tr key={platform.name}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {platform.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  platform.usage === 'high' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : platform.usage === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {platform.usage.charAt(0).toUpperCase() + platform.usage.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {platform.usage === 'high' ? 'Primary focus' : platform.usage === 'medium' ? 'Secondary focus' : 'Limited engagement'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline">Edit Platform Strategy</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Content Strategy</h2>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Recommended Content Types</h3>
                      <div className="mt-2 space-y-2">
                        {selectedPersona.contentPreferences.map((pref, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <p className="text-sm">{pref}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Messaging Guidelines</h3>
                      <div className="mt-2 space-y-2">
                        <p className="text-sm">When creating content for {selectedPersona.name}, focus on addressing their key pain points: {selectedPersona.painPoints.join(', ')}.</p>
                        <p className="text-sm">Message tone should be professional but approachable, with emphasis on practical solutions and actionable insights.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button>Generate Content Ideas</Button>
                      <Button variant="outline">Edit Strategy</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 