"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu, HardDrive, Clock } from "lucide-react";
import type { WidgetProps } from "@/types";

interface SystemStats {
  cpu: { cores: number; load1: number; load5: number; load15: number };
  memory: { total: number; used: number; free: number; usedPct: number };
  uptime: number;
  platform: string;
  hostname: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${bytes} B`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}j`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function Bar({ pct, color = "bg-primary" }: { pct: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function SystemStatsWidget({ config }: WidgetProps) {
  const refreshInterval = (config.refreshInterval as number | undefined) ?? 10;
  const [uptime, setUptime] = useState<number | null>(null);

  const { data, isLoading } = useQuery<SystemStats>({
    queryKey: ["system-stats"],
    queryFn: () => fetch("/api/system-stats").then((r) => r.json()),
    refetchInterval: refreshInterval * 1000,
  });

  useEffect(() => {
    if (data) setUptime(data.uptime);
  }, [data]);

  useEffect(() => {
    if (uptime === null) return;
    const id = setInterval(() => setUptime((prev) => (prev !== null ? prev + 1 : null)), 1000);
    return () => clearInterval(id);
  }, [uptime !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const cpuPct = Math.min(100, Math.round((data.cpu.load1 / data.cpu.cores) * 100));
  const memColor = data.memory.usedPct > 80 ? "bg-destructive" : data.memory.usedPct > 60 ? "bg-yellow-500" : "bg-primary";
  const cpuColor = cpuPct > 80 ? "bg-destructive" : cpuPct > 60 ? "bg-yellow-500" : "bg-primary";

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{data.hostname}</p>
        <span className="text-xs text-muted-foreground">{data.platform}</span>
      </div>

      {/* CPU */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <span>CPU ({data.cpu.cores} cores)</span>
          </div>
          <span className="font-mono font-medium text-foreground">{cpuPct}%</span>
        </div>
        <Bar pct={cpuPct} color={cpuColor} />
        <p className="text-[10px] text-muted-foreground">
          Load: {data.cpu.load1.toFixed(2)} / {data.cpu.load5.toFixed(2)} / {data.cpu.load15.toFixed(2)}
        </p>
      </div>

      {/* Memory */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            <span>RAM</span>
          </div>
          <span className="font-mono font-medium text-foreground">
            {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)} ({data.memory.usedPct}%)
          </span>
        </div>
        <Bar pct={data.memory.usedPct} color={memColor} />
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Uptime : <span className="font-mono text-foreground">{uptime !== null ? formatUptime(uptime) : formatUptime(data.uptime)}</span></span>
      </div>
    </div>
  );
}
