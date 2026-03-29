"use client";

import { useEffect, useState } from "react";
import type { WidgetProps } from "@/types";

interface CountdownConfig {
  title?: string;
  targetDate?: string; // ISO string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function CountdownWidget({ config }: WidgetProps) {
  const cfg = config as CountdownConfig;
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    if (!cfg.targetDate) return;
    setTimeLeft(getTimeLeft(cfg.targetDate));
    const target = cfg.targetDate;
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [cfg.targetDate]);

  if (!cfg.targetDate) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Aucune date configurée</p>
        <p className="text-xs text-muted-foreground">Cliquez sur &ldquo;Personnaliser&rdquo; pour définir une date</p>
      </div>
    );
  }

  const expired = timeLeft?.total === 0;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
      {cfg.title && (
        <p className="text-sm font-semibold text-foreground">{cfg.title}</p>
      )}
      {expired ? (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-primary">🎉</p>
          <p className="text-sm text-muted-foreground">Événement passé</p>
        </div>
      ) : timeLeft ? (
        <div className="flex items-center gap-3">
          {[
            { value: timeLeft.days, label: "j" },
            { value: timeLeft.hours, label: "h" },
            { value: timeLeft.minutes, label: "m" },
            { value: timeLeft.seconds, label: "s" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-foreground">{pad(value)}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {new Date(cfg.targetDate).toLocaleDateString("fr-FR", { dateStyle: "long" })}
      </p>
    </div>
  );
}
