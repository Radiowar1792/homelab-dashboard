"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { WidgetProps } from "@/types";

type SearchEngine = "brave" | "google" | "duckduckgo" | "searxng";

interface SearchConfig {
  engine?: SearchEngine;
  customUrl?: string;
  placeholder?: string;
}

const ENGINE_URLS: Record<SearchEngine, string> = {
  brave: "https://search.brave.com/search?q=",
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  searxng: "", // uses customUrl
};

const ENGINE_LABELS: Record<SearchEngine, string> = {
  brave: "Brave",
  google: "Google",
  duckduckgo: "DuckDuckGo",
  searxng: "SearXNG",
};

export function SearchBarWidget({ config }: WidgetProps) {
  const cfg = config as SearchConfig;
  const engine = (cfg.engine as SearchEngine | undefined) ?? "brave";
  const customUrl = (cfg.customUrl as string | undefined) ?? "";
  const placeholder = (cfg.placeholder as string | undefined) ?? `Rechercher avec ${ENGINE_LABELS[engine]}…`;

  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    let baseUrl: string;
    if (engine === "searxng") {
      baseUrl = customUrl.endsWith("=") ? customUrl : `${customUrl}?q=`;
    } else {
      baseUrl = ENGINE_URLS[engine];
    }

    window.open(`${baseUrl}${encodeURIComponent(query.trim())}`, "_blank", "noopener,noreferrer");
    setQuery("");
  }

  return (
    <div className="flex h-full items-center p-4">
      <form onSubmit={handleSearch} className="flex w-full items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {ENGINE_LABELS[engine]}
        </button>
      </form>
    </div>
  );
}
