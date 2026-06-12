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
        // High-Quality Rule-Based Heuristic Expert Advice Fallback
        if (type === 'morning_plan') {
          // 1. Warm Greeting & Day of week nuance
          let greeting = `### ☀️ Good morning! Happy ${dayOfWeek || "today"}.\n\n`;
          const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
          if (isWeekend) {
            greeting += `Since it's the weekend, your brain naturally seeks a change of speed. Treat today as a beautiful mix of conscious restoration and lightness.\n\n`;
          } else {
            greeting += `A structured weekday represents a fantastic canvas for focus, growth, and continuous improvement. Let's make steady, incremental progress.\n\n`;
          }

          // 2. Analyze today's task list composition
          let todayFocus = "";
          let workoutTask = todayTasks?.find((t: any) => t.category === 'fitness');
          let workTask = todayTasks?.find((t: any) => t.category === 'work');
          let morningTask = todayTasks?.find((t: any) => t.category === 'morning');
          let eveningTask = todayTasks?.find((t: any) => t.category === 'evening');

          if (todayTasks && todayTasks.length > 0) {
            todayFocus += `You have **${todayTasks.length} habit blocks** programmed today. `;
            if (morningTask) {
              todayFocus += `Start of your day is anchored by **${morningTask.name}**. Setting a quiet, offline intention here will protect your peace high into the afternoon. `;
            }
            if (workTask) {
              todayFocus += `Your primary productivity peak is **${workTask.name}** (${workTask.duration} min). Mute your notifications during this slot to access flow state. `;
            }
            if (workoutTask) {
              todayFocus += `For high energy, respect your scheduled wellness block: **${workoutTask.name}**. Your mind will feel incredibly clear afterward! `;
            } else {
              todayFocus += `We don't see a fitness block today – consider taking a quick 10-minute dynamic stroll outside to stay active. `;
            }
          } else {
            todayFocus += `Your schedule looks incredibly spacious today! Use this open white space on your calendar to reflect, read, and restore your baseline energy. `;
          }
          todayFocus += `\n\n`;

          // 3. Yesterday performance analysis
          let historyInsight = "";
          if (yesterdayPerformance) {
            const completed = yesterdayPerformance.completed || 0;
            const total = yesterdayPerformance.total || 0;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            if (rate >= 80) {
              historyInsight = `### 🏆 Yesterday's Performance Summary\nYou had an outstanding run yesterday, completing **${completed} of ${total} tasks (${rate}%)**! You are building deep, bulletproof consistency. Ride this beautiful momentum, but don't force perfection if you feel a crash coming. Consistency is about averages.\n\n`;
            } else if (rate > 0) {
              historyInsight = `### ⚖️ Maintaining Balanced Rhythm\nYesterday you checked off **${completed} of ${total} blocks (${rate}%)**. That is a wonderful foundation! Don't look at skipped tasks as failures — they are simply calibration data. Let's isolate today's most crucial habit and nail that one first.\n\n`;
            } else {
              historyInsight = `### 🌱 A Clean Canvas Today\nYesterday was a full rest and off-screen day (**${completed}/${total} completed**). That is excellent! Every great routine needs deep downtime. Refresh your mind and treat this morning as a completely pristine launchpad.\n\n`;
            }
          } else {
            historyInsight = `### ✨ Kickoff Your Routine\nThis is your initial day tracking consistency with us! Welcome. Our smart notification alarms are active. Remember: the first step is simply showing up. Don't worry about completing everything — focus on proving you can form the habit interface.\n\n`;
          }

          // 4. Actionable pacing advice & motivational quote generator
          const advisoryClosing = `### 💡 Today's Focus Action
* **Pacing Advice**: Focus on establishing a transition routine 15 minutes prior to blocks. When moving into a work block, drink a full glass of water and take 3 deep belly breaths.
* **Motto for Today**: *"You do not rise to the level of your goals. You fall to the level of your systems."* — James Clear`;

          const localAdvice = `${greeting}${todayFocus}${historyInsight}${advisoryClosing}\n\n*💡 AI Key Inactive: This daily counsel was processed locally by our smart heuristic advisor system.*`;
          return res.json({ text: localAdvice });
        } else if (type === 'ask_ai') {
          // Interactive advisor matches questions to custom templates
          const lowercaseQuery = (userQuery || "").toLowerCase();
          let responseText = "";

          if (lowercaseQuery.includes("tired") || lowercaseQuery.includes("fatigue") || lowercaseQuery.includes("skip") || lowercaseQuery.includes("exhausted")) {
            responseText = `### 🛌 Listening to Your Body (Fatigue Protocols)
When fatigue sets in, the most productive thing you can do is **intelligent scaling** rather than trying to power through. Here is your survival strategy:

1. **Shorten, Don't Skip**: Instead of abandoning a task entirely, do a "micro-dose". If a workout is 60 minutes, scale it to a gentle 10-minute walk or stretch. Maintain the habit shape without the metabolic cost.
2. **Postpone Intense Cognitive Work**: Shift high-intensity focus work to tomorrow or a lighter block. Take scheduled, screen-free mini breaks.
3. **Double Down on Evening Wind-down**: Give yourself permission to slide into rest 45 minutes earlier tonight. Dim the lights and drink warm chamomile tea.`;
          } else if (lowercaseQuery.includes("evening") || lowercaseQuery.includes("night") || lowercaseQuery.includes("sleep") || lowercaseQuery.includes("wind-down")) {
            responseText = `### 🌙 Evening Recovery Architecture
A premium evening routine is the anchor of tomorrow's focus. Aim for this sequential transition:

* **T-Minus 60 Min (No Active Inputs)**: Close your laptop, mute work-related chats, and plug in your phone in another room or far from your mattress.
* **T-Minus 30 Min (Sensory Calm)**: Put on comfortable clothing, dim your overhead lighting, and listen to instrumental lofi or absolute quiet. 
* **T-Minus 15 Min (Review and Release)**: Quickly log your habits inside our tracker, congratulate yourself on any wins, and write down 2 focuses for tomorrow so your subconscious doesn't carry them.`;
          } else if (lowercaseQuery.includes("workout") || lowercaseQuery.includes("fitness") || lowercaseQuery.includes("gym")) {
            responseText = `### ⚡ Building Your Wellness Momentum
Consistency with exercise is built on **low friction**, not raw willpower. 

* **Prepare the Night Before**: Layout your trainers, activewear, and pre-workout water flask. When the alarm triggers, you have zero decisions to make.
* **Anchor with Music**: Associate your fitness blocks with a highly dynamic, inspiring playlist that you only listen to during activity.
* **The 5-Minute Rule**: Commit to exercising for just 5 minutes. If you still want to stop, you are fully permitted. 90% of the time, the momentum keeps you going.`;
          } else {
            // General multi-use productivity prompt
            responseText = `### 🌟 Designing Your Best Day
Here is my core philosophy for your everyday rhythm:

* **Protect the Morning**: Keep the first hour of your day free from external notifications, emails, and news of the world. Anchor it with quiet breathing or meditation.
* **Eliminate Context Switching**: Multi-tasking is a myth. Pick one task, set a countdown timer for 25-45 minutes, and close all opposing browser tabs.
* **Celebrate Tiny Wins**: Positive reinforcement entrenches habit loops in your brain's neural pathways. Checking off items on this routine tracker is a powerful, visual way to prove your wins.

Let me know if you would like me to unpack a specific advice block for today's tasks!`;
          }

          responseText += `\n\n*💡 Smart Local Fallback: Answers compiled autonomously by the tracker's heuristic engine because no AI API key is initialized.*`;
          return res.json({ text: responseText });
        }
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
