import React, { useState, useEffect } from "react";
import { Bell, BellRing, Check, CheckSquare, Sparkles, AlertCircle, RefreshCw, X, Trash2 } from "lucide-react";
import { InAppNotification, RoutineTask, TaskStatus, DayProgress } from "../types";
import { format12Hour, timeToMinutes } from "../data";

interface NotificationCenterProps {
  todayTasks: RoutineTask[];
  currentDateStr: string;
  notifications: InAppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<InAppNotification[]>>;
}

export default function NotificationCenter({
  todayTasks,
  currentDateStr,
  notifications,
  setNotifications
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeToast, setActiveToast] = useState<InAppNotification | null>(null);

  // 1. Ticker updating current clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // 10s checks are cheap
    return () => clearInterval(timer);
  }, []);

  // 2. Perform Routine Smart Reminder Sweep relative to current hour & minutes
  useEffect(() => {
    const currentHours = currentTime.getHours();
    const currentMins = currentTime.getMinutes();
    const timeStr24 = `${currentHours.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')}`;
    const totalCurrentMins = currentHours * 60 + currentMins;

    const newNotifications: InAppNotification[] = [];

    // Unique custom key to avoid spamming the same notification
    const getNotificationKey = (type: string, id: string, date: string) => `remind_${type}_${id}_${date}`;

    // A. 7:00 AM Morning plan notification
    if (currentHours === 7 && currentMins === 0) {
      const key = getNotificationKey("morning_plan", "all", currentDateStr);
      if (!notifications.some(n => n.id === key)) {
        const morningTasksCount = todayTasks.length;
        newNotifications.push({
          id: key,
          title: "🗓️ Morning Routine Plan is Live!",
          message: `Good morning! You've successfully programmed ${morningTasksCount} tasks to shape your day with intention. Open the AI Advisory to visualize today's custom recommendations.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'morning',
          read: false
        });
      }
    }

    // B. 9:30 PM (21:30) End of day summary notification
    if (currentHours === 21 && currentMins === 30) {
      const key = getNotificationKey("eod_summary", "all", currentDateStr);
      if (!notifications.some(n => n.id === key)) {
        const doneCount = todayTasks.filter(t => t.statusString === 'done').length;
        const totalCount = todayTasks.length;
        const missedCount = todayTasks.filter(t => t.statusString === 'missed').length;

        newNotifications.push({
          id: key,
          title: "🏆 Your Evening Routine Summary Is Ready",
          message: `Great working! Today you completed ${doneCount} out of ${totalCount} habits.${missedCount > 0 ? ` You skipped ${missedCount} tasks. Don't worry, tomorrow is a canvas for fresh starts!` : " Immaculate 100% score! Stellar consistency."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'summary',
          read: false
        });
      }
    }

    // C. Task specific alerts (15m before, exact time, missed check)
    todayTasks.forEach(task => {
      const taskMins = timeToMinutes(task.time);
      const isCompleted = task.statusString === 'done';
      const isMissed = task.statusString === 'missed';
      const isPending = task.statusString === 'pending' || !task.statusString;

      // C1. 15-Minute warning notification
      const minsDiff15 = taskMins - totalCurrentMins;
      if (minsDiff15 === 15) {
        const key = getNotificationKey("15min", task.id, currentDateStr);
        if (!notifications.some(n => n.id === key)) {
          newNotifications.push({
            id: key,
            title: `🔔 Upcoming: ${task.name}`,
            message: `Starting in 15 minutes (at ${format12Hour(task.time)}). Put away distractions and prepare to transition.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'upcoming',
            read: false,
            taskId: task.id
          });
        }
      }

      // C2. Exact time alarm
      if (totalCurrentMins === taskMins) {
        const key = getNotificationKey("exact", task.id, currentDateStr);
        if (!notifications.some(n => n.id === key)) {
          newNotifications.push({
            id: key,
            title: `🚀 Time to Start: ${task.name}`,
            message: `It is now ${format12Hour(task.time)}. Let's execute this block for your consistency! Duration: ${task.duration} min.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'exact',
            read: false,
            taskId: task.id
          });
        }
      }

      // C3. Gentle reminder for outstanding pending tasks (e.g. 20 mins after scheduled start is still pending)
      const minsPastStart = totalCurrentMins - taskMins;
      if (minsPastStart >= 20 && minsPastStart <= 40 && isPending) {
        const key = getNotificationKey("gentle_missed", task.id, currentDateStr);
        if (!notifications.some(n => n.id === key)) {
          newNotifications.push({
            id: key,
            title: `⏰ Gentle reminder: ${task.name}`,
            message: `You haven't checked off this task yet, but you still have plenty of time to get it done! Do a shortened version if you're feeling short on time.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'missed',
            read: false,
            taskId: task.id
          });
        }
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      // Trigger toaster alert for the newest notification
      setActiveToast(newNotifications[0]);
    }
  }, [currentTime, todayTasks, currentDateStr, notifications]);

  // Toast self dismiss after 5s
  useEffect(() => {
    if (activeToast) {
      const dismissTimer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(dismissTimer);
    }
  }, [activeToast]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative inline-block" id="notification-center-root">
      
      {/* 1. Header Ring Bell Icon with badge count */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 text-zinc-300 hover:text-zinc-100 transition cursor-pointer flex items-center"
        title="In-App Smart Reminders Panel"
        id="btn-bell-toggle"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing size={18} className="text-amber-500 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-zinc-100 ring-2 ring-zinc-900">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell size={18} />
        )}
      </button>

      {/* 2. Floating Toast Alert (Discharged to absolute screen corner overlay) */}
      {activeToast && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-zinc-950 border-2 border-emerald-500/40 p-4 rounded-xl shadow-2xl max-w-sm flex gap-3 animate-slide-in"
          id="active-floating-toast"
        >
          <div className="text-lg shrink-0 mt-0.5">
            {activeToast.type === 'upcoming' || activeToast.type === 'exact' ? "🔔" : activeToast.type === 'missed' ? "⏰" : "🚀"}
          </div>
          <div className="flex-1">
            <h4 className="text-zinc-100 text-xs font-bold font-sans">
              {activeToast.title}
            </h4>
            <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
              {activeToast.message}
            </p>
            <div className="flex justify-between items-center mt-3 border-t border-zinc-900 pt-2 text-[9px] text-zinc-500 font-mono">
              <span>Smart reminder</span>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Dismiss alert
              </button>
            </div>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="text-zinc-600 hover:text-zinc-400 p-1 self-start cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 3. Dropdown Menu Notification Drawer */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 max-h-[30rem] flex flex-col justify-between overflow-hidden"
            id="notifications-dropdown-drawer"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-3">
                <span className="text-xs font-bold text-zinc-100 font-sans uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={13} className="text-amber-500" />
                  <span>Smart Reminders Log</span>
                </span>
                
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    id="btn-clear-notifications"
                  >
                    <Trash2 size={11} />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Notification List Body */}
              <div className="overflow-y-auto space-y-2.5 pr-1 max-h-[20rem] scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="text-center py-10" id="empty-notifications-indicator">
                    <p className="text-zinc-500 text-xs italic">No active triggers tracked yet</p>
                    <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px] mx-auto leading-normal">
                      Reminders fire at scheduled times, 15m prior, and if tasks remain unchecked after 20 minutes.
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`text-xs p-3 rounded-xl border relative transition ${
                        notif.read 
                          ? 'bg-zinc-900/20 border-zinc-850 text-zinc-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 shadow-md shadow-zinc-950/20 ring-1 ring-zinc-800'
                      }`}
                      id={`notification-log-item-${notif.id}`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h5 className="font-semibold text-[11px] leading-tight text-zinc-100">
                          {notif.title}
                        </h5>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {notif.message}
                      </p>

                      {!notif.read && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="text-[9px] bg-zinc-950 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 font-bold py-1 px-2.5 rounded-lg border border-emerald-500/10 flex items-center gap-1 cursor-pointer"
                            id={`btn-mark-read-${notif.id}`}
                          >
                            <Check size={10} />
                            <span>Mark read</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notification Drawer Footer Info */}
            <div className="mt-3 border-t border-zinc-850 pt-2 text-[10px] text-zinc-500 leading-normal bg-zinc-950">
              ⚡ Alarms refresh adaptively relative to your current local machine timezone: <span className="text-zinc-400 font-mono font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
