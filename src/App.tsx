import React, { useState, useEffect } from "react";
import { 
  Calendar, CheckSquare, Sparkles, BrainCircuit, Play, Settings, Plus, Dumbbell, Sun, 
  HelpCircle, ChevronLeft, ChevronRight, Award, Flame, Star, Undo2, LogOut, CheckCircle2,
  Clock
} from "lucide-react";
import { RoutineTask, TaskStatus, DayProgress, InAppNotification, Quote } from "./types";
import { 
  DEFAULT_TASKS, MOTIVATIONAL_QUOTES, WEEKDAYS, WEEKDAYS_SHORT, timeToMinutes 
} from "./data";

// Subcomponents
import StatsGrid from "./components/StatsGrid";
import ScheduleTimeline from "./components/ScheduleTimeline";
import RoutineEditor from "./components/RoutineEditor";
import WeeklyProgress from "./components/WeeklyProgress";
import AiAdvisorPanel from "./components/AiAdvisorPanel";
import NotificationCenter from "./components/NotificationCenter";

export default function App() {
  // --- 1. Current Date State ---
  // Store today's local date string format: YYYY-MM-DD
  const getLocalDateString = (d: Date = new Date()) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [simulationOffsetDays, setSimulationOffsetDays] = useState(0);
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");

  useEffect(() => {
    const computedDate = new Date();
    computedDate.setDate(computedDate.getDate() + simulationOffsetDays);
    setCurrentDateStr(getLocalDateString(computedDate));
    setDayOfWeek(WEEKDAYS[computedDate.getDay()]);
  }, [simulationOffsetDays]);

  // --- 2. Master Routine Tasks State ---
  // Loaded from localStorage, fallback to DEFAULT_TASKS
  const [tasks, setTasks] = useState<RoutineTask[]>([]);

  // Load master tasks
  useEffect(() => {
    const saved = localStorage.getItem("master_routine_tasks");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
      localStorage.setItem("master_routine_tasks", JSON.stringify(DEFAULT_TASKS));
    }
  }, []);

  // --- 3. Current Day's Active Log State ---
  // The state of tomorrow is independent. Whenever current date changes, we load/seed log.
  const [todayTasks, setTodayTasks] = useState<RoutineTask[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!currentDateStr || tasks.length === 0) return;

    // Get tasks repeated for current day of week (0-6)
    const computedDate = new Date(currentDateStr + "T00:00:00");
    const currentDayIdx = computedDate.getDay();

    // Filter master tasks matching repeatDays
    const masterMatchingTasks = tasks.filter(t => t.repeatDays.includes(currentDayIdx));

    // Check if we already have a day log stored in localStorage
    const savedLogStr = localStorage.getItem(`daily_log_${currentDateStr}`);
    if (savedLogStr) {
      try {
        const savedLog: DayProgress = JSON.parse(savedLogStr);
        // Map master task details dynamically but preserve the statusString
        const mapped = masterMatchingTasks.map(masterTask => {
          const matchingSavedTask = savedLog.tasks.find(st => st.id === masterTask.id);
          return {
            ...masterTask,
            statusString: matchingSavedTask ? matchingSavedTask.status : ('pending' as TaskStatus)
          };
        });
        setTodayTasks(mapped);
      } catch (e) {
        const initial = masterMatchingTasks.map(t => ({ ...t, statusString: 'pending' as TaskStatus }));
        setTodayTasks(initial);
      }
    } else {
      // Seed with pending
      const initial = masterMatchingTasks.map(t => ({ ...t, statusString: 'pending' as TaskStatus }));
      setTodayTasks(initial);
      
      const seedLog: DayProgress = {
        date: currentDateStr,
        completedTasksCount: 0,
        totalTasksCount: initial.length,
        tasks: initial.map(t => ({ id: t.id, name: t.name, category: t.category, time: t.time, status: 'pending' }))
      };
      localStorage.setItem(`daily_log_${currentDateStr}`, JSON.stringify(seedLog));
    }
  }, [currentDateStr, tasks]);

  // Recalculate completed count whenever today's tasks change
  useEffect(() => {
    const done = todayTasks.filter(t => t.statusString === 'done').length;
    setCompletedCount(done);

    // Save back to daily log
    if (currentDateStr && todayTasks.length > 0) {
      const updatedLog: DayProgress = {
        date: currentDateStr,
        completedTasksCount: done,
        totalTasksCount: todayTasks.length,
        tasks: todayTasks.map(t => ({ id: t.id, name: t.name, category: t.category, time: t.time, status: t.statusString || 'pending' }))
      };
      localStorage.setItem(`daily_log_${currentDateStr}`, JSON.stringify(updatedLog));
      
      // Update historical logs context so weekly charts sync instantly
      updateHistoricalLogsCache(updatedLog);
    }
  }, [todayTasks, currentDateStr]);

  // --- 4. Historical Logs State (Past 7 Days Context) ---
  const [pastWeekProgress, setPastWeekProgress] = useState<DayProgress[]>([]);

  const getPastWeekDates = (baseDateStr: string): string[] => {
    const dates: string[] = [];
    const base = new Date(baseDateStr + "T00:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      dates.push(getLocalDateString(d));
    }
    return dates;
  };

  const loadPastWeekLogs = () => {
    if (!currentDateStr) return;
    const dates = getPastWeekDates(currentDateStr);
    
    const logs = dates.map(dt => {
      const saved = localStorage.getItem(`daily_log_${dt}`);
      if (saved) {
        try {
          return JSON.parse(saved) as DayProgress;
        } catch (e) {
          // ignore error
        }
      }
      
      // Seed dummy or blank placeholder so chart displays nicely
      // If of the same day of week, match tasks length. For other days, default to a typical 5 items
      const loggedDateObj = new Date(dt + "T00:00:00");
      const dayIdx = loggedDateObj.getDay();
      const count = tasks.filter(t => t.repeatDays.includes(dayIdx)).length;

      return {
        date: dt,
        completedTasksCount: 0,
        totalTasksCount: count || 0,
        tasks: []
      } as DayProgress;
    });

    setPastWeekProgress(logs);
  };

  useEffect(() => {
    loadPastWeekLogs();
  }, [currentDateStr, tasks]);

  const updateHistoricalLogsCache = (updatedDayLog: DayProgress) => {
    setPastWeekProgress(prev => prev.map(log => log.date === updatedDayLog.date ? updatedDayLog : log));
  };

  // --- 5. Consistency Streak State & Logic ---
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const calculateStreaks = () => {
    // Generate an index of date -> completion rate >= 80%
    const keys = Object.keys(localStorage);
    const completedDays: { [date: string]: boolean } = {};

    keys.forEach(key => {
      if (key.startsWith("daily_log_")) {
        const datePart = key.replace("daily_log_", "");
        try {
          const log: DayProgress = JSON.parse(localStorage.getItem(key) || "{}");
          if (log.totalTasksCount > 0) {
            const pct = (log.completedTasksCount / log.totalTasksCount) * 100;
            completedDays[datePart] = pct >= 80;
          }
        } catch (e) {
          // ignore
        }
      }
    });

    // Count backward from currentDateStr
    let streak = 0;
    let tempDate = new Date(currentDateStr + "T00:00:00");
    
    // Check if they earned a success today
    let todayStr = getLocalDateString(tempDate);
    let todayPassed = completedDays[todayStr];

    // If today is not completed yet (i.e. still below 80% because it's early),
    // we check starting from yesterday to keep their streak alive!
    let checkDateStr = todayStr;
    const todayCompletedPercent = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;
    if (todayCompletedPercent < 80) {
      const yesterday = new Date(tempDate);
      yesterday.setDate(tempDate.getDate() - 1);
      checkDateStr = getLocalDateString(yesterday);
    }

    let searchDate = new Date(checkDateStr + "T00:00:00");
    while (true) {
      const keyStr = getLocalDateString(searchDate);
      
      // If we have programmed tasks for this day of week
      const dayIdx = searchDate.getDay();
      const hasProgrammed = tasks.some(t => t.repeatDays.includes(dayIdx));

      if (hasProgrammed) {
        if (completedDays[keyStr]) {
          streak++;
        } else {
          // Streak broken
          break;
        }
      } else {
        // Weekend or Rest/Off day without tasks doesn't break their streak! We skip backward without incrementing.
      }

      // Step backward 1 day
      searchDate.setDate(searchDate.getDate() - 1);
      
      // Escape hatch for safety (limit search to past 365 days)
      if (streak > 365) break;
    }

    // Now compute longest streak in general history
    let maxStreak = 0;
    let activeStreak = 0;
    
    // Get list of all dates with data sorted chronologically
    const allLoggedDates = Object.keys(completedDays).sort();
    
    if (allLoggedDates.length > 0) {
      const start = new Date(allLoggedDates[0] + "T00:00:00");
      const end = new Date(currentDateStr + "T00:00:00");
      
      let cursor = new Date(start);
      while (cursor <= end) {
        const cKey = getLocalDateString(cursor);
        const dayIdx = cursor.getDay();
        const hasTasks = tasks.some(t => t.repeatDays.includes(dayIdx));

        if (hasTasks) {
          if (completedDays[cKey]) {
            activeStreak++;
            if (activeStreak > maxStreak) maxStreak = activeStreak;
          } else {
            activeStreak = 0;
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    setCurrentStreak(streak);
    // If today is completed higher, and it breaks longestStreak, sync
    const finalLongest = Math.max(maxStreak, streak);
    setLongestStreak(finalLongest);

    localStorage.setItem("streak_current", streak.toString());
    localStorage.setItem("streak_longest", finalLongest.toString());
  };

  useEffect(() => {
    if (currentDateStr && tasks.length > 0) {
      calculateStreaks();
    }
  }, [currentDateStr, todayTasks, tasks, completedCount]);

  // --- 6. Smart Notifications State ---
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("smart_reminders_logs");
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("smart_reminders_logs", JSON.stringify(notifications));
    }
  }, [notifications]);

  // --- 7. Motivational Quote State ---
  // A quote locked by day of month, so it stays consistent throughout the whole daily logs check
  const [quote, setQuote] = useState<Quote>(MOTIVATIONAL_QUOTES[0]);

  useEffect(() => {
    if (currentDateStr) {
      const dateVal = new Date(currentDateStr + "T00:00:00");
      const idx = dateVal.getDate() % MOTIVATIONAL_QUOTES.length;
      setQuote(MOTIVATIONAL_QUOTES[idx]);
    }
  }, [currentDateStr]);

  // --- 8. Custom Routine Editor Modal handlers ---
  const [taskToEdit, setTaskToEdit] = useState<RoutineTask | null>(null);
  const [showEditorModal, setShowEditorModal] = useState(false);

  const handleEditClick = (task: RoutineTask) => {
    setTaskToEdit(task);
    setShowEditorModal(true);
  };

  const handleNewClick = () => {
    setTaskToEdit(null);
    setShowEditorModal(true);
  };

  // Save new / modified task to program
  const handleSaveTask = (edited: Omit<RoutineTask, "id"> & { id?: string }) => {
    let updatedTasks: RoutineTask[] = [];

    if (edited.id) {
      // Editing existing task
      updatedTasks = tasks.map(t => t.id === edited.id ? ({ ...t, ...edited } as RoutineTask) : t);
    } else {
      // Adding new task
      const newId = `task-${Date.now()}`;
      const newTask: RoutineTask = {
        ...edited,
        id: newId
      };
      updatedTasks = [...tasks, newTask];
    }

    // Sort updated tasks by chronological start time HH:MM
    updatedTasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    setTasks(updatedTasks);
    localStorage.setItem("master_routine_tasks", JSON.stringify(updatedTasks));
    setShowEditorModal(false);
  };

  // Delete dynamic task
  const handleDeleteTask = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this task from your master routine program?");
    if (confirmDelete) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      localStorage.setItem("master_routine_tasks", JSON.stringify(updated));
    }
  };

  // Toggle routine item completion status
  const handleToggleTaskStatus = (id: string, status: TaskStatus) => {
    setTodayTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          statusString: status
        };
      }
      return t;
    }));
  };

  // Reset current day's progress back to pending
  const handleResetDay = () => {
    const confirmReset = window.confirm("Reset all tasks for today back to pending status?");
    if (confirmReset) {
      setTodayTasks(prev => prev.map(t => ({ ...t, statusString: 'pending' as TaskStatus })));
      // Clear morning plan cache so it re-generates accurately on reset
      localStorage.removeItem(`morning_plan_${dayOfWeek}_${new Date().toDateString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 pb-16">
      
      {/* HEADER SECTION BAR */}
      <header className="bg-zinc-900/60 border-b border-zinc-800/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 text-zinc-100 shadow-lg shadow-emerald-950/20">
              <CheckSquare size={20} />
            </span>
            <div>
              <h1 className="text-base sm:text-lg font-black font-sans uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
                Daily Routine Tracker
              </h1>
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mt-0.5" id="header-date-indicator">
                <Calendar size={13} className="text-zinc-500" />
                <span className="font-semibold text-zinc-300">{dayOfWeek}, {currentDateStr}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Simulation Tool Days Navigation for debug/exploration */}
            <div className="bg-zinc-950 border border-zinc-800 px-2 py-1 rounded-xl flex items-center gap-2 text-xs">
              <button
                onClick={() => setSimulationOffsetDays(prev => prev - 1)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
                title="View Yesterday Logs"
                id="btn-day-prev"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] uppercase font-mono font-bold tracking-tight text-zinc-400 cursor-default" title="Jump to calendar days for consistency demonstration">
                📅 Simulate Time
              </span>
              <button
                onClick={() => setSimulationOffsetDays(prev => prev + 1)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
                title="View Tomorrow Logs"
                id="btn-day-next"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Smart Reminders Dropdown Drawer icon */}
            <NotificationCenter 
              todayTasks={todayTasks}
              currentDateStr={currentDateStr}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </div>

        </div>
      </header>

      {/* BODY WORKSPACE CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8" id="tracker-workspace-main">
        
        {/* UPPER ROW: Inpiration quote, daily progress state, streak counters */}
        <StatsGrid 
          quote={quote}
          totalTasks={todayTasks.length}
          completedTasks={completedCount}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
        />

        {/* MIDDLE SECTION BLOCK: AI Daily Advisor Plan and Chat panel */}
        <AiAdvisorPanel 
          todayTasks={todayTasks}
          yesterdayLog={pastWeekProgress.length > 5 ? pastWeekProgress[5] : null}
          dayOfWeek={dayOfWeek}
        />

        {/* BOTTOM TWO COLUMNS WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Timeline Tasks list (taking 7 cols) */}
          <div className="lg:col-span-8 flex flex-col justify-start">
            <ScheduleTimeline 
              tasks={todayTasks}
              onToggleStatus={handleToggleTaskStatus}
              onEditTask={handleEditClick}
              onDeleteTask={handleDeleteTask}
              onAddNewClick={handleNewClick}
            />

            {/* Reset day helper banner */}
            <div className="flex justify-between items-center bg-zinc-900/40 p-4 border border-zinc-800 rounded-2xl">
              <span className="text-zinc-400 text-xs flex items-center gap-2">
                <Clock size={14} className="text-zinc-500" />
                <span>Made a mistake or starting over?</span>
              </span>
              <button
                onClick={handleResetDay}
                className="bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs py-1.5 px-3.5 rounded-xl border border-zinc-700/30 cursor-pointer"
                id="btn-reset-current-day"
              >
                Reset current day
              </button>
            </div>
          </div>

          {/* Weekly progress and charts (taking 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <WeeklyProgress 
              pastWeekProgress={pastWeekProgress}
            />
          </div>

        </div>

      </main>

      {/* FLOAT POPUP ROUTINE CREATION AND EDITING MODAL */}
      {showEditorModal && (
        <RoutineEditor 
          taskToEdit={taskToEdit}
          onSave={handleSaveTask}
          onClose={() => setShowEditorModal(false)}
        />
      )}
    </div>
  );
}
