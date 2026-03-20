"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rss, ExternalLink, RefreshCw, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  author: string | null;
}

interface RSSFeed {
  title: string;
  description?: string;
  items: RSSItem[];
}

const DEFAULT_FEEDS = [
  { url: "https://www.lemonde.fr/rss/une.xml", label: "Le Monde" },
  { url: "https://news.ycombinator.com/rss", label: "Hacker News" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function FeedPanel({ url, label, onRemove }: { url: string; label: string; onRemove: () => void }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<RSSFeed>({
    queryKey: ["rss-page", url],
    queryFn: async () => {
      const res = await fetch("/api/rss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, limit: 20 }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json() as Promise<RSSFeed>;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* En-tête du flux */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Rss className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {data?.title ?? label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Supprimer ce flux"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto max-h-96">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
            Impossible de charger ce flux
          </div>
        ) : (
          <ul>
            {data?.items.map((item, i) => (
              <li key={i} className="border-b border-border/50 last:border-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-2 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground group-hover:text-primary line-clamp-2">
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {item.pubDate && <span>{formatDate(item.pubDate)}</span>}
                      {item.author && <span>· {item.author}</span>}
                    </div>
                  </div>
                  <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function RSSPage() {
  const [feeds, setFeeds] = useState(DEFAULT_FEEDS);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  function addFeed() {
    if (!newUrl.trim()) return;
    setFeeds((prev) => [
      ...prev,
      { url: newUrl.trim(), label: newLabel.trim() || newUrl.trim() },
    ]);
    setNewUrl("");
    setNewLabel("");
    setShowAdd(false);
  }

  function removeFeed(url: string) {
    setFeeds((prev) => prev.filter((f) => f.url !== url));
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flux RSS</h1>
          <p className="text-sm text-muted-foreground">
            Agrégateur de vos flux RSS préférés
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ajouter un flux
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAdd && (
        <div className="flex items-end gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">URL du flux *</label>
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              onKeyDown={(e) => e.key === "Enter" && addFeed()}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom (optionnel)</label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Mon blog"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={addFeed}
            disabled={!newUrl.trim()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Ajouter
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Grille des flux */}
      {feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <Rss className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun flux RSS configuré</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {feeds.map((feed) => (
            <FeedPanel
              key={feed.url}
              url={feed.url}
              label={feed.label}
              onRemove={() => removeFeed(feed.url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
