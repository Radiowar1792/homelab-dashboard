"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

type ClockStyle = "digital" | "minimal";

interface ClockConfig {
  format24h?: boolean;
  showSeconds?: boolean;
  timezone?: string;
  style?: ClockStyle;
}

function getTime(timezone: string | undefined) {
  const now = new Date();
  if (timezone) {
    try {
      return new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    } catch {
      // fall through to local time
    }
  }
  return now;
}

export function ClockWidget({ config }: WidgetProps) {
  const cfg = config as ClockConfig;
  const format24h = cfg.format24h ?? true;
  const showSeconds = cfg.showSeconds ?? false;
  const timezone = cfg.timezone as string | undefined;
  const style = (cfg.style as ClockStyle | undefined) ?? "digital";

  const [now, setNow] = useState(() => getTime(timezone));

  useEffect(() => {
    const interval = setInterval(() => setNow(getTime(timezone)), 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = format24h ? hours : hours % 12 || 12;

  const pad = (n: number) => String(n).padStart(2, "0");

  const timeStr = showSeconds
    ? `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(displayHours)}:${pad(minutes)}`;

  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (style === "minimal") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4">
        <p className="text-4xl font-light tabular-nums text-foreground">
          {timeStr}
          {!format24h && <span className="ml-2 text-xl text-muted-foreground">{ampm}</span>}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
      </div>
    );
  }

  // digital style (default)
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      <div className="flex items-baseline gap-1">
        <span className={cn("font-mono tabular-nums text-foreground", "text-5xl font-bold")}>
          {timeStr}
        </span>
        {!format24h && (
          <span className="ml-1 font-mono text-xl font-medium text-muted-foreground">{ampm}</span>
        )}
      </div>
      <p className="text-sm capitalize text-muted-foreground">{dateStr}</p>
      {timezone && (
        <p className="text-xs text-muted-foreground/60">{timezone}</p>
      )}
    </div>
  );
}
