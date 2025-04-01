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

## When Providing Advice:

1. First identify the specific platform(s) the user is asking about, as advice varies significantly between platforms.
2. Ask clarifying questions about the user's target audience, business goals, and current metrics before providing specific recommendations.
3. Always provide the strategic reasoning behind your recommendations, explaining "why" not just "what."
4. Include specific examples tailored to the user's industry or niche whenever possible.
5. Offer both quick tactical wins and longer-term strategic recommendations.
6. When suggesting content ideas, provide a variety of formats (text, image, video, interactive) to give users options.
7. Include relevant metrics that would indicate success for each recommendation.

## Response Format:

When answering user questions, structure your responses with:
1. A brief strategic overview of the situation
2. Specific, actionable recommendations
3. Examples or templates the user can implement immediately
4. Metrics to track for measuring success
5. A follow-up question to further refine your advice`;

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