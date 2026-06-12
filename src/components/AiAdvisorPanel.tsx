import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Send, RefreshCw, AlertTriangle, ArrowRight, BrainCircuit, User, Bot, HelpCircle } from "lucide-react";
import Markdown from "react-markdown";
import { RoutineTask, DayProgress } from "../types";
import { WEEKDAYS } from "../data";

interface AiAdvisorPanelProps {
  todayTasks: RoutineTask[];
  yesterdayLog: DayProgress | null;
  dayOfWeek: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AiAdvisorPanel({
  todayTasks,
  yesterdayLog,
  dayOfWeek
}: AiAdvisorPanelProps) {
  // Morning advisor plan state
  const [morningPlan, setMorningPlan] = useState<string>("");
  const [loadingPlan, setLoadingPlan] = useState<boolean>(false);
  const [errorPlan, setErrorPlan] = useState<string>("");

  // Custom Ask AI Chat conversation state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick Suggestion templates for user
  const QUESTIONS_TEMPLATES = [
    "I'm feeling tired today, what should I skip or adjust?",
    "Give me a productive evening routine",
    "What should I focus on today?",
    "How do I maintain my fitness workout streak?"
  ];

  // Auto scroll chat to bottom when message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loadingChat]);

  // Load / Generate Morning plan when component loads
  useEffect(() => {
    // Attempt load cached advisor plan from localStorage first, otherwise fetch new
    const cachedPlan = localStorage.getItem(`morning_plan_${dayOfWeek}_${new Date().toDateString()}`);
    if (cachedPlan) {
      setMorningPlan(cachedPlan);
    } else {
      generateMorningPlan();
    }
  }, [dayOfWeek]);

  // Trigger morning advisor plan generation from backend
  const generateMorningPlan = async () => {
    setLoadingPlan(true);
    setErrorPlan("");
    try {
      // Structure yesterday performance
      let yesterdayPerf = null;
      if (yesterdayLog) {
        yesterdayPerf = {
          total: yesterdayLog.totalTasksCount,
          completed: yesterdayLog.completedTasksCount,
          missed: yesterdayLog.totalTasksCount - yesterdayLog.completedTasksCount,
          tasks: yesterdayLog.tasks.map(t => ({ name: t.name, status: t.status }))
        };
      }

      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "morning_plan",
          todayTasks: todayTasks,
          yesterdayPerformance: yesterdayPerf,
          dayOfWeek: dayOfWeek
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact the Daily Routine AI Advisor server.");
      }

      const data = await response.json();
      if (data.text) {
        setMorningPlan(data.text);
        localStorage.setItem(`morning_plan_${dayOfWeek}_${new Date().toDateString()}`, data.text);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setErrorPlan(err.message || "An unexpected error occurred during advisory compilation.");
    } finally {
      setLoadingPlan(false);
    }
  };

  // Trigger Ask AI custom query
  const handleAskAI = async (queryText: string) => {
    if (!queryText.trim() || loadingChat) return;

    // Append user message
    const userMsgId = `user-${Date.now()}`;
    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { id: userMsgId, role: 'user', text: queryText }
    ];
    setChatHistory(newHistory);
    setUserQuery("");
    setLoadingChat(true);

    try {
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ask_ai",
          todayTasks: todayTasks,
          dayOfWeek: dayOfWeek,
          userQuery: queryText,
          chatHistory: formattedHistory
        })
      });

      if (!response.ok) {
        throw new Error("Unable to receive AI advice.");
      }

      const data = await response.json();
      if (data.text) {
        setChatHistory(prev => [
          ...prev,
          { id: `model-${Date.now()}`, role: 'model', text: data.text }
        ]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { id: `model-err-${Date.now()}`, role: 'model', text: `⚠️ **Error**: ${err.message || "Failed to receive response from AI advisor."}` }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleTemplateClick = (template: string) => {
    handleAskAI(template);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8" id="ai-advisor-panel-grid">
      
      {/* LEFT: Personalized Morning Plan */}
      <div 
        className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
        id="morning-plan-card"
      >
        <div>
          {/* Section Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500 fill-amber-500/10" />
              <span>Today's AI Advisory Plan</span>
            </h3>
            
            <button
              onClick={generateMorningPlan}
              disabled={loadingPlan}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="Refresh Plan"
              id="btn-refresh-morning-plan"
            >
              <RefreshCw size={13} className={loadingPlan ? "animate-spin text-amber-500" : ""} />
            </button>
          </div>

          {/* Plan Text Content */}
          <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl min-h-[18rem] md:min-h-[22rem] flex flex-col justify-center">
            {loadingPlan ? (
              <div className="text-center py-10 space-y-3" id="loading-advisor-indicator">
                <BrainCircuit size={40} className="text-amber-500 animate-pulse mx-auto opacity-75" />
                <p className="text-zinc-300 font-semibold text-sm">Reviewing your routine...</p>
                <p className="text-zinc-500 text-[11px] max-w-xs mx-auto">
                  Aligning daily tasks, factoring in yesterday's completions and tailoring specific pacing tips.
                </p>
              </div>
            ) : errorPlan ? (
              <div className="text-center py-10 text-rose-400" id="error-advisor-indicator">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold">Failed to load plan</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">{errorPlan}</p>
                <button
                  onClick={generateMorningPlan}
                  className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Retry Configuration
                </button>
              </div>
            ) : morningPlan ? (
              <div className="markdown-body text-zinc-300 text-sm leading-relaxed space-y-3" id="morning-plan-text">
                <Markdown>{morningPlan}</Markdown>
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500" id="no-plan-indicator">
                <Sparkles size={24} className="mx-auto mb-2 opacity-50 text-amber-500" />
                <p className="text-xs">No active plan compiled yet</p>
                <button
                  onClick={generateMorningPlan}
                  className="mt-3 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/20 py-1 px-3 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Generate Plan
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-[11px] text-zinc-500 italic bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-800/20 text-center">
          💡 Morning plans take inspiration from Aristotle, Robin Sharma and James Clear to trigger powerful momentum.
        </div>
      </div>

      {/* RIGHT: Ask AI Chat Bot */}
      <div 
        className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-[30rem] md:h-[34rem]"
        id="ask-ai-card"
      >
        <div className="flex flex-col h-full justify-between overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4 mb-4 shrink-0">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BrainCircuit size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-100 font-sans">
                Interactive Advisor Chat
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Ask specific scheduling advice or adjust your blocks on the fly.
              </p>
            </div>
          </div>

          {/* Conversation history space */}
          <div className="flex-1 overflow-y-auto bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 space-y-4 mb-4 scrollbar-thin">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-4" id="empty-chat-indicator">
                <Bot size={36} className="text-zinc-600 mb-3" />
                <p className="text-zinc-300 font-semibold text-sm">Need deep habit adjustments?</p>
                <p className="text-zinc-550 text-xs mt-1 max-w-xs leading-normal">
                  Type a custom issue or select one of the quick advice templates below to kickstart a consult.
                </p>

                {/* Question templates */}
                <div className="grid grid-cols-1 gap-2 w-full mt-5 max-w-md" id="chat-templates-group">
                  {QUESTIONS_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => handleTemplateClick(tpl)}
                      className="text-[11px] text-left text-zinc-400 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/45 hover:text-zinc-200 py-2 px-3.5 rounded-xl cursor-pointer transition flex items-center justify-between gap-2"
                      id={`template-btn-${tpl.slice(0, 15).replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      <span className="truncate">{tpl}</span>
                      <ArrowRight size={10} className="shrink-0 text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4" id="chat-messages-container">
                {chatHistory.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2.5 items-start max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <span className={`p-1.5 rounded-lg shrink-0 text-xs ${
                        isUser 
                          ? 'bg-zinc-800 text-zinc-300' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {isUser ? <User size={13} /> : <Bot size={13} />}
                      </span>

                      {/* Msg text bubble */}
                      <div className={`p-3 rounded-2xl text-xs font-sans whitespace-pre-wrap leading-relaxed ${
                        isUser 
                          ? 'bg-zinc-800 text-zinc-100 rounded-tr-none' 
                          : 'bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                      }`}>
                        {isUser ? (
                          msg.text
                        ) : (
                          <div className="markdown-body space-y-1 bg-transparent">
                            <Markdown>{msg.text}</Markdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {loadingChat && (
                  <div className="flex gap-2.5 items-start max-w-[80%]">
                    <span className="p-1.5 rounded-lg shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-xs">
                      <Bot size={13} />
                    </span>
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-xs text-zinc-400">
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-1 select-none font-mono">Formulating strategy...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Ask AI Search Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAskAI(userQuery); }}
            className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80 shrink-0"
            id="chat-input-form"
          >
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              disabled={loadingChat}
              placeholder="Type your wellness, fatigue or routine question..."
              className="flex-1 bg-transparent py-1.5 px-3 text-zinc-200 text-xs focus:outline-none placeholder-zinc-500"
              id="input-chat-query"
            />
            <button
              type="submit"
              disabled={!userQuery.trim() || loadingChat}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 p-2 rounded-lg text-zinc-100 transition shrink-0 cursor-pointer"
              id="btn-send-chat"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
