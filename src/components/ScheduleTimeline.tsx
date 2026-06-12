import React, { useState } from "react";
import { 
  Sun, Moon, Dumbbell, Briefcase, Utensils, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Clock, Plus, HelpCircle
} from "lucide-react";
import { RoutineTask, TaskCategory, TaskStatus } from "../types";
import { CATEGORY_METADATA } from "../data";

interface ScheduleTimelineProps {
  tasks: RoutineTask[];
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onEditTask: (task: RoutineTask) => void;
  onDeleteTask: (id: string) => void;
  onAddNewClick: () => void;
}

export default function ScheduleTimeline({
  tasks,
  onToggleStatus,
  onEditTask,
  onDeleteTask,
  onAddNewClick
}: ScheduleTimelineProps) {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [showStatusHelp, setShowStatusHelp] = useState(false);

  // Filter tasks by category
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  // Categorized counts to show in header/filters
  const getCount = (cat: TaskCategory | 'all') => {
    if (cat === 'all') return tasks.length;
    return tasks.filter(t => t.category === cat).length;
  };

  // Helper to choose corresponding Category Icon
  const getCategoryIcon = (category: TaskCategory, size: number = 16) => {
    switch (category) {
      case "morning": return <Sun size={size} />;
      case "work": return <Briefcase size={size} />;
      case "fitness": return <Dumbbell size={size} />;
      case "meals": return <Utensils size={size} />;
      case "evening": return <Moon size={size} />;
    }
  };

  // Helper format 24h to 12h for pretty timeline labels
  const formatTime12 = (time24: string): string => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden mb-8" id="schedule-timeline-container">
      {/* Container Header */}
      <div className="border-b border-zinc-800/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-zinc-100 flex items-center gap-2">
            <span>Daily Schedule</span>
            <span className="text-xs bg-zinc-800 text-zinc-400 font-mono py-1 px-2.5 rounded-full border border-zinc-700/50">
              {tasks.length} items today
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Tap the status pills next to any habit to log your progress throughout the day.
          </p>
        </div>
        <button
          onClick={onAddNewClick}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-zinc-100 font-medium text-sm py-2 px-4 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center gap-2 transition duration-200"
          id="btn-add-task-schedule"
        >
          <Plus size={16} />
          <span>New Task</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="p-4 bg-zinc-950/40 border-b border-zinc-800/50 flex gap-2 overflow-x-auto scrollbar-none">
        {(['all', 'morning', 'work', 'fitness', 'meals', 'evening'] as const).map((cat) => {
          const isActive = selectedCategory === cat;
          const count = getCount(cat);
          let styling = "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200";
          
          if (isActive) {
            if (cat === 'all') styling = "bg-zinc-100 text-zinc-950 border-zinc-200 font-semibold";
            else if (cat === 'morning') styling = "bg-amber-500 text-amber-950 font-semibold border-amber-400";
            else if (cat === 'work') styling = "bg-sky-500 text-sky-950 font-semibold border-sky-400";
            else if (cat === 'fitness') styling = "bg-emerald-500 text-emerald-950 font-semibold border-emerald-400";
            else if (cat === 'meals') styling = "bg-rose-500 text-rose-950 font-semibold border-rose-400";
            else if (cat === 'evening') styling = "bg-indigo-500 text-indigo-950 font-semibold border-indigo-400";
          }

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3.5 rounded-xl text-xs border transition duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${styling}`}
              id={`filter-pill-${cat}`}
            >
              {cat !== 'all' && getCategoryIcon(cat, 12)}
              <span className="capitalize">{cat === 'all' ? 'All Tasks' : cat}</span>
              <span className={`text-[10px] py-0.5 px-1.5 rounded-md font-mono ${isActive ? 'bg-zinc-950/20 text-current' : 'bg-zinc-900 text-zinc-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule List Content */}
      <div className="p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4" id="empty-schedule-indicator">
            <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500 mx-auto mb-4 border border-zinc-700/50">
              <Clock size={20} />
            </div>
            <p className="text-zinc-300 font-semibold text-sm">No tasks programmed</p>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
              {selectedCategory === 'all' 
                ? "Your routine is empty today! Click the button above to add your first daily block."
                : `No tasks found under the ${selectedCategory} category today. Adjust your filter or create one.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4" id="schedule-items-list">
            {filteredTasks.map((task) => {
              const meta = CATEGORY_METADATA[task.category];
              const status: TaskStatus = task.statusString || 'pending';

              let borderStatusColor = "border-zinc-800";
              let statusBg = "bg-zinc-900/40";
              if (status === 'done') {
                borderStatusColor = "border-emerald-500/40 ring-1 ring-emerald-500/20";
                statusBg = "bg-emerald-950/10";
              } else if (status === 'missed') {
                borderStatusColor = "border-rose-500/40 ring-1 ring-rose-500/20";
                statusBg = "bg-rose-950/10";
              }

              return (
                <div
                  key={task.id}
                  className={`border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 ${statusBg} ${borderStatusColor}`}
                  id={`schedule-task-card-${task.id}`}
                >
                  <div className="flex gap-4 items-start w-full md:w-auto">
                    {/* Time Dot Indicator */}
                    <div className="flex flex-col items-center justify-center pt-1 min-w-[75px]">
                      <span className="text-sm font-bold text-zinc-100 font-mono tracking-tight text-center">
                        {formatTime12(task.time)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono font-medium block mt-0.5">
                        ⏲️ {task.duration} min
                      </span>
                    </div>

                    {/* Task Info Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm sm:text-base font-semibold text-zinc-100 transition-all ${status === 'done' ? 'line-through text-zinc-400' : ''}`}>
                          {task.name}
                        </h4>
                        <span className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <p className="text-xs text-zinc-400 mt-1.5 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/10 max-w-xl">
                          📝 {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle buttons and edit menu */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end border-t border-zinc-800/40 md:border-t-0 pt-3 md:pt-0">
                    <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800/80 gap-1 w-full sm:w-auto">
                      {/* Done pill */}
                      <button
                        onClick={() => onToggleStatus(task.id, 'done')}
                        className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          status === 'done' 
                            ? "bg-emerald-600 text-zinc-100 shadow-md shadow-emerald-950/30" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        id={`status-toggle-done-${task.id}`}
                      >
                        <CheckCircle2 size={13} />
                        <span>Completed</span>
                      </button>

                      {/* Pending pill */}
                      <button
                        onClick={() => onToggleStatus(task.id, 'pending')}
                        className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          status === 'pending' 
                            ? "bg-zinc-800 text-zinc-200 border border-zinc-700/30" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        id={`status-toggle-pending-${task.id}`}
                      >
                        <Clock size={13} />
                        <span>Pending</span>
                      </button>

                      {/* Missed pill */}
                      <button
                        onClick={() => onToggleStatus(task.id, 'missed')}
                        className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                          status === 'missed' 
                            ? "bg-rose-950/80 text-rose-300 border border-rose-900/30 font-semibold" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        id={`status-toggle-missed-${task.id}`}
                      >
                        <AlertCircle size={13} />
                        <span>Skipped</span>
                      </button>
                    </div>

                    {/* Edit/Delete mini actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/40 transition"
                        title="Edit Task"
                        id={`btn-edit-task-${task.id}`}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/10 transition"
                        title="Delete Task"
                        id={`btn-delete-task-${task.id}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
