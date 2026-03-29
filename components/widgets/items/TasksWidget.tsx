"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, CheckSquare, Square } from "lucide-react";
import type { WidgetProps } from "@/types";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

export function TasksWidget({ id }: WidgetProps) {
  const storageKey = `tasks-widget-${id}`;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setTasks(JSON.parse(raw) as Task[]);
    } catch {}
  }, [storageKey]);

  function persist(updated: Task[]) {
    setTasks(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
  }

  function addTask() {
    const text = draft.trim();
    if (!text) return;
    persist([...tasks, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
    inputRef.current?.focus();
  }

  function toggleTask(taskId: string) {
    persist(tasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t));
  }

  function deleteTask(taskId: string) {
    persist(tasks.filter((t) => t.id !== taskId));
  }

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <p className="text-xs font-semibold text-foreground">Tâches</p>
        {tasks.length > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {pending}/{tasks.length}
          </span>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {tasks.length === 0 ? (
          <p className="pt-4 text-center text-xs text-muted-foreground">Aucune tâche</p>
        ) : (
          <ul className="space-y-1">
            {tasks.map((task) => (
              <li key={task.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
                <button onClick={() => toggleTask(task.id)} className="shrink-0 text-muted-foreground hover:text-primary">
                  {task.done ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                </button>
                <span className={`flex-1 text-xs ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.text}
                </span>
                <button onClick={() => deleteTask(task.id)}
                  className="shrink-0 opacity-0 text-muted-foreground hover:text-destructive group-hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add task */}
      <div className="flex items-center gap-1 border-t border-border px-3 py-2">
        <input ref={inputRef} type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Nouvelle tâche…"
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
        <button onClick={addTask} disabled={!draft.trim()}
          className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
