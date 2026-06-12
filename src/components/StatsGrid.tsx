import React from "react";
import { Award, Flame, CheckCircle2, CircleDot } from "lucide-react";
import { Quote } from "../types";

interface StatsGridProps {
  quote: Quote;
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
}

export default function StatsGrid({
  quote,
  totalTasks,
  completedTasks,
  currentStreak,
  longestStreak
}: StatsGridProps) {
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="stats-grid-container">
      {/* 1. Motivational Quote Widget */}
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm"
        id="quote-card"
      >
        <div>
          <span className="text-amber-500 font-mono text-xs uppercase tracking-wider block mb-2">
            Morning Inspiration
          </span>
          <p className="text-zinc-200 text-sm italic font-serif leading-relaxed">
            "{quote.text}"
          </p>
        </div>
        <p className="text-zinc-500 text-xs text-right mt-3 font-sans font-medium">
          — {quote.author}
        </p>
      </div>

      {/* 2. Today's Progress Tracker */}
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm"
        id="progress-tracker-card"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sky-400 font-mono text-xs uppercase tracking-wider block mb-1">
              Today's Completion
            </span>
            <h3 className="text-2xl font-sans font-semibold text-zinc-100 flex items-baseline gap-2">
              {completedTasks} <span className="text-zinc-500 text-sm font-normal">of {totalTasks} tasks</span>
            </h3>
          </div>
          <span className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-sky-400">
            <CheckCircle2 size={20} />
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center text-xs text-zinc-400 mb-2">
            <span>Progress Rate</span>
            <span className="font-semibold text-sky-400">{percent}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700/30">
            <div 
              className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-zinc-500 text-[11px] mt-2 leading-tight">
            {percent >= 80 
              ? "🔥 Keep it up! 80%+ counts towards your streak!"
              : "⭐ Complete 80% or more tasks to build your streak."}
          </p>
        </div>
      </div>

      {/* 3. Streak Counter Widget */}
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between"
        id="streak-card"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-rose-500 font-mono text-xs uppercase tracking-wider block mb-1">
              Consistency Streak
            </span>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse">
                {currentStreak}
              </span>
              <span className="text-zinc-400 text-sm font-medium">Days Active</span>
            </div>
          </div>
          <span className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/60 text-rose-500">
            <Flame size={20} fill="currentColor" className="fill-rose-500" />
          </span>
        </div>

        <div className="flex justify-between items-center bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Award size={14} className="text-amber-500" />
            <span className="font-sans">Personal Record:</span>
          </div>
          <span className="font-mono font-bold text-amber-500">{longestStreak} Days</span>
        </div>
      </div>
    </div>
  );
}
