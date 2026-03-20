"use client";

import { useQuery } from "@tanstack/react-query";
import { Rss, ExternalLink } from "lucide-react";
import type { WidgetProps } from "@/types";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  author: string | null;
}

interface RSSFeed {
  title: string;
  items: RSSItem[];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function RSSFeedWidget({ id, config }: WidgetProps) {
  const url = config.url as string | undefined;
  const maxItems = (config.maxItems as number | undefined) ?? 10;

  const { data, isLoading, isError } = useQuery<RSSFeed>({
    queryKey: ["rss", id, url],
    queryFn: async () => {
      const res = await fetch("/api/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, limit: maxItems }),
      });
      if (!res.ok) throw new Error("Erreur RSS");
      return res.json() as Promise<RSSFeed>;
    },
    enabled: !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-muted-foreground">
        <Rss className="h-8 w-8 opacity-30" />
        <p className="text-xs">Aucune URL configurée</p>
        <p className="text-xs opacity-60">Configurez l&apos;URL du flux RSS dans les paramètres</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <Rss className="h-4 w-4 text-primary" />
        <span className="truncate text-sm font-medium text-foreground">
          {data?.title ?? "Flux RSS"}
        </span>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
          <p className="text-xs">Impossible de charger le flux</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1">
          {data?.items.map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground group-hover:text-primary">
                    {item.title}
                  </p>
                  {item.pubDate && (
                    <p className="text-xs text-muted-foreground">{formatDate(item.pubDate)}</p>
                  )}
                </div>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
