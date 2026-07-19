import { Request, Response } from 'express';
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";
import User from "../models/User";

const GROQ_API_KEY = process.env.GROQ_API_KEY
const TAVILY_API_KEY = process.env.TAVILY_API_KEY

const groq = new Groq({ apiKey: GROQ_API_KEY });
const tvly = tavily({ apiKey: TAVILY_API_KEY });

// ২৪ ঘণ্টার জন্য ক্যাশ মেমরি কনফিগারেশন
const cache = new NodeCache({ stdTTL: 60 * 30 * 24 });

// এআই-এর সিস্টেম ও বেইজ বিহেভিয়ার প্রম্পট
const Basemessenges = [
  {
    role: "assistant",
    content: `You are TrailMind Assistant, a professional AI Travel Planning Guide specializing in personalized trip planning, itinerary building, and destination discovery.

Your main purpose is to help users plan trips including:
- Destination recommendations
- Day-by-day itineraries
- Budget-friendly travel options
- Adventure, family, solo, and luxury travel styles
- Best time to visit specific places
- Local tips (weather, culture, must-see spots)

You also assist with:
- Trip itinerary drafts (day-wise breakdown)
- Packing suggestions based on destination and season
- Budget estimation for trips
- Comparing destinations based on user interests
- Follow-up questions to refine travel plans

Technical/domain focus areas:
- Domestic and international travel
- Adventure, beach, mountain, city, and cultural trips
- Budget, mid-range, and luxury travel styles
- Solo, couple, family, and group travel
- Seasonal and weather-based travel timing

Rules:
- Always tailor responses to the user's stated interests, budget, and travel style
- Use clear, friendly, and practical language — no jargon
- Keep itineraries realistic (travel time, rest, local pace)
- Keep tone warm, confident, and conversational
- Prefer real destination names, real seasons, and practical details over vague suggestions
- If user asks in Bangla, respond in Bangla
- If user input is unclear (no destination, budget, or dates), ask a short clarification question
- Keep answers structured and easy to scan (short paragraphs or bullet points)
- Avoid unnecessary emojis (max 1–2 if needed)
- If asked something unrelated to travel, politely redirect to travel planning
- Use the WebSearch tool when current information is needed (prices, weather, events, opening hours, visa rules, etc.)

Output formats you must support:
1. Full itinerary (day-wise plan with activities and rough timing)
2. Quick destination suggestion (2–3 options with reasons)
3. Short answer (direct response to a specific question)
4. Budget breakdown (if requested)

Behavior style:
- Act like an experienced travel consultant who knows real destinations well
- Focus on giving actionable, bookable, realistic travel advice
- Always tailor suggestions to the user's actual constraints (budget, time, interests) rather than generic advice ,
Language Mandate:
- You must speak, reply, and think only in Bangla for all interactions.
Current Date: ${new Date().toISOString()}`,
  },
];


export async function geneRateAi(usermessage: string, UserMessageId: string): Promise<string | null> {
  console.log("User Question:", usermessage);

  const cachedMessages = cache.get(UserMessageId) as any[];
  const messages = cachedMessages ? [...cachedMessages] : [...Basemessenges];

  messages.push({
    role: "user",
    content: usermessage,
  });

  const max_tries = 10;
  let attempt = 0;

  while (attempt < max_tries) {
    attempt++;

    const chatCompletion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "WebSearch",
            description: "Get Current Data from internet about question asked by user",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to look up the information.",
                },
              },
              required: ["query"]
            }
          }
        }
      ],
      tool_choice: "auto",
    });

    const aiMessage = chatCompletion.choices[0]?.message;
    if (!aiMessage) break;

    messages.push(aiMessage);
    const toolsCall = aiMessage.tool_calls;

    if (!toolsCall) {
      cache.set(UserMessageId, messages);
      return aiMessage.content;
    }

    for (const tool of toolsCall) {
      const toolName = tool.function.name;
      const toolArguments = tool.function.arguments;

      if (toolName === "WebSearch") {
        const parsedArgs = JSON.parse(toolArguments);
        const toolResponse = await WebSearch(parsedArgs);

        messages.push({
          tool_call_id: tool.id,
          role: 'tool',
          name: toolName,
          content: JSON.stringify(toolResponse),
        });
      }
    }
  }

  return "You have reached the maximum number of attempts. Please try again later.";
}


async function WebSearch({ query }: { query: string }): Promise<string> {
  try {
    const response = await tvly.search(query);
    return response.results.map(result => result.content).join("\n\n");
  } catch (error) {
    console.error("Tavily Search Error:", error);
    return "Failed to fetch live web data.";
  }
}


export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const { userId, interests, budgetRange, travelStyle } = req.body;
    console.log("user", userId)
    const createdBy = userId
    console.log("createdBy", createdBy)

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      createdBy,
      {
        $set: {
          'preferences.interests': interests,
          'preferences.budgetRange': budgetRange,
          'preferences.travelStyle': travelStyle,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error('Update Preferences Error:', error);
    return res.status(500).json({
      message: 'Failed to update preferences',
      error: (error as Error).message
    });
  }
};


export const fetchRecommendations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID query parameter is required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { interests = [], budgetRange = 'moderate', travelStyle = 'balanced' } = user.preferences || {};

    if (interests.length === 0) {
      return res.status(400).json({ message: 'Please select at least one interest first.' });
    }
    const prompt = `Act as an expert travel planner. Generate 3 short, inspiring destination recommendations (bullet points only) for a traveler with the following profile:
    - Interests: ${interests.join(', ')}
    - Budget: ${budgetRange}
    - Travel Style: ${travelStyle}
    Keep each point concise, under 20 words, and start directly with the country/city name.`;
    const aiResponseText = await geneRateAi(prompt, userId as string);

    return res.status(200).json({
      recommendations: aiResponseText,
    });
  } catch (error) {
    console.error('Fetch Recommendations Error:', error);
    return res.status(500).json({
      message: 'Failed to generate AI recommendations',
      error: (error as Error).message
    });
  }
};