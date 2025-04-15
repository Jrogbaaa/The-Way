# Social Media Expert Chat Documentation

## Overview

The Social Media Expert Chat is an AI-powered conversation feature that provides professional advice on social media strategy, content creation, audience engagement, analytics interpretation, and trend forecasting. The feature is powered by Replicate's Llama 2 model, which has been specifically instructed to act as an expert social media strategist with 10+ years of experience across all major platforms.

## Features

- **Platform-Specific Strategy**: Tailored advice for Instagram, TikTok, LinkedIn, X, Facebook, Pinterest, and emerging platforms.
- **Content Creation Assistance**: Creative ideas for posts, captions, hashtags, and content calendars aligned with specific brand voices and objectives.
- **Audience Engagement Optimization**: Tactics for increasing engagement through timing, format selection, community management, and interactive content.
- **Analytics Interpretation**: Help understanding performance metrics with actionable insights to improve content strategy.
- **Trend Forecasting**: Current information on emerging social media trends, formats, and best practices.
- **High-Impact Content Strategy**: Data-driven recommendations based on the 20% of content types that drive 80% of engagement.
- **Platform-Optimized Tactics**: Specialized techniques for each platform based on their unique algorithms and audience behaviors.

## Expert Knowledge: High-Impact Social Media Strategy

Our Social Media Expert is now equipped with specialized knowledge of high-impact strategies that drive maximum engagement:

### Content Pillars (The 20% That Drives 80% of Engagement)

1. **Performance/Professional Excellence (40% of posts)**
   - Live/recent performance highlights
   - Behind-the-scenes preparation
   - Professional milestones
   - Training/practice sessions
   - *Why:* Creates aspirational connection and showcases core value proposition

2. **Authentic Personal Moments (30% of posts)**
   - Unscripted family interactions
   - Natural lifestyle moments
   - Raw emotional reactions
   - Personal challenges/victories
   - *Why:* Builds relatability and emotional connection

3. **Team/Peer Interactions (30% of posts)**
   - Genuine moments with teammates
   - Professional collaborations
   - Friendly interactions with peers
   - Group celebrations
   - *Why:* Expands reach and authenticates personal brand

### Meta's Creator & Influencer Strategy

The chatbot has knowledge of Meta's recommended approach for working with creators and influencers:

1. **Meta's 5-Step Creator Strategy**
   - **Selection** – Try creators from outside your usual industry to bring fresh perspectives
   - **Roles** – Use creators in creative ways beyond testimonials (hosts, collaborators, storytellers)
   - **Briefing** – Focus on ideas and creative concepts, not just pushing products directly
   - **Process** – Build long-term relationships with creators rather than one-off campaigns
   - **Tools** – Use Meta's integrated tools to streamline creator partnerships

2. **Partnership Performance Data**
   - 19% lower acquisition costs when using creators
   - 71% higher brand intent lift (increased positive brand perception)

3. **Key Meta Tools**
   - **Creator Content Recommender (CCR)** – AI tool that suggests best-performing creator content for ads using 130+ data points
   - **Partnership Ads Hub** – Dedicated section in Ads Manager for managing permissions and running creator campaigns

4. **Core Message** – Creators are no longer optional but essential to marketing success, with the right partnerships significantly improving performance and reducing ad costs.

### Optimal Timing & Frequency

The expert can advise on scientifically-backed timing strategies:
- Post 1 hour before peak platform times
- Post within 2 hours after performances/events
- Share stories during commute hours (7-9am, 5-7pm)
- Frequency: 1 high-quality post per day, 3-5 authentic moments daily in stories, weekly live streams for major events

### Format Optimization

Recommendations on the most effective content formats:
- **Visual Content:** High-quality action shots, raw unfiltered moments, multi-image carousels (3-5 images), 15-30 second video clips
- **Caption Strategy:** First 125 characters tell the key story, personal voice and emotion, minimal hashtags, clear call-to-action

### Engagement Amplifiers

Tactics to boost interaction with content:
- Engage with fans within first 30 minutes
- Reply to top comments
- Share fan content in stories
- Share incomplete stories (continue in comments)
- Ask specific questions
- Create anticipation for upcoming events

