"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, RefreshCw, Settings2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceConfig {
  name: string;
  url: string;
  refreshInterval: number;
}

interface CheckResult {
  online: boolean;
  statusCode: number | undefined;
  responseTime: number | undefined;
}

async function checkService(url: string): Promise<CheckResult> {
  try {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        services: [{ id: "check", name: "check", url, expectedStatus: 200, timeout: 5000, isActive: true }],
      }),
    });
    const data = (await res.json()) as {
      results: Array<{ status: string; statusCode?: number; responseTime?: number } | null>;
    };
    const result = data.results[0];
    if (!result) return { online: false, statusCode: undefined, responseTime: undefined };
    return {
      online: result.status === "online" || result.status === "degraded",
      statusCode: result.statusCode,
      responseTime: result.responseTime,
    };
  } catch {
    return { online: false, statusCode: undefined, responseTime: undefined };
  }
}

export function ServiceCheckWidget({ id }: { id: string }) {
  const STORAGE_KEY = `monitoring-config-${id}`;

  const [config, setConfig] = useState<ServiceConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ServiceConfig;
    } catch {}
    return { name: "", url: "", refreshInterval: 30 };
  });

  const [showConfig, setShowConfig] = useState(!config.url);
  const [form, setForm] = useState<ServiceConfig>(config);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const doCheck = useCallback(async (url: string) => {
    if (!url) return;
    setIsChecking(true);
    const r = await checkService(url);
    setResult(r);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (!config.url) return;
    void doCheck(config.url);
    const interval = setInterval(() => void doCheck(config.url), config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [config.url, config.refreshInterval, doCheck]);

  function handleSave() {
    setConfig(form);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch {}
    setShowConfig(false);
    if (form.url) {
      setResult(null);
      void doCheck(form.url);
    }
  }

  if (showConfig || !config.url) {
    return (
      <div className="flex h-full flex-col overflow-auto">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Vérification Service</span>
          </div>
          {config.url && (
            <button onClick={() => setShowConfig(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Annuler
            </button>
          )}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nom du service</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mon Service" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://mon-service.local" className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Intervalle (secondes)</label>
            <input type="number" value={form.refreshInterval} onChange={(e) => setForm((f) => ({ ...f, refreshInterval: Number(e.target.value) || 30 }))} min={5} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button onClick={handleSave} disabled={!form.url} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            Sauvegarder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <span className="truncate text-sm font-medium">{config.name || config.url}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setShowConfig(true)} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Configurer">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => void doCheck(config.url)} disabled={isChecking} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Rafraîchir">
            <RefreshCw className={cn("h-3.5 w-3.5", isChecking && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        {result === null ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <>
            {result.online ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
            <span className={cn("text-lg font-bold", result.online ? "text-green-500" : "text-destructive")}>
              {result.online ? "EN LIGNE" : "HORS LIGNE"}
            </span>
            {result.responseTime !== undefined && (
              <span className="text-xs text-muted-foreground">{result.responseTime}ms</span>
            )}
            {result.statusCode !== undefined && (
              <span className="text-xs text-muted-foreground">HTTP {result.statusCode}</span>
            )}
          </>
        )}
      </div>
      <p className="truncate text-center text-xs text-muted-foreground/60">{config.url}</p>
    </div>
  );
}
