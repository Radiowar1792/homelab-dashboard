"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function buildCalendarDays(year: number, month: number): Array<{ date: Date; currentMonth: boolean }> {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  // getDay(): 0=Sun → map to Mon-first: (getDay() + 6) % 7
  const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
  const lastDate = new Date(year, month + 1, 0).getDate();

  const cells: Array<{ date: Date; currentMonth: boolean }> = [];

  // Previous month's trailing days
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -(startDow - 1 - i));
    cells.push({ date: d, currentMonth: false });
  }

  // Current month
  for (let d = 1; d <= lastDate; d++) {
    cells.push({ date: new Date(year, month, d), currentMonth: true });
  }

  // Next month's leading days to fill grid (multiple of 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(year, month + 1, i), currentMonth: false });
  }

  return cells;
}

export function CalendarWidget(_props: WidgetProps) {
  const [today] = useState(() => new Date());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Stay in sync if the date changes (e.g. widget opened next day)
  useEffect(() => {
    const now = new Date();
    if (
      now.getFullYear() !== today.getFullYear() ||
      now.getMonth() !== today.getMonth()
    ) {
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [today]);

  const cells = buildCalendarDays(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const isToday = (date: Date) =>
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isCurrentView =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="flex h-full flex-col p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded p-1 hover:bg-muted" aria-label="Mois précédent">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={goToday}
          className={cn(
            "text-sm font-semibold transition-colors hover:text-primary",
            isCurrentView ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {MONTHS[viewMonth]} {viewYear}
        </button>
        <button onClick={nextMonth} className="rounded p-1 hover:bg-muted" aria-label="Mois suivant">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-px">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid flex-1 grid-cols-7 gap-px">
        {cells.map(({ date, currentMonth }, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center justify-center rounded text-xs",
              !currentMonth && "text-muted-foreground/40",
              currentMonth && !isToday(date) && "text-foreground",
              isToday(date) && "bg-primary font-bold text-primary-foreground rounded-full"
            )}
          >
            {date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
}
