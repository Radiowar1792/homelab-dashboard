"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface VikunjaTask {
  id: number;
  title: string;
  done: boolean;
  due_date?: string | null;
  priority?: number;
}

function formatDueDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const formatted = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return isOverdue ? `⚠ ${formatted}` : formatted;
  } catch {
    return null;
  }
}

export function VikunjaWidget({ id, config }: WidgetProps) {
  const limit = (config.limit as number | undefined) ?? 5;

  const { data, isLoading, isError } = useQuery<VikunjaTask[]>({
    queryKey: ["vikunja-tasks", id],
    queryFn: async () => {
      const res = await fetch("/api/integrations/vikunja?resource=tasks");
      if (!res.ok) throw new Error("Vikunja inaccessible");
      const data = await res.json();
      return Array.isArray(data) ? (data as VikunjaTask[]) : [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  const tasks = (data ?? []).filter((t) => !t.done).slice(0, limit);

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Tâches</span>
        {!isLoading && !isError && data && (
          <span className="ml-auto text-xs text-muted-foreground">
            {data.filter((t) => !t.done).length} en cours
          </span>
        )}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="text-xs">Vikunja inaccessible</p>
            <p className="text-xs opacity-60">Vérifiez la configuration</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <p className="text-xs">Aucune tâche en cours</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1.5">
          {tasks.map((task) => {
            const due = formatDueDate(task.due_date);
            return (
              <li
                key={task.id}
                className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/40"
              >
                <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{task.title}</p>
                  {due && (
                    <p
                      className={cn(
                        "text-xs",
                        due.startsWith("⚠") ? "text-red-400" : "text-muted-foreground"
                      )}
                    >
                      {due}
                    </p>
                  )}
                </div>
                {task.priority != null && task.priority > 3 && (
                  <span className="mt-0.5 shrink-0 text-xs text-orange-400">!</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
