"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

type Phase = "work" | "break";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function PomodoroWidget(_props: WidgetProps) {
  const [phase, setPhase] = useState<Phase>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            // Auto-switch phase
            setPhase((p) => {
              const next: Phase = p === "work" ? "break" : "work";
              setTimeout(() => setSecondsLeft(next === "work" ? WORK_SECONDS : BREAK_SECONDS), 0);
              return next;
            });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function reset() {
    setRunning(false);
    setSecondsLeft(phase === "work" ? WORK_SECONDS : BREAK_SECONDS);
  }

  function switchPhase(p: Phase) {
    setRunning(false);
    setPhase(p);
    setSecondsLeft(p === "work" ? WORK_SECONDS : BREAK_SECONDS);
  }

  const total = phase === "work" ? WORK_SECONDS : BREAK_SECONDS;
  const progress = 1 - secondsLeft / total;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  // SVG ring
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - progress);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      {/* Phase toggle */}
      <div className="flex rounded-full border border-border bg-muted/30 p-0.5 text-xs">
        <button
          onClick={() => switchPhase("work")}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition-colors",
            phase === "work" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Travail
        </button>
        <button
          onClick={() => switchPhase("break")}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition-colors",
            phase === "break" ? "bg-green-500 text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Pause
        </button>
      </div>

      {/* Ring timer */}
      <div className="relative flex items-center justify-center">
        <svg width="100" height="100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={cn(
              "transition-[stroke-dashoffset]",
              phase === "work" ? "stroke-primary" : "stroke-green-500"
            )}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {pad(minutes)}:{pad(seconds)}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">{phase === "work" ? "Focus" : "Pause"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Réinitialiser"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className={cn(
            "rounded-full p-3 text-white transition-colors",
            phase === "work" ? "bg-primary hover:bg-primary/90" : "bg-green-500 hover:bg-green-500/90"
          )}
          aria-label={running ? "Pause" : "Démarrer"}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
