import React from 'react';
import { Metadata } from 'next';
import MarkdownContent from '@/components/ui/markdown-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

const helpContent = `
# THE WAY Help Center

Welcome to our Help Center. Here you'll find answers to common questions and guides to help you make the most of THE WAY platform.

## Getting Started

### Creating an Account

1. Visit our homepage and click "Sign Up"
2. Enter your email address and create a password
3. Verify your email address by clicking the link sent to your inbox
4. Complete your profile to get started

### Navigating the Platform

- **Dashboard**: Your central hub for accessing all features
- **Gallery**: View and manage your generated content
- **Create**: Start new creative projects

## Features

### Image Generation

Our AI-powered image generation tools let you create stunning visuals:

1. Choose a model or style
2. Enter a detailed text prompt describing what you want
3. Adjust settings like resolution and style strength
4. Generate and download your images

### Video Creation

Transform your images into dynamic videos:

1. Upload or select an existing image
2. Choose animation style and duration
3. Add music or sound effects (optional)
4. Generate and preview your video
5. Download or share directly to social media

### Model Training

Create your own custom AI models:

1. Gather 15-20 high-quality reference images
2. Upload images in the Models section
3. Configure training parameters
4. Start training and wait for completion
5. Use your custom model to generate personalized content

## Troubleshooting

### Common Issues

- **Generation Failed**: Check your prompt for prohibited content or try simplifying it
- **Slow Processing**: Large resolutions or complex prompts may take longer to process
- **Login Problems**: Reset your password or check your email verification status

### Contact Support

If you need additional help, contact our support team at support@theway.ai
`;

const faqContent = `
## Frequently Asked Questions

### General

**Q: Is THE WAY free to use?**  
A: We offer both free and premium tiers. Free accounts have limited generations per month, while premium subscriptions offer more generations and advanced features.

**Q: What browsers are supported?**  
A: THE WAY works best on Chrome, Firefox, Safari, and Edge. Make sure you're using the latest version for optimal performance.

### Content Creation

**Q: How do I improve my generation results?**  
A: Write detailed, descriptive prompts. Include art style, lighting, composition, and other specific details to guide the AI.

**Q: Can I edit generated images?**  
A: Yes! Use our photo editor to make adjustments, or try regenerating with a refined prompt.

**Q: What image formats can I export?**  
A: You can download your creations as JPG, PNG, or WEBP files.

### Account Management

**Q: How do I change my password?**  
A: Go to Profile → Settings → Security, then click "Change Password."

**Q: Can I delete my account?**  
A: Yes. In Settings → Account, scroll to the bottom and click "Delete Account." This action is permanent.

**Q: How can I upgrade my subscription?**  
A: Visit the Subscription page from your Profile menu to view available plans and upgrade options.
`;

export const metadata = {
  title: 'Help Center | THE WAY',
  description: 'Get help and support for THE WAY platform',
};

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Help Center</h1>
        
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for help topics..." 
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <Tabs defaultValue="guides" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <TabsContent value="guides">
            <MarkdownContent content={helpContent} className="prose-lg" />
          </TabsContent>
          <TabsContent value="faq">
            <MarkdownContent content={faqContent} className="prose-lg" />
          </TabsContent>
        </Tabs>
        
        <div className="bg-indigo-50 rounded-lg p-6 mt-12 text-center">
          <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
          <p className="mb-4">Our support team is available to assist you with any questions or issues.</p>
          <a 
            href="mailto:support@theway.ai" 
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
} 