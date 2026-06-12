export type TaskCategory = 'morning' | 'work' | 'fitness' | 'meals' | 'evening';

export type TaskStatus = 'done' | 'pending' | 'missed';

export interface RoutineTask {
  id: string;
  name: string;
  time: string; // e.g., "07:30" or "18:00" in 24-hour format
  duration: number; // in minutes
  category: TaskCategory;
  repeatDays: number[]; // 0 for Sunday, 1 for Monday, etc.
  notes?: string;
  statusString?: TaskStatus; // current day's status
}

export interface DayProgress {
  date: string; // YYYY-MM-DD
  completedTasksCount: number;
  totalTasksCount: number;
  tasks: Array<{
    id: string;
    name: string;
    category: TaskCategory;
    time: string;
    status: TaskStatus;
  }>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  history: { [date: string]: boolean }; // date -> whether completed 80%+
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'upcoming' | 'exact' | 'missed' | 'summary' | 'morning';
  read: boolean;
  taskId?: string;
}

export interface Quote {
  text: string;
  author: string;
}
