"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WidgetConfig } from "@/types";

// ─── Clock config ─────────────────────────────────────────────────────────────

function ClockConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const TIMEZONES = [
    "Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles",
    "America/Chicago", "America/Denver", "Asia/Tokyo", "Asia/Shanghai",
    "Asia/Dubai", "Australia/Sydney",
  ];

  const FONT_SIZES = [
    { label: "Petit", value: "small" },
    { label: "Moyen (défaut)", value: "medium" },
    { label: "Grand", value: "large" },
    { label: "Très grand", value: "xlarge" },
  ];

  return (
    <div className="space-y-4">
      {/* Format */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Format horaire</label>
        <div className="flex gap-2">
          {[{ label: "24 h", value: true }, { label: "12 h", value: false }].map(({ label, value }) => (
            <button key={label} onClick={() => onChange("format24h", value)}
              className={cn("flex-1 rounded-md border py-2 text-sm transition-colors",
                (config.format24h ?? true) === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondes */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Afficher les secondes</span>
        <button onClick={() => onChange("showSeconds", !(config.showSeconds ?? false))}
          className={cn("relative h-6 w-10 rounded-full transition-colors",
            config.showSeconds ? "bg-primary" : "bg-muted")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            config.showSeconds ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>

      {/* Date */}
      <div className="flex items-center justify-between">
        <span className="text-sm">Afficher la date</span>
        <button onClick={() => onChange("showDate", !(config.showDate ?? true))}
          className={cn("relative h-6 w-10 rounded-full transition-colors",
            (config.showDate ?? true) ? "bg-primary" : "bg-muted")}>
          <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            (config.showDate ?? true) ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Style</label>
        <div className="flex gap-2">
          {[{ label: "Digital", value: "digital" }, { label: "Minimal", value: "minimal" }].map(({ label, value }) => (
            <button key={value} onClick={() => onChange("style", value)}
              className={cn("flex-1 rounded-md border py-2 text-sm transition-colors",
                (config.style ?? "digital") === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Taille de police */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Taille de police</label>
        <select value={(config.fontSize as string | undefined) ?? "medium"}
          onChange={(e) => onChange("fontSize", e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          {FONT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Fuseau horaire */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Fuseau horaire</label>
        <select value={(config.timezone as string | undefined) ?? ""}
          onChange={(e) => onChange("timezone", e.target.value || undefined)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="">Local (défaut)</option>
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Search bar config ────────────────────────────────────────────────────────

function SearchBarConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const ENGINES = [
    { label: "Brave", value: "brave" },
    { label: "Google", value: "google" },
    { label: "DuckDuckGo", value: "duckduckgo" },
    { label: "SearXNG", value: "searxng" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Moteur de recherche</label>
        <div className="grid grid-cols-2 gap-2">
          {ENGINES.map(({ label, value }) => (
            <button key={value} onClick={() => onChange("engine", value)}
              className={cn("rounded-md border py-2 text-sm transition-colors",
                (config.engine ?? "brave") === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {config.engine === "searxng" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">URL SearXNG</label>
          <input type="text" value={(config.customUrl as string | undefined) ?? ""}
            onChange={(e) => onChange("customUrl", e.target.value)}
            placeholder="http://searxng.lan/search?q="
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
        </div>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Placeholder</label>
        <input type="text" value={(config.placeholder as string | undefined) ?? ""}
          onChange={(e) => onChange("placeholder", e.target.value)}
          placeholder="Rechercher…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>
    </div>
  );
}

// ─── Weather config ───────────────────────────────────────────────────────────

function WeatherConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Ville</label>
        <input type="text" value={(config.city as string | undefined) ?? ""}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="Paris"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Unités</label>
        <div className="flex gap-2">
          {[{ label: "°C (Celsius)", value: "metric" }, { label: "°F (Fahrenheit)", value: "imperial" }].map(({ label, value }) => (
            <button key={value} onClick={() => onChange("units", value)}
              className={cn("flex-1 rounded-md border py-2 text-sm transition-colors",
                (config.units ?? "metric") === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RSS config ───────────────────────────────────────────────────────────────

function RSSConfigForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">URL du flux RSS</label>
        <input type="text" value={(config.feedUrl as string | undefined) ?? ""}
          onChange={(e) => onChange("feedUrl", e.target.value)}
          placeholder="https://exemple.com/feed.rss"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Nombre d&apos;articles max</label>
        <input type="number" min={1} max={50} value={(config.maxItems as number | undefined) ?? 10}
          onChange={(e) => onChange("maxItems", parseInt(e.target.value))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
      </div>
    </div>
  );
}

// ─── Config form dispatcher ────────────────────────────────────────────────────

function ConfigForm({
  type, config, onChange,
}: {
  type: string;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  if (type === "clock") return <ClockConfigForm config={config} onChange={onChange} />;
  if (type === "search-bar") return <SearchBarConfigForm config={config} onChange={onChange} />;
  if (type === "weather") return <WeatherConfigForm config={config} onChange={onChange} />;
  if (type === "rss-feed") return <RSSConfigForm config={config} onChange={onChange} />;
  return (
    <p className="text-sm text-muted-foreground">
      Ce widget ne dispose pas d&apos;options de configuration.
    </p>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

const WIDGET_LABELS: Record<string, string> = {
  clock: "Horloge", "search-bar": "Barre de recherche", weather: "Météo",
  "rss-feed": "Flux RSS", "quick-notes": "Notes rapides", "grafana-panel": "Panel Grafana",
  "service-status": "Status des services", "public-ip": "IP Publique",
  "ping-monitor": "Ping Monitor", shortcuts: "Raccourcis", calendar: "Calendrier",
  pomodoro: "Pomodoro", "llm-chat": "LLM Chat",
};

interface WidgetConfigPanelProps {
  widget: WidgetConfig;
  onClose: () => void;
}

export function WidgetConfigPanel({ widget, onClose }: WidgetConfigPanelProps) {
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(
    widget.config as Record<string, unknown>
  );
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(key: string, value: unknown) {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      const res = await fetch(`/api/widgets/${widget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: localConfig }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      toast.success("Configuration sauvegardée");
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      onClose();
    },
    onError: () => toast.error("Impossible de sauvegarder"),
    onSettled: () => setIsSaving(false),
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              {WIDGET_LABELS[widget.type] ?? widget.type}
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-auto p-4">
          <ConfigForm type={widget.type} config={localConfig} onChange={handleChange} />
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button onClick={() => saveMutation.mutate()} disabled={isSaving}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </>
  );
}
