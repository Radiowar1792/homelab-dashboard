"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, LayoutDashboard, Settings2 } from "lucide-react";

const GRAFANA_BASE_URL = "http://172.16.10.154:3000";

const THEME_OPTIONS = [
  { value: "dark", label: "Sombre" },
  { value: "light", label: "Clair" },
];

interface Config {
  dashboardId: string;
  orgId: number;
  theme: string;
  title: string;
}

function buildIframeUrl(cfg: Config): string {
  const params = new URLSearchParams({
    orgId: String(cfg.orgId || 1),
    theme: cfg.theme || "dark",
    kiosk: "",
  });
  return `${GRAFANA_BASE_URL}/d/${cfg.dashboardId}?${params.toString()}`;
}

export function GrafanaDashboardWidget({ id }: { id: string }) {
  const STORAGE_KEY = `monitoring-config-${id}`;

  const [form, setForm] = useState<Config>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as Config;
    } catch {}
    return { dashboardId: "", orgId: 1, theme: "dark", title: "" };
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const isConfigured = !!form.dashboardId;
  const iframeUrl = isConfigured ? buildIframeUrl(form) : null;

  function handleSave() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
    setShowConfig(false);
    if (form.dashboardId) {
      setIsIframeLoading(true);
      setHasError(false);
      setRefreshKey((k) => k + 1);
    }
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    setIsIframeLoading(true);
    setHasError(false);
  }

  if (showConfig || !isConfigured) {
    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Dashboard Grafana</span>
          </div>
          {isConfigured && (
            <button onClick={() => setShowConfig(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Annuler
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dashboard ID</label>
            <input type="text" value={form.dashboardId} onChange={(e) => setForm((f) => ({ ...f, dashboardId: e.target.value }))} placeholder="ABC123xyz" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Titre (optionnel)</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Mon Dashboard" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Thème</label>
            <select value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary">
              {THEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={handleSave} disabled={!form.dashboardId} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-full w-full">
      {form.title && (
        <div className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {form.title}
        </div>
      )}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={() => setShowConfig(true)} className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70" aria-label="Configurer">
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleRefresh} className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70" aria-label="Rafraîchir">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        {iframeUrl && (
          <a href={iframeUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70" aria-label="Ouvrir dans Grafana">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      {isIframeLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card p-4 text-center">
          <LayoutDashboard className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Grafana inaccessible</p>
          <button onClick={handleRefresh} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground">
            <RefreshCw className="h-3 w-3" /> Réessayer
          </button>
        </div>
      )}
      {iframeUrl && (
        <iframe key={refreshKey} src={iframeUrl} className="h-full w-full border-0" onLoad={() => setIsIframeLoading(false)} onError={() => { setIsIframeLoading(false); setHasError(true); }} title={form.title || "Grafana Dashboard"} />
      )}
    </div>
  );
}
