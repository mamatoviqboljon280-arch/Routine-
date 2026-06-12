import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. AI responses will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getAIClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI Advisor
  app.post("/api/advisor", async (req, res) => {
    try {
      const { type, todayTasks, yesterdayPerformance, dayOfWeek, userQuery, chatHistory } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({
          text: `⚠️ **API Key Missing**: The server's \`GEMINI_API_KEY\` environment variable is not defined. 
          Please add a valid Gemini key in the **Settings > Secrets** panel of Google AI Studio. 
          
          Meanwhile, here is an example recommendation:
          "Today is a new day! Since we can't access the AI, let's keep it simple. Prioritize 1 fitness block and 1 meal block. You got this!"`
        });
      }

      const baseSystemPrompt = `You are a warm, highly empathetic, practical, and encouraging personal productivity advisor.
Your tone should be friendly, conversational, specifically human (like a close supportive friend) and never robotic, generic, or overly formal.
Always give specific, actionable, and gentle advice. Refer to the user's routine directly.
Do NOT use overly formal lists, jargon, or robotic templates. Focus on keeping the user motivated, but also allow them to rest when needed.
Today is ${dayOfWeek}.`;

      let prompt = "";

      if (type === 'morning_plan') {
        prompt = `Generate a personalized "Today's Plan" message.
Here is today's schedule of tasks for this ${dayOfWeek}:
${JSON.stringify(todayTasks, null, 2)}

Here is yesterday's performance:
${yesterdayPerformance ? JSON.stringify(yesterdayPerformance, null, 2) : "No data for yesterday (first day!). Give them an encouraging kickoff!"}

Based on this:
1. Greet them warmly and acknowledge the day of the week (e.g., lighter if weekend, focused but supportive if weekday).
2. Highlight a pattern or provide motivational encouragement (e.g. "We noticed you missed your workout 2 days in a row — today is a good day to get back on track. Start with just 20 minutes.").
3. Call out specific tasks from today's routine (e.g. specific meals, work blocks, morning or evening routines).
4. Give warm, actionable advice on pacing.
5. Provide a beautiful, short motivational motto or sentence to close.

Keep the length of the message to around 150-220 words. Use clear paragraphs with subtle bold styling. Do NOT use generic markdown bullet items unless they represent a clear timeline.`;
      } else if (type === 'ask_ai') {
        prompt = `The user is asking for customized, real-time advice.
Here is today's plan/routine for ${dayOfWeek}:
${JSON.stringify(todayTasks, null, 2)}

User question: "${userQuery}"

Answer their question by acting as their friendly routine advisor. If they are tired, recommend what to skip, adjust, or postpone. Give them a highly custom evening routine, mental health tip, or workout scaling, etc. Maintain a warm, wise, non-robotic, encouraging conversational response. Format clearly in 2-3 short, friendly paragraphs.`;
      }

      const contentsList: any[] = [];
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach((msg: any) => {
          contentsList.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }
      contentsList.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsList,
        config: {
          systemInstruction: baseSystemPrompt,
          temperature: 0.75,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Advisor error:", error);
      res.status(500).json({ error: error.message || "Failed to generate advice." });
    }
  });

  // Serve static UI / Dev Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
