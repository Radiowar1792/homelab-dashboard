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
  searxng: "",
};

const ENGINE_LABELS: Record<SearchEngine, string> = {
  brave: "Brave",
  google: "Google",
  duckduckgo: "DuckDuckGo",
  searxng: "SearXNG",
};

function EngineLogo({ engine }: { engine: SearchEngine }) {
  if (engine === "brave") {
    return (
      // Brave lion SVG simplifié
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C12 2 6 4.5 4 8c-1.5 2.8-.8 5.8 1 8 1 1.2 2.2 2.2 3.6 2.8L12 22l3.4-3.2c1.4-.6 2.6-1.6 3.6-2.8 1.8-2.2 2.5-5.2 1-8C18 4.5 12 2 12 2Z" fill="#FB542B"/>
        <path d="M12 6l-2 3h4l-2-3ZM9 10l1 4 2-2 2 2 1-4H9Z" fill="white" opacity="0.9"/>
      </svg>
    );
  }

  if (engine === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    );
  }

  if (engine === "duckduckgo") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="11" fill="#DE5833"/>
        <circle cx="12" cy="10" r="5.5" fill="white"/>
        <circle cx="13.5" cy="9" r="1.2" fill="#3D3D3D"/>
        <circle cx="13.9" cy="8.7" r="0.4" fill="white"/>
        <path d="M10.5 13.5 Q12 15 13.5 13.5" stroke="#3D3D3D" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }

  // SearXNG — icône générique
  return (
    <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
  );
}

export function SearchBarWidget({ config }: WidgetProps) {
  const cfg = config as SearchConfig;
  const engine = (cfg.engine as SearchEngine | undefined) ?? "brave";
  const customUrl = (cfg.customUrl as string | undefined) ?? "";
  const placeholder = (cfg.placeholder as string | undefined) ?? `Rechercher…`;

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
          {/* Logo moteur — injecté à gauche du champ */}
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center">
            <EngineLogo engine={engine} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
