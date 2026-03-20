"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface ServiceDef {
  id: string;
  name: string;
  url: string;
  timeout: number;
  expectedStatus: number;
  category?: string | null;
  icon?: string | null;
}

interface ServiceStatus {
  id: string;
  name: string;
  url: string;
  status: "online" | "offline" | "degraded" | "checking";
  statusCode?: number;
  responseTime?: number;
  lastChecked?: Date;
  error?: string;
}

const STATUS_STYLES: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-red-500",
  degraded: "bg-yellow-500",
  checking: "bg-muted animate-pulse",
};

export function ServiceStatusWidget({ config }: WidgetProps) {
  const refreshInterval = (config.refreshInterval as number | undefined) ?? 30;
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/services");
      const data = (await res.json()) as { services: ServiceDef[] };
      const services = data.services ?? [];

      if (services.length === 0) {
        setStatuses([]);
        return;
      }

      // Marquer tous comme "checking"
      setStatuses(
        services.map((s) => ({ id: s.id, name: s.name, url: s.url, status: "checking" }))
      );

      const checkRes = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      const checkData = (await checkRes.json()) as {
        results: (ServiceStatus | null)[];
      };

      setStatuses(
        (checkData.results.filter(Boolean) as ServiceStatus[]).map((r) => ({
          ...r,
          status: r.status as ServiceStatus["status"],
        }))
      );
      setLastChecked(new Date());
    } catch {
      setStatuses([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void checkServices();
    const interval = setInterval(() => void checkServices(), refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [checkServices, refreshInterval]);

  const onlineCount = statuses.filter((s) => s.status === "online").length;
  const totalCount = statuses.length;

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Services</span>
        </div>
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {onlineCount}/{totalCount} en ligne
            </span>
          )}
          <button
            onClick={() => void checkServices()}
            disabled={isRefreshing}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Rafraîchir"
          >
            <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Liste des services */}
      {statuses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
          <Activity className="h-8 w-8 opacity-30" />
          <p className="text-xs">Aucun service configuré</p>
          <p className="text-xs opacity-60">Ajoutez des services depuis les paramètres</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {statuses.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      STATUS_STYLES[service.status]
                    )}
                  />
                  <span className="truncate text-sm text-foreground">{service.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  {service.responseTime !== undefined && service.status !== "checking" && (
                    <span className="text-xs text-muted-foreground">
                      {service.responseTime}ms
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastChecked && (
        <p className="mt-2 text-right text-xs text-muted-foreground/60">
          {lastChecked.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
