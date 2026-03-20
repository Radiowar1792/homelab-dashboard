"use client";

import { useQuery } from "@tanstack/react-query";
import { Workflow, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt?: string;
}

interface N8NResponse {
  data: N8NWorkflow[];
}

export function N8NWidget({ id }: WidgetProps) {
  const { data, isLoading, isError } = useQuery<N8NWorkflow[]>({
    queryKey: ["n8n-workflows", id],
    queryFn: async () => {
      const res = await fetch("/api/integrations/n8n?resource=workflows");
      if (!res.ok) throw new Error("N8N inaccessible");
      const json = (await res.json()) as N8NResponse;
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });

  const activeCount = (data ?? []).filter((w) => w.active).length;

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <Workflow className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">N8N</span>
        {!isLoading && !isError && data && (
          <span className="ml-auto text-xs text-muted-foreground">
            {activeCount}/{data.length} actifs
          </span>
        )}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="text-xs">N8N inaccessible</p>
            <p className="text-xs opacity-60">Vérifiez la configuration</p>
          </div>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          Aucun workflow trouvé
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1.5">
          {(data ?? []).map((workflow) => (
            <li
              key={workflow.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                {workflow.active ? (
                  <Play className="h-3 w-3 shrink-0 text-green-500" />
                ) : (
                  <Pause className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm text-foreground">{workflow.name}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  workflow.active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {workflow.active ? "actif" : "inactif"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
