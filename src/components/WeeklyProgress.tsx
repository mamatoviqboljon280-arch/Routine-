import React from "react";
import { Calendar, CheckCircle, TrendingUp, Info } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DayProgress } from "../types";
import { WEEKDAYS_SHORT } from "../data";

interface WeeklyProgressProps {
  pastWeekProgress: DayProgress[]; // Array of past 7 days of logs
}

export default function WeeklyProgress({
  pastWeekProgress
}: WeeklyProgressProps) {
  
  // Format past logs into chart data
  const chartData = pastWeekProgress.map(day => {
    // Extract short name for day of week based on formatted string YYYY-MM-DD
    const dateObj = new Date(day.date + "T00:00:00");
    const dayShort = WEEKDAYS_SHORT[dateObj.getDay()];
    
    const rate = day.totalTasksCount > 0 
      ? Math.round((day.completedTasksCount / day.totalTasksCount) * 100) 
      : 0;
      
    return {
      name: dayShort,
      date: day.date,
      rate,
      tasks: `${day.completedTasksCount}/${day.totalTasksCount}`
    };
  });

  const averageCompletion = chartData.length > 0 
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.rate, 0) / chartData.length)
    : 0;

  // Custom chart tooltip styling
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-xl text-xs font-sans">
          <p className="font-semibold text-zinc-300">{payload[0].payload.name} ({payload[0].payload.date})</p>
          <p className="text-sky-400 mt-1 font-mono">
            Completions: <span className="font-bold text-zinc-100">{payload[0].payload.tasks}</span>
          </p>
          <p className="text-emerald-400 font-mono">
            Completion Rate: <span className="font-bold text-zinc-100">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative" id="weekly-progress-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 font-sans flex items-center gap-2">
            <span>Weekly Performance</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Overview of your daily habit tracking logs for the past 7 calendar days.
          </p>
        </div>

        {/* Aggregate Stats Badge */}
        <div className="bg-zinc-950 border border-zinc-800 px-3.5 py-2 rounded-xl flex items-center gap-4 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <TrendingUp size={14} className="text-sky-400" />
            <span>Avg Completion:</span>
          </div>
          <span className="font-mono font-bold text-emerald-400">{averageCompletion}%</span>
        </div>
      </div>

      {/* Days Grid View (Highlights of past 7 days) */}
      <div className="grid grid-cols-7 gap-2 mb-6" id="weekly-days-grid">
        {pastWeekProgress.map((day) => {
          const dateObj = new Date(day.date + "T00:00:00");
          const dayName = WEEKDAYS_SHORT[dateObj.getDay()];
          const dayNum = dateObj.getDate();
          
          const completionRate = day.totalTasksCount > 0 
            ? (day.completedTasksCount / day.totalTasksCount) * 100 
            : 0;
            
          const isSuccessful = completionRate >= 80;

          return (
            <div 
              key={day.date}
              className={`p-2 rounded-xl border relative flex flex-col items-center justify-between transition min-h-[85px] ${
                isSuccessful
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
                  : day.totalTasksCount > 0
                    ? "bg-zinc-800/20 border-zinc-700/40 text-zinc-300"
                    : "bg-zinc-950/40 border-zinc-850 text-zinc-600"
              }`}
              title={`${dayName}: ${day.completedTasksCount}/${day.totalTasksCount} completed (${Math.round(completionRate)}%)`}
              id={`weekly-grid-day-${day.date}`}
            >
              <div className="text-center">
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold block">
                  {dayName}
                </span>
                <span className="text-sm font-black font-sans block mt-0.5">
                  {dayNum}
                </span>
              </div>

              {day.totalTasksCount > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="text-[9px] font-mono font-bold">
                    {day.completedTasksCount}/{day.totalTasksCount}
                  </div>
                  <div className="w-full bg-zinc-820 rounded-full h-1 w-8 mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isSuccessful ? 'bg-emerald-500' : 'bg-zinc-500'}`}
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-[9px] text-zinc-600 font-mono italic">Rest</span>
              )}

              {/* Little completed star */}
              {isSuccessful && (
                <CheckCircle size={10} className="text-emerald-400 absolute top-1 right-1 fill-emerald-950" />
              )}
            </div>
          );
        })}
      </div>

      {/* Simple Area Rate Chart */}
      <div className="w-full h-56 bg-zinc-950/50 p-4 rounded-xl border border-zinc-850" id="weekly-progress-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#71717a" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#71717a" 
              fontSize={11} 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`} 
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#0ea5e9" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#completionGrad)" 
              dot={{ r: 4, strokeWidth: 1, fill: '#09090b', stroke: '#0ea5e9' }}
              activeDot={{ r: 6, strokeWidth: 1, fill: '#0ea5e9' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-zinc-950/40 border border-zinc-800/40 p-3 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
        <Info size={14} className="text-sky-400 mt-0.5 shrink-0" />
        <p>
          Each day gets marked with a <span className="text-emerald-400 font-semibold">★ success</span> if you complete <span className="text-zinc-200">80% or more</span> of your targeted schedule. Your active consistency streak counts how many successful days occur in an uninterrupted sequence!
        </p>
      </div>
    </div>
  );
}
