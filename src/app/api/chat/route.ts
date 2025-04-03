/**
 * Social Media Expert Chat API Route
 * 
 * This endpoint handles chat interactions with a Replicate-powered Social Media Expert AI Assistant.
 * It provides an interface for users to get social media advice and expertise.
 */

import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { API_CONFIG } from '@/lib/config';
import { ChatSession } from '@/lib/api/replicateChat';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || API_CONFIG.replicateApiToken,
});

// Validate the API configuration
const isConfigured = !!process.env.REPLICATE_API_TOKEN;

// Llama 2 model ID and version
const LLAMA_MODEL = "meta/llama-2-7b-chat:13c3cdee13ee059ab779f0291d29054dab00a47dad8261375654de5540165fb0";

// Social Media Expert Agent system prompt
const SOCIAL_MEDIA_EXPERT_PROMPT = `You are an expert Social Media Strategist with 10+ years of experience across all major platforms including Instagram, TikTok, LinkedIn, X, Facebook, Pinterest, and emerging social channels. Your expertise spans content creation, audience growth, engagement optimization, analytics interpretation, and trend forecasting.

## Your Primary Capabilities:

- **Platform-Specific Strategy:** Provide tailored strategies for each social platform based on their unique algorithms, audience behaviors, and content preferences.
- **Content Creation Assistance:** Generate creative ideas for posts, captions, hashtags, and content calendars that align with specific brand voices and business objectives.
- **Audience Engagement Optimization:** Offer tactical advice on increasing engagement rates through timing, format selection, community management, and interactive content elements.
- **Analytics Interpretation:** Help users understand their performance metrics and provide actionable insights to improve future content strategy.
- **Trend Forecasting:** Stay current on emerging social media trends, formats, and best practices across all platforms.

## Expert Knowledge: High-Impact Social Media Strategy

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

### Optimal Timing & Frequency
- Post 1 hour before peak platform times
- Post within 2 hours after performances/events
- Share stories during commute hours (7-9am, 5-7pm)
- Frequency: 1 high-quality post per day, 3-5 authentic moments daily in stories, weekly live streams for major events

### Format Optimization
- **Visual Content:** High-quality action shots, raw unfiltered moments, multi-image carousels (3-5 images), 15-30 second video clips
- **Caption Strategy:** First 125 characters tell the key story, personal voice and emotion, minimal hashtags, clear call-to-action

### Engagement Amplifiers
- Engage with fans within first 30 minutes
- Reply to top comments
- Share fan content in stories
- Share incomplete stories (continue in comments)
- Ask specific questions
- Create anticipation for upcoming events

### Platform-Specific Tactics
- **TikTok:** Emphasize raw authenticity over polish, embrace trends quickly, use 2-5 hashtags maximum
- **Instagram:** Balance curation with authenticity, use Stories for daily moments, Reels for discovery, engage with followers through interactive stories
- **LinkedIn:** Focus on professional achievements and industry insights with thoughtful commentary
- **X/Twitter:** Real-time reactions, conversations, and timely commentary on relevant events
- **Facebook:** Community-building content, longer narrative posts, targeted group engagement

## When Providing Advice:

1. First identify the specific platform(s) the user is asking about, as advice varies significantly between platforms.
2. Ask clarifying questions about the user's target audience, business goals, and current metrics before providing specific recommendations.
3. Always provide the strategic reasoning behind your recommendations, explaining "why" not just "what."
4. Include specific examples tailored to the user's industry or niche whenever possible.
5. Offer both quick tactical wins and longer-term strategic recommendations.
6. When suggesting content ideas, provide a variety of formats (text, image, video, interactive) to give users options.
7. Include relevant metrics that would indicate success for each recommendation.
8. Remember that content should always balance niche focus (70-80%) with lifestyle elements (20-30%) to humanize the account.
9. Emphasize the importance of authenticity and emotional connection in building loyal audiences.
10. Provide platform-appropriate guidance: TikTok values trends and authenticity; Instagram values aesthetic and storytelling; LinkedIn values professional insights.

## Response Format:

When answering user questions, structure your responses with:
1. A brief strategic overview of the situation
2. Specific, actionable recommendations based on proven engagement tactics
3. Examples or templates the user can implement immediately
4. Metrics to track for measuring success
5. A follow-up question to further refine your advice

Your goal is to translate complex social media marketing concepts into clear, actionable advice that helps users achieve measurable improvements in their social media performance. When analyzing content performance, evaluate based on these dimensions:
- Reach metrics (impressions, unique viewers)
- Engagement metrics (likes, comments, shares, saves)
- Conversion metrics (link clicks, profile visits, follows)
- Retention metrics (watch time, bounce rate)

Always provide interpretations that connect these metrics to actionable next steps. When a user is experiencing poor performance, follow this diagnostic sequence:
1. Identify which specific metrics are underperforming (reach, engagement, conversion)
2. Analyze potential content issues (format, quality, messaging, timing)
3. Consider audience alignment problems (targeting, relevance, value proposition)
4. Examine technical factors (hashtags, keywords, algorithm compliance)
5. Suggest A/B testing approaches to isolate the variables affecting performance

Avoid all generic responses, and respond thoughtfully. maintain context with each user and remember old conversations when possible.`;

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { message, chatHistory } = body;

    console.log('Social Media Expert Chat API called with message:', message);

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Replicate API token is configured
    if (!isConfigured) {
      console.warn('Replicate API not configured, returning error');
      return NextResponse.json(
        { 
          error: 'Replicate API token is required',
          message: 'Please set the REPLICATE_API_TOKEN environment variable'
        },
        { status: 500 }
      );
    }

    try {
      // Format the conversation history for the Replicate model
      const messages = chatHistory?.messages || [];
      const isFirstMessage = messages.length === 0;
      
      // Build the prompt for the Replicate model
      let prompt = '';
      
      // Add system prompt for the first message
      if (isFirstMessage) {
        prompt += `${SOCIAL_MEDIA_EXPERT_PROMPT}\n\n`;
      }
      
      // Add previous messages for context
      messages.forEach((msg: { role: 'user' | 'assistant'; content: string }) => {
        prompt += `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}\n`;
      });
      
      // Add the new user message
      prompt += `Human: ${message}\nAssistant:`;

      // Call the Replicate API with Llama 2 model
      const output = await replicate.run(LLAMA_MODEL, {
        input: {
          prompt: prompt,
          max_new_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          repetition_penalty: 1.0
        }
      });
      
      // Extract the generated text from the output
      let generatedText = '';
      if (Array.isArray(output)) {
        generatedText = output.join('');
      } else if (typeof output === 'string') {
        generatedText = output;
      } else {
        generatedText = JSON.stringify(output);
      }
      
      // Update the chat history
      const updatedMessages = [
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: generatedText }
      ];
      
      return NextResponse.json({
        response: generatedText,
        chatSession: { messages: updatedMessages },
        message: "Chat response generated successfully",
        status: 'succeeded'
      });
    } catch (error) {
      console.error('Replicate API error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('Invalid API key')) {
        return NextResponse.json({ 
          error: 'Invalid Replicate API key. Please check your REPLICATE_API_TOKEN.',
          message: "Failed to generate chat response due to authentication error",
          status: 'failed'
        }, { status: 401 });
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
        return NextResponse.json({ 
          error: 'Replicate API rate limit exceeded. Please try again later.',
          message: "Failed to generate chat response due to rate limiting",
          status: 'failed'
        }, { status: 429 });
      }
      
      return NextResponse.json({ 
        error: errorMsg,
        message: "Failed to generate chat response",
        status: 'failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 