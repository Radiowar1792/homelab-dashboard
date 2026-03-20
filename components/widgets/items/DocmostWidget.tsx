"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, ExternalLink } from "lucide-react";
import type { WidgetProps } from "@/types";

interface DocmostPage {
  id: string;
  title: string;
  updatedAt?: string;
  slug?: string;
}

export function DocmostWidget({ id, config }: WidgetProps) {
  const limit = (config.limit as number | undefined) ?? 5;

  const { data, isLoading, isError } = useQuery<DocmostPage[]>({
    queryKey: ["docmost-pages", id],
    queryFn: async () => {
      const res = await fetch("/api/integrations/docmost");
      if (!res.ok) throw new Error("Docmost inaccessible");
      const json = await res.json();
      const pages = Array.isArray(json) ? json : (json as { pages?: DocmostPage[] }).pages ?? [];
      return (pages as DocmostPage[]).slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: false,
  });

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Docmost</span>
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
            <p className="text-xs">Docmost inaccessible</p>
            <p className="text-xs opacity-60">Vérifiez la configuration</p>
          </div>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 opacity-40" />
          Aucune page récente
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1">
          {(data ?? []).map((page) => (
            <li key={page.id}>
              <div className="group flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm text-foreground">{page.title}</span>
                </div>
                {page.slug && (
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
