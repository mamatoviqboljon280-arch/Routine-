import { RoutineTask, Quote } from "./types";

export const DEFAULT_TASKS: RoutineTask[] = [
  {
    id: "task-1",
    name: "Morning Meditation & Breathing",
    time: "06:30",
    duration: 15,
    category: "morning",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "Deep breaths, set a calm intention for the day.",
  },
  {
    id: "task-2",
    name: "Healthy Power Breakfast",
    time: "07:15",
    duration: 30,
    category: "meals",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "High protein, hydration, and organic green tea.",
  },
  {
    id: "task-3",
    name: "Day Planning & Hardest Task First",
    time: "08:30",
    duration: 120,
    category: "work",
    repeatDays: [1, 2, 3, 4, 5],
    notes: "Mute notifications. Work deeply on the primary project.",
  },
  {
    id: "task-4",
    name: "Midday Power Walk & Stretch",
    time: "11:30",
    duration: 20,
    category: "fitness",
    repeatDays: [1, 2, 3, 4, 5],
    notes: "Step outside. Absorb sunlight, get dynamic movement.",
  },
  {
    id: "task-5",
    name: "Balanced Fueling Lunch",
    time: "12:00",
    duration: 45,
    category: "meals",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "Veggie rich meal. Take an absolute break from screens.",
  },
  {
    id: "task-6",
    name: "Focus Work & Collaboration Block",
    time: "14:00",
    duration: 90,
    category: "work",
    repeatDays: [1, 2, 3, 4, 5],
    notes: "Follow up on emails, review code, or organize team deliverables.",
  },
  {
    id: "task-7",
    name: "Cardio & Strength Training Session",
    time: "16:30",
    duration: 60,
    category: "fitness",
    repeatDays: [1, 2, 3, 4, 5],
    notes: "Push harder. Stay hydrated and put on upbeat music.",
  },
  {
    id: "task-8",
    name: "Nutritious Light Dinner",
    time: "18:30",
    duration: 45,
    category: "meals",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "Lighter proteins, dynamic salads.",
  },
  {
    id: "task-9",
    name: "Reading & Daily Review Journal",
    time: "20:30",
    duration: 30,
    category: "evening",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "Write down 3 things that went well and summarize any misses.",
  },
  {
    id: "task-10",
    name: "Wind-down & No Screens Prep",
    time: "22:15",
    duration: 30,
    category: "evening",
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    notes: "Dim warm lights. Put phone in sleep mode. Tea or calming music.",
  }
];

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    text: "Your morning sets the tone for the entire day. Shape it with intention.",
    author: "Unknown"
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    text: "A champion is someone who gets up when they can't.",
    author: "Jack Dempsey"
  },
  {
    text: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "Patience and persistence have a magical effect before which difficulties disappear.",
    author: "John Quincy Adams"
  },
  {
    text: "Energy and persistence conquer all things.",
    author: "Benjamin Franklin"
  }
];

export const CATEGORY_METADATA = {
  morning: {
    label: "Morning Routine",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    badgeColor: "bg-amber-500 text-amber-950",
    iconName: "Sun"
  },
  work: {
    label: "Work & Focus",
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    badgeColor: "bg-sky-500 text-sky-950",
    iconName: "Briefcase"
  },
  fitness: {
    label: "Fitness & Wellness",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    badgeColor: "bg-emerald-500 text-emerald-950",
    iconName: "Dumbbell"
  },
  meals: {
    label: "Meals & Fuel",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    badgeColor: "bg-rose-500 text-rose-950",
    iconName: "Utensils"
  },
  evening: {
    label: "Evening Wind-down",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    badgeColor: "bg-indigo-500 text-indigo-950",
    iconName: "Moon"
  }
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to convert "HH:MM" to minutes for sorting/math
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper format minutes to HH:MM format
export const formatMinutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// Helper to format 24-hr time to 12-hr format (AM/PM)
export const format12Hour = (time24: string): string => {
  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutesStr} ${ampm}`;
};
