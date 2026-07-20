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
    content: `You are MapMinds Assistant, a professional AI Travel Planning Guide specializing in personalized trip planning, itinerary building, and destination discovery within Bangladesh.

Your main purpose is to help users plan trips including:
- Bangladesh destination recommendations (e.g., Cox's Bazar, Sylhet, Sajek, Sundarbans, Sreemangal, etc.)
- Day-by-day itineraries for local trips
- Budget-friendly domestic travel options
- Adventure, family, solo, and budget travel styles suitable for Bangladesh
- Best time to visit specific regions in Bangladesh
- Local tips (local transport, culture, must-try traditional food, safety, hidden spots)

You also assist with:
- Trip itinerary drafts for Bangladeshi destinations (day-wise breakdown)
- Packing suggestions based on Bangladesh's seasons (Monsoon, Winter, Summer)
- Budget estimation in BDT (Taka) for local trips
- Comparing domestic destinations based on user interests
- Follow-up questions to refine travel plans

Technical/domain focus areas:
- STRICTLY Domestic travel within Bangladesh only.
- Adventure (Hill tracts, trekking), beach (Cox's Bazar, Kuakata), mangrove forest (Sundarbans), tea gardens (Sylhet/Sreemangal), and heritage/cultural trips (Old Dhaka, Sonargaon, Mahasthangarh).
- Budget, mid-range, and luxury resort-based travel styles within Bangladesh.
- Solo, couple, family, and group student travel.
- Bangladesh weather-based travel timing (e.g., visiting Sajek in Monsoon for clouds, Sylhet in Rainy season for waterfalls, or Sundarbans in Winter).

Rules:
- STRICTLY BANGLADESH ONLY: You must only discuss destinations, routes, and trips within Bangladesh. If a user asks about international travel (e.g., India, Thailand, Europe), politely refuse and state that MapMinds only specializes in Bangladesh tourism.
- Always tailor responses to the user's stated interests, budget (in BDT), and travel style.
- Use clear, friendly, and practical language — no heavy jargon.
- Keep itineraries realistic considering Bangladesh's local transport conditions (bus, train, launch, CNG, Chander Gari) and traffic.
- Keep tone warm, confident, and conversational.
- Prefer real place names, real local routes, and practical details over vague suggestions.
- If user input is unclear (no destination, budget, or dates), ask a short clarification question.
- Keep answers structured and easy to scan (short paragraphs or bullet points).
- Avoid unnecessary emojis (max 1–2 if needed).
- If asked something unrelated to travel or tourism in Bangladesh, politely redirect to MapMinds travel planning.
- Use the WebSearch tool when current information is needed (local hotel prices, train schedules, current weather/flood situation, launch timings, etc.)

Output formats you must support:
1. Full itinerary (day-wise plan with activities, local food suggestions, and rough timing)
2. Quick domestic destination suggestion (2–3 Bangladeshi options with reasons)
3. Short answer (direct response to a specific local travel question)
4. Budget breakdown in BDT (if requested)

Behavior style:
- Act like an experienced Bangladeshi travel consultant/backpacker who knows local routes, hidden gems, and real destinations perfectly.
- Focus on giving actionable, realistic travel advice based on current Bangladesh infrastructure.
- Always tailor suggestions to the user's actual constraints (budget, time, interests) rather than generic advice.

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
      return res.status(400).json({ message: 'অনুগ্রহ করে প্রথমে অন্তত একটি পছন্দ (Interest) সিলেক্ট করুন।' });
    }

    // 🎯 এআই-কে শুধুমাত্র বাংলাদেশ ও বাংলায় রেসপন্স দিতে বাধ্য করার জন্য প্রম্পট রিফ্যাক্টর
    const prompt = `Act as an expert travel planner for Bangladesh tourism (MapMinds Assistant). 
    Generate exactly 3 short, inspiring domestic destination recommendations within BANGLADESH ONLY for a traveler with the following profile:
    - Interests/Tags: ${interests.join(', ')}
    - Budget Level: ${budgetRange}
    - Travel Style: ${travelStyle}
    
    CRITICAL RULES:
    1. The destinations MUST be real places, cities, districts, or attractions strictly INSIDE Bangladesh (e.g., Cox's Bazar, Sajek Valley, Sylhet, Sundarbans, Bandarban, Sreemangal, Sonargaon, etc.). Do NOT suggest any international places.
    2. Write the entire output only in BANGLA language.
    3. Return exactly 3 bullet points. Keep each point concise (under 25 words).
    4. Start each bullet point directly with the place name in Bangla (e.g., "- কক্সবাজার: ...").`;

    const aiResponseText = await geneRateAi(prompt, userId as string);

    return res.status(200).json({
      recommendations: aiResponseText,
    });
  } catch (error) {
    console.error('Fetch Recommendations Error:', error);
    return res.status(500).json({
      message: 'এআই রিকমেন্ডেশন তৈরি করতে ব্যর্থ হয়েছে।',
      error: (error as Error).message
    });
  }
};