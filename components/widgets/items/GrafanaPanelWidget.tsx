"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
import type { WidgetProps } from "@/types";

export function GrafanaPanelWidget({ config }: WidgetProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const grafanaUrl =
    (config.grafanaUrl as string) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_GRAFANA_URL) ||
    "";
  const dashboardId = config.dashboardId as string;
  const panelId = config.panelId as string | number;
  const orgId = (config.orgId as number) || 1;
  const refreshInterval = (config.refreshInterval as string) || "off";
  const title = config.title as string;
  const theme = (config.theme as string) || "dark";

  const iframeUrl =
    grafanaUrl && dashboardId && panelId
      ? `${grafanaUrl}/d-solo/${dashboardId}?panelId=${panelId}&orgId=${orgId}&theme=${theme}${refreshInterval !== "off" ? `&refresh=${refreshInterval}` : ""}`
      : null;

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
    setIsLoading(true);
    setHasError(false);
  }

  if (!iframeUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">Panel Grafana non configuré</p>
        <p className="text-xs">
          Configurez l&apos;URL Grafana, le Dashboard ID et le Panel ID
        </p>
      </div>
    );
  }

  return (
    <div className="group relative h-full w-full">
      {title && (
        <div className="absolute left-2 top-2 z-10 rounded bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {title}
        </div>
      )}

      {/* Contrôles au survol */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={handleRefresh}
          className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Rafraîchir"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <a
          href={iframeUrl.replace("/d-solo/", "/d/")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Ouvrir dans Grafana"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card text-muted-foreground">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm">Grafana inaccessible</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Réessayer
          </button>
        </div>
      )}

      <iframe
        key={refreshKey}
        src={iframeUrl}
        className="h-full w-full border-0"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        title={title || "Grafana Panel"}
      />
    </div>
  );
}