### Platform-Specific Tactics

- **TikTok:** Emphasize raw authenticity over polish, embrace trends quickly, use 2-5 hashtags maximum
- **Instagram:** Balance curation with authenticity, use Stories for daily moments, Reels for discovery
- **LinkedIn:** Focus on professional achievements and industry insights with thoughtful commentary
- **X/Twitter:** Real-time reactions, conversations, and timely commentary on relevant events
- **Facebook:** Community-building content, longer narrative posts, targeted group engagement

## How to Use

1. Navigate to the Chat page using the sidebar or top navigation bar.
2. Enter your social media questions in the text input at the bottom of the screen.
3. Press Enter or click the send button to submit your question.
4. Review the AI's response, which includes:
   - Strategic overview of your situation
   - Specific, data-driven recommendations based on proven engagement tactics
   - Examples or templates you can implement immediately
   - Metrics to track for measuring success
   - Follow-up questions to refine advice

## Examples of Questions

- "How can I increase my Instagram engagement rate?"
- "What are the best practices for TikTok video content in 2024?"
- "How should I interpret a drop in LinkedIn post reach?"
- "Can you suggest a content calendar for a fitness brand?"
- "What hashtag strategy works best for small businesses on Instagram?"
- "How do I improve my conversion rate from social media traffic?"
- "Which content pillars should I focus on for maximum engagement?"
- "What's the ideal posting frequency for my Instagram account?"
- "How can I optimize my captions for better engagement?"
- "What platform-specific tactics should I use for TikTok vs. Instagram?"

## Implementation Details

### Technical Architecture

The Social Media Expert Chat is implemented using:

- Next.js frontend for the chat interface
- Server-side API endpoint for processing requests
- Replicate API with Llama 2 model for generating responses
- State management for chat history persistence

### API Integration

The chat feature communicates with the `/api/chat` endpoint, which processes requests and forwards them to Replicate's API. The implementation includes:

- Message history tracking for contextual conversations
- Error handling and recovery
- Loading states for improved UX
- Special system prompt for the first message to establish expertise

### Conversation Context

The chat maintains context throughout the conversation, allowing the AI to remember:

- Previous questions and its responses
- User-provided information about their audience, goals, and metrics
- Specific platforms or strategies being discussed

## Prompt Engineering

The social media expert is powered by a carefully crafted system prompt that defines:

1. The expert persona with 10+ years of experience
2. Primary capabilities across different aspects of social media
3. High-impact content strategies that drive 80% of engagement
4. Platform-specific tactics optimized for each social network
5. Guidelines for providing advice, including platform identification and reasoning
6. Structured response format with actionable components
7. Diagnostic approaches for troubleshooting poor performance

## Troubleshooting

### Common Issues

- **No response**: Check your internet connection and verify your Replicate API key is correctly set.
- **Generic responses**: Try being more specific about your platform, audience, or goals.
- **Cut-off responses**: For very long responses, the AI might reach token limits. Break complex questions into smaller parts.

### API Key Setup

To use the chat functionality, you need a valid Replicate API key:

1. Obtain a Replicate API key from https://replicate.com
2. Add the key to your `.env` or `.env.local` file as `REPLICATE_API_TOKEN=your-key-here`
3. Restart the development server if it's running

## Extending the Feature

### Adding New Capabilities

To extend the social media expert's capabilities:

1. Modify the system prompt in `src/app/api/chat/route.ts` to include new areas of expertise
2. Update this documentation to reflect new capabilities
3. Consider adding specialized chat modes for different aspects of social media

### Customizing the UI

The chat interface can be customized by editing:

- `app/chat/page.tsx` - The main chat interface component
- CSS styles in the component for appearance adjustments
- Bubble styling and layout in the message rendering section

## Future Enhancements

Planned future enhancements include:

- Saving chat history to user accounts
- Multiple specialized chat agents for different social media aspects
- File upload capability for analyzing social media content
- Integration with analytics platforms for data-driven advice
- Expanded platform coverage for emerging social networks
- Personalization based on user profile and past performance data 