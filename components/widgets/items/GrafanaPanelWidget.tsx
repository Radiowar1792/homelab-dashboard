"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  ExternalLink,
  BarChart2,
  Settings2,
  Info,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WidgetProps } from "@/types";

const REFRESH_OPTIONS = [
  { value: "off", label: "Désactivé" },
  { value: "30s", label: "30 secondes" },
  { value: "1m", label: "1 minute" },
  { value: "5m", label: "5 minutes" },
];

const THEME_OPTIONS = [
  { value: "dark", label: "Sombre" },
  { value: "light", label: "Clair" },
];

const GRAFANA_BASE_URL = "https://grafana.net-flow.fr";

interface GrafanaConfig {
  dashboardId: string;
  panelId: string;
  orgId: number;
  refreshInterval: string;
  theme: string;
  title: string;
}

function buildIframeUrl(cfg: GrafanaConfig): string {
  const base = GRAFANA_BASE_URL;
  const params = new URLSearchParams({
    panelId: String(cfg.panelId),
    orgId: String(cfg.orgId || 1),
    theme: cfg.theme || "dark",
  });
  if (cfg.refreshInterval && cfg.refreshInterval !== "off") {
    params.set("refresh", cfg.refreshInterval);
  }
  params.set("kiosk", "");
  return `${base}/d-solo/${cfg.dashboardId}?${params.toString()}`;
}

export function GrafanaPanelWidget({ id, config }: WidgetProps) {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Initialisation SSR-safe : état vide par défaut, puis lecture localStorage après montage
  const [form, setForm] = useState<GrafanaConfig>({
    dashboardId: (config.dashboardId as string) || "",
    panelId: (config.panelId as string) || "",
    orgId: (config.orgId as number) || 1,
    refreshInterval: (config.refreshInterval as string) || "off",
    theme: (config.theme as string) || "dark",
    title: (config.title as string) || "",
  });

  // Lecture localStorage côté client uniquement — clé calculée dans l'effet pour éviter
  // tout problème de closure si id change. Dépendance [id] pour réagir si le prop change.
  useEffect(() => {
    const key = `grafana-config-${id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as GrafanaConfig;
        if (parsed.dashboardId || parsed.panelId) setForm(parsed);
      }
    } catch {}
    setIsReady(true);
  }, [id]);

  const isConfigured = form.dashboardId && String(form.panelId);

  const iframeUrl = isConfigured ? buildIframeUrl(form) : null;

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    setIsIframeLoading(true);
    setHasError(false);
  }

  async function handleSave() {
    setIsSaving(true);
    // Save to localStorage immediately for resilience (key recalculated here, no closure risk)
    try { localStorage.setItem(`grafana-config-${id}`, JSON.stringify(form)); } catch {}
    try {
      const res = await fetch(`/api/widgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: form }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuration Grafana sauvegardée");
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setShowConfig(false);
      if (form.dashboardId && form.panelId) {
        setIsIframeLoading(true);
        setHasError(false);
        setRefreshKey((k) => k + 1);
      }
    } catch {
      toast.error("Impossible de sauvegarder");
    } finally {
      setIsSaving(false);
    }
  }

  // Attente de l'hydratation pour éviter le flash "config form" → iframe
  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Formulaire de configuration
  if (showConfig || !isConfigured) {
    return (
      <div className="flex h-full flex-col overflow-auto">
        {/* En-tête formulaire */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Configuration Grafana</span>
          </div>
          {isConfigured && (
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-auto p-4">
          {/* Étapes d'aide */}
          {!isConfigured && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">
                Comment trouver les IDs ?
              </p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Entre l&apos;URL de ton Grafana
                  <span className="ml-1 font-mono text-foreground">
                    (ex: http://192.168.1.x:3000)
                  </span>
                </li>
                <li>
                  Le Dashboard ID est dans l&apos;URL Grafana{" "}
                  <span className="font-mono text-foreground">
                    /d/ABC123/...
                  </span>
                </li>
                <li>
                  Le Panel ID : dans Grafana, clic sur un panel →{" "}
                  <em>Share → Link</em> → <span className="font-mono text-foreground">panelId=X</span>
                </li>
              </ol>
            </div>
          )}

          {/* Dashboard ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Dashboard ID
            </label>
            <input
              type="text"
              value={form.dashboardId}
              onChange={(e) =>
                setForm((f) => ({ ...f, dashboardId: e.target.value }))
              }
              placeholder="ABC123xyz"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Panel ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Panel ID
            </label>
            <input
              type="number"
              value={form.panelId}
              onChange={(e) =>
                setForm((f) => ({ ...f, panelId: e.target.value }))
              }
              placeholder="2"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Titre (optionnel) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Titre affiché (optionnel)
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="CPU usage"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Refresh + Thème */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Rafraîchissement
              </label>
              <select
                value={form.refreshInterval}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refreshInterval: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                {REFRESH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Thème
              </label>
              <select
                value={form.theme}
                onChange={(e) =>
                  setForm((f) => ({ ...f, theme: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                {THEME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note allow_embedding */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>
              Grafana doit avoir{" "}
              <code className="rounded bg-muted px-1 font-mono">
                allow_embedding = true
              </code>{" "}
              dans{" "}
              <code className="rounded bg-muted px-1 font-mono">
                grafana.ini
              </code>{" "}
              pour afficher les panels en iframe.
            </span>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={() => void handleSave()}
            disabled={isSaving || !form.dashboardId || !form.panelId}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSaving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    );
  }

  // Affichage iframe
  return (
    <div className="group relative h-full w-full">
      {form.title && (
        <div className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {form.title}
        </div>
      )}

      {/* Contrôles au survol */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setShowConfig(true)}
          className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Configurer"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleRefresh}
          className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Rafraîchir"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        {iframeUrl && (
          <a
            href={iframeUrl.replace("/d-solo/", "/d/").split("?")[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
            aria-label="Ouvrir dans Grafana"
          >
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-4 text-center text-muted-foreground">
          <BarChart2 className="h-8 w-8 text-destructive" />
          <p className="text-sm">Grafana inaccessible</p>
          <p className="text-xs">
            Vérifie l&apos;URL et que{" "}
            <code className="rounded bg-muted px-1 font-mono text-xs">
              allow_embedding = true
            </code>{" "}
            est configuré dans grafana.ini
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </button>
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs"
            >
              <Settings2 className="h-3 w-3" />
              Configurer
            </button>
          </div>
        </div>
      )}

      {iframeUrl && (
        <iframe
          key={refreshKey}
          src={iframeUrl}
          className="h-full w-full border-0"
          onLoad={() => setIsIframeLoading(false)}
          onError={() => {
            setIsIframeLoading(false);
            setHasError(true);
          }}
          title={form.title || "Grafana Panel"}
        />
      )}
    </div>
  );
}
