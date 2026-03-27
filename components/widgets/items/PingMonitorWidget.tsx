"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Circle, RefreshCw, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface Host {
  name: string;
  target: string;
}

interface PingResult {
  online: boolean;
  latency: number | null;
}

function isURL(target: string): boolean {
  return target.startsWith("http://") || target.startsWith("https://");
}

async function pingURL(url: string): Promise<PingResult> {
  const start = Date.now();
  try {
    await fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    return { online: true, latency: Date.now() - start };
  } catch {
    return { online: false, latency: null };
  }
}

async function pingHost(host: string): Promise<PingResult> {
  try {
    const res = await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ host }),
    });
    return res.json() as Promise<PingResult>;
  } catch {
    return { online: false, latency: null };
  }
}

function latencyColor(latency: number | null, online: boolean): string {
  if (!online || latency === null) return "text-destructive";
  if (latency < 20) return "text-green-500";
  if (latency < 100) return "text-orange-500";
  return "text-red-500";
}

const DEFAULT_HOSTS: Host[] = [
  { name: "Cloudflare DNS", target: "1.1.1.1" },
  { name: "Google DNS", target: "8.8.8.8" },
];

export function PingMonitorWidget({ id, config }: WidgetProps) {
  const storageKey = `dashboard-ping-${id}`;
  const refreshMs = ((config.refreshInterval as number) || 30) * 1000;

  const [hosts, setHosts] = useState<Host[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? (JSON.parse(saved) as Host[]) : DEFAULT_HOSTS;
    } catch {
      return DEFAULT_HOSTS;
    }
  });

  const [results, setResults] = useState<Record<string, PingResult>>({});
  const [isChecking, setIsChecking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const hostsRef = useRef(hosts);
  hostsRef.current = hosts;

  const checkAll = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    const current = hostsRef.current;
    const entries = await Promise.all(
      current.map(async (host) => {
        const result = isURL(host.target)
          ? await pingURL(host.target)
          : await pingHost(host.target);
        return [host.target, result] as const;
      })
    );
    setResults(Object.fromEntries(entries));
    setIsChecking(false);
  }, [isChecking]);

  useEffect(() => {
    checkAll();
    const timer = setInterval(() => {
      void (async () => {
        setIsChecking(true);
        const current = hostsRef.current;
        const entries = await Promise.all(
          current.map(async (host) => {
            const result = isURL(host.target)
              ? await pingURL(host.target)
              : await pingHost(host.target);
            return [host.target, result] as const;
          })
        );
        setResults(Object.fromEntries(entries));
        setIsChecking(false);
      })();
    }, refreshMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs]);

  function saveHosts(updated: Host[]) {
    setHosts(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  }

  function addHost() {
    if (!newName.trim() || !newTarget.trim()) return;
    saveHosts([...hosts, { name: newName.trim(), target: newTarget.trim() }]);
    setNewName("");
    setNewTarget("");
    setIsAdding(false);
  }

  function removeHost(target: string) {
    saveHosts(hosts.filter((h) => h.target !== target));
  }

  return (
    <div className="flex h-full flex-col">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Ping Monitor</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            title="Ajouter un hôte"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => void checkAll()}
            disabled={isChecking}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            title="Rafraîchir"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isChecking && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <div className="flex gap-2 border-b border-border p-2">
          <input
            type="text"
            placeholder="Nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-1/3 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="IP ou URL"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && addHost()}
          />
          <button
            onClick={addHost}
            className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground"
          >
            OK
          </button>
        </div>
      )}

      {/* Liste des hôtes */}
      <div className="flex-1 overflow-auto">
        {hosts.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Aucun hôte configuré
          </div>
        ) : (
          <div className="divide-y divide-border">
            {hosts.map((host) => {
              const result = results[host.target];
              const online = result?.online ?? null;
              const latency = result?.latency ?? null;

              return (
                <div
                  key={host.target}
                  className="group flex items-center justify-between px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Circle
                      className={cn(
                        "h-2.5 w-2.5 flex-shrink-0 fill-current",
                        online === null
                          ? "text-muted-foreground"
                          : online
                            ? "text-green-500"
                            : "text-destructive"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {host.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {host.target}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {result ? (
                      <span
                        className={cn(
                          "font-mono text-sm font-medium",
                          latencyColor(latency, online ?? false)
                        )}
                      >
                        {latency !== null ? `${latency}ms` : "timeout"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">…</span>
                    )}
                    <button
                      onClick={() => removeHost(host.target)}
                      className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
