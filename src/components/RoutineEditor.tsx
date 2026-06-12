import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import { RoutineTask, TaskCategory } from "../types";
import { CATEGORY_METADATA, WEEKDAYS, WEEKDAYS_SHORT } from "../data";

interface RoutineEditorProps {
  taskToEdit: RoutineTask | null; // Null means we are creating a new task
  onSave: (task: Omit<RoutineTask, "id"> & { id?: string }) => void;
  onClose: () => void;
}

export default function RoutineEditor({
  taskToEdit,
  onSave,
  onClose
}: RoutineEditorProps) {
  // Input fields state
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState<TaskCategory>("work");
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state if editing a task
  useEffect(() => {
    if (taskToEdit) {
      setName(taskToEdit.name);
      setTime(taskToEdit.time);
      setDuration(taskToEdit.duration);
      setCategory(taskToEdit.category);
      setRepeatDays(taskToEdit.repeatDays);
      setNotes(taskToEdit.notes || "");
    } else {
      // Defaults for a new task
      setName("");
      setTime("08:00");
      setDuration(30);
      setCategory("work");
      setRepeatDays([1, 2, 3, 4, 5]);
      setNotes("");
    }
    setErrorMessage("");
  }, [taskToEdit]);

  // Toggle dynamic days selection
  const handleToggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter(d => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  // Select all days / Select weekdays / Select weekends quick presets
  const applyDaysPreset = (preset: 'all' | 'weekdays' | 'weekends' | 'none') => {
    switch (preset) {
      case 'all':
        setRepeatDays([0, 1, 2, 3, 4, 5, 6]);
        break;
      case 'weekdays':
        setRepeatDays([1, 2, 3, 4, 5]);
        break;
      case 'weekends':
        setRepeatDays([0, 6]);
        break;
      case 'none':
        setRepeatDays([]);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please specify a task name.");
      return;
    }
    if (!time) {
      setErrorMessage("Please specify a start time.");
      return;
    }
    if (duration <= 0) {
      setErrorMessage("Duration must be a positive number.");
      return;
    }
    if (repeatDays.length === 0) {
      setErrorMessage("Please assign at least one weekday for this routine task.");
      return;
    }

    setErrorMessage("");
    onSave({
      id: taskToEdit?.id,
      name,
      time,
      duration,
      category,
      repeatDays,
      notes: notes.trim() || undefined
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in"
      id="routine-editor-overlay"
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden my-8"
        id="routine-editor-modal"
      >
        {/* Modal Header */}
        <div className="border-b border-zinc-800 p-6 flex justify-between items-center bg-zinc-950/20">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 font-sans">
              {taskToEdit ? "✍️ Edit Routine Task" : "➕ Create Routine Task"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Refine your day habits to build a highly sustainable plan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/40 transition cursor-pointer"
            id="close-editor-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="bg-rose-950/40 border border-rose-900/30 rounded-xl p-3 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Yoga, Deep Work Block, Lunch, Reading"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/20 placeholder-zinc-600 font-sans"
              tabIndex={1}
              autoFocus
              id="input-task-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Start clock time *
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 pl-10 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/80 font-mono"
                  id="input-task-time"
                />
                <Clock className="absolute left-3.5 top-2.5 text-zinc-500" size={14} />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/80 font-mono"
                id="input-task-duration"
              />
            </div>
          </div>

          {/* Category Choice */}
          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="category-selector-group">
              {(['morning', 'work', 'fitness', 'meals', 'evening'] as const).map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`py-2 px-2.5 rounded-xl text-xs border text-center font-bold tracking-tight cursor-pointer transition flex flex-col items-center gap-1.5 ${
                      isSelected 
                        ? `${meta.badgeColor} border-transparent font-extrabold shadow-md`
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                    id={`editor-cat-${catKey}`}
                  >
                    <span>{meta.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat Days Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                Repeat days *
              </label>

              {/* Day presets shortcut */}
              <div className="flex gap-2 text-[10px] text-zinc-500">
                <button
                  type="button"
                  onClick={() => applyDaysPreset('all')}
                  className="hover:text-emerald-400 font-medium cursor-pointer"
                >
                  All Days
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekdays')}
                  className="hover:text-sky-400 font-medium cursor-pointer"
                >
                  Weekdays
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => applyDaysPreset('weekends')}
                  className="hover:text-amber-400 font-medium cursor-pointer"
                >
                  Weekends
                </button>
              </div>
            </div>

            {/* Individual weekdays select circles */}
            <div className="flex justify-between gap-1 p-2 bg-zinc-950 border border-zinc-800 rounded-xl" id="repeat-days-group">
              {WEEKDAYS_SHORT.map((dayName, idx) => {
                const isSelected = repeatDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-zinc-100 border border-emerald-500 shadow-md"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 border border-transparent"
                    }`}
                    title={WEEKDAYS[idx]}
                    id={`editor-day-btn-${idx}`}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Notes */}
          <div>
            <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Notes & Reminders (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Leave screens outside the room, drink lemon water, warm up for 5 minutes..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3.5 text-zinc-100 text-sm focus:outline-none focus:border-emerald-500/80 placeholder-zinc-650 font-sans text-left"
              id="input-task-notes"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end border-t border-zinc-850 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 font-semibold text-sm py-2 px-5 rounded-xl cursor-pointer transition"
              id="editor-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-zinc-100 font-bold text-sm py-2 px-6 rounded-xl cursor-pointer shadow-lg shadow-emerald-950/20 transition"
              id="editor-btn-save"
            >
              {taskToEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
