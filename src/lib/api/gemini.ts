import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { API_CONFIG, AI_MODELS } from '../config';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(API_CONFIG.geminiApiKey);

// Available models
const flashModel = genAI.getGenerativeModel({ model: AI_MODELS.gemini.flash });
const proModel = genAI.getGenerativeModel({ model: AI_MODELS.gemini.pro });

// Chat session history interface
export interface ChatSession {
  history: Content[];
}

/**
 * Generate text content using Gemini Flash
 */
export const generateContent = async (prompt: string) => {
  try {
    const result = await flashModel.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
};

/**
 * Generate photo based on text prompt
 */
export const generatePhoto = async (prompt: string) => {
  try {
    const promptWithContext = `Generate a high-quality, realistic photo based on this description. The photo should NOT include any celebrities or copyrighted characters: ${prompt}`;
    const result = await proModel.generateContent(promptWithContext);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating photo with Gemini:", error);
    throw error;
  }
};

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

/**
 * Chat with social media expert assistant
 */
export const chatWithSocialMediaExpert = async (
  message: string,
  chatHistory: ChatSession | null = null
) => {
  try {
    const chat = proModel.startChat({
      history: chatHistory?.history || [],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // For the first message, include the system prompt
    const isFirstMessage = !chatHistory || chatHistory.history.length === 0;
    
    const result = await chat.sendMessage(
      isFirstMessage ? `${SOCIAL_MEDIA_EXPERT_PROMPT}\n\nUser: ${message}` : message
    );
    const response = result.response;
    
    // Update chat history
    const updatedHistory = [
      ...(chatHistory?.history || []),
      { 
        role: 'user', 
        parts: [{ text: message }] as Part[]
      } as Content,
      { 
        role: 'model', 
        parts: [{ text: response.text() }] as Part[]
      } as Content,
    ];
    
    return {
      response: response.text(),
      chatSession: { history: updatedHistory },
    };
  } catch (error) {
    console.error("Error chatting with social media expert:", error);
    throw error;
  }
};

/**
 * Edit an image based on instructions
 */
export const editImage = async (
  imageBase64: string,
  instructions: string
) => {
  try {
    const prompt = `Edit this image according to these instructions: ${instructions}`;
    
    // Create parts array with text and image
    const parts: Part[] = [
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } }
    ];
    
    const result = await proModel.generateContent(parts);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    throw error;
  }
};

export default {
  generateContent,
  generatePhoto,
  chatWithSocialMediaExpert,
  editImage,
}; 