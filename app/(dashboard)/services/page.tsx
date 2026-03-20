"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ServiceDef {
  id: string;
  name: string;
  url: string;
  category: string | null;
  expectedStatus: number;
  timeout: number;
  isActive: boolean;
}

interface ServiceStatus extends ServiceDef {
  checkStatus: "online" | "offline" | "degraded" | "checking" | "pending";
  statusCode: number | undefined;
  responseTime: number | undefined;
  lastChecked: Date | undefined;
  error: string | undefined;
}

const STATUS_CONFIG = {
  online: { label: "En ligne", dot: "bg-green-500", badge: "bg-green-500/15 text-green-400" },
  offline: { label: "Hors ligne", dot: "bg-red-500", badge: "bg-red-500/15 text-red-400" },
  degraded: { label: "Dégradé", dot: "bg-yellow-500", badge: "bg-yellow-500/15 text-yellow-400" },
  checking: { label: "Vérification…", dot: "bg-blue-500 animate-pulse", badge: "bg-blue-500/15 text-blue-400" },
  pending: { label: "En attente", dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" },
};

export default function ServicesPage() {
  const [statuses, setStatuses] = useState<Map<string, ServiceStatus>>(new Map());
  const [isChecking, setIsChecking] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { data, isLoading } = useQuery<{ services: ServiceDef[] }>({
    queryKey: ["services-config"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      return res.json() as Promise<{ services: ServiceDef[] }>;
    },
  });

  const services = useMemo(() => data?.services ?? [], [data]);

  const checkAll = useCallback(async () => {
    if (services.length === 0) return;
    setIsChecking(true);

    // Marquer tous comme "checking"
    setStatuses((prev) => {
      const next = new Map(prev);
      for (const s of services) {
        const existing = prev.get(s.id) ?? { ...s, statusCode: undefined, responseTime: undefined, lastChecked: undefined, error: undefined };
        next.set(s.id, { ...existing, checkStatus: "checking" });
      }
      return next;
    });

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      const data = (await res.json()) as {
        results: Array<{
          id: string;
          status: string;
          statusCode?: number;
          responseTime?: number;
          error?: string;
        } | null>;
      };

      setStatuses((prev) => {
        const next = new Map(prev);
        for (const result of data.results) {
          if (!result) continue;
          const existing = next.get(result.id);
          if (existing) {
            next.set(result.id, {
              ...existing,
              checkStatus: result.status as ServiceStatus["checkStatus"],
              statusCode: result.statusCode,
              responseTime: result.responseTime,
              lastChecked: new Date(),
              error: result.error,
            });
          }
        }
        return next;
      });
      setLastRefresh(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [services]);

  // Init statuses quand les services chargent
  useEffect(() => {
    if (services.length > 0) {
      setStatuses(
        new Map(services.map((s) => [s.id, { ...s, checkStatus: "pending", statusCode: undefined, responseTime: undefined, lastChecked: undefined, error: undefined }]))
      );
      void checkAll();
    }
  }, [services.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling toutes les 30s
  useEffect(() => {
    if (services.length === 0) return;
    const interval = setInterval(() => void checkAll(), 30000);
    return () => clearInterval(interval);
  }, [checkAll, services.length]);

  const categorized = services.reduce<Record<string, ServiceDef[]>>((acc, s) => {
    const cat = s.category ?? "Général";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const allStatuses = Array.from(statuses.values());
  const onlineCount = allStatuses.filter((s) => s.checkStatus === "online").length;
  const offlineCount = allStatuses.filter((s) => s.checkStatus === "offline").length;
  const degradedCount = allStatuses.filter((s) => s.checkStatus === "degraded").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Status des Services</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring temps réel de vos services — rafraîchissement toutes les 30s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void checkAll()}
            disabled={isChecking || isLoading}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
            Vérifier
          </button>
          <Link
            href="/settings?tab=services"
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Gérer
          </Link>
        </div>
      </div>

      {/* Résumé */}
      {allStatuses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "En ligne", count: onlineCount, color: "text-green-400", bg: "bg-green-500/10" },
            { label: "Dégradé", count: degradedCount, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "Hors ligne", count: offlineCount, color: "text-red-400", bg: "bg-red-500/10" },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={cn("rounded-xl p-4", bg)}>
              <p className={cn("text-2xl font-bold", color)}>{count}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste par catégorie */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
          <Activity className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun service configuré</p>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter un service
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categorized).map(([category, catServices]) => (
            <div key={category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h2>
              <div className="space-y-2">
                {catServices.map((service) => {
                  const status = statuses.get(service.id);
                  const cfg = STATUS_CONFIG[status?.checkStatus ?? "pending"];
                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cfg.dot)} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{service.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{service.url}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {status?.responseTime !== undefined && status.checkStatus !== "checking" && (
                          <span className="text-xs text-muted-foreground">
                            {status.responseTime}ms
                          </span>
                        )}
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.badge)}>
                          {cfg.label}
                        </span>
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Ouvrir"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {lastRefresh && (
        <p className="text-right text-xs text-muted-foreground/60">
          Dernière vérification : {lastRefresh.toLocaleTimeString("fr-FR")}
        </p>
      )}
    </div>
  );
}
