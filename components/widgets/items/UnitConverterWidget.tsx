"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { WidgetProps } from "@/types";

type Category = "length" | "weight" | "temperature" | "storage";

interface Unit { label: string; toBase: (v: number) => number; fromBase: (v: number) => number }

const UNITS: Record<Category, Unit[]> = {
  length: [
    { label: "mm", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "cm", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { label: "m", toBase: (v) => v, fromBase: (v) => v },
    { label: "km", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "in", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { label: "ft", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { label: "mi", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  ],
  weight: [
    { label: "mg", toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { label: "g", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { label: "kg", toBase: (v) => v, fromBase: (v) => v },
    { label: "t", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { label: "oz", toBase: (v) => v * 0.028349, fromBase: (v) => v / 0.028349 },
    { label: "lb", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
  ],
  temperature: [
    { label: "°C", toBase: (v) => v, fromBase: (v) => v },
    { label: "°F", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { label: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  storage: [
    { label: "B", toBase: (v) => v, fromBase: (v) => v },
    { label: "KB", toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
    { label: "MB", toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
    { label: "GB", toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
    { label: "TB", toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 },
  ],
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "length", label: "Longueur" },
  { value: "weight", label: "Masse" },
  { value: "temperature", label: "Temp." },
  { value: "storage", label: "Stockage" },
];

export function UnitConverterWidget(_props: WidgetProps) {
  const [category, setCategory] = useState<Category>("length");
  const [fromIdx, setFromIdx] = useState(2);
  const [toIdx, setToIdx] = useState(3);
  const [value, setValue] = useState("1");

  const units = UNITS[category];
  const fromUnit = units[fromIdx];
  const toUnit = units[toIdx];

  function convert(): string {
    const num = parseFloat(value);
    if (isNaN(num) || !fromUnit || !toUnit) return "";
    const base = fromUnit.toBase(num);
    const result = toUnit.fromBase(base);
    if (Math.abs(result) >= 1e9 || (Math.abs(result) < 0.001 && result !== 0)) {
      return result.toExponential(4);
    }
    return parseFloat(result.toPrecision(8)).toString();
  }

  function swapUnits() {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
  }

  function handleCategoryChange(cat: Category) {
    setCategory(cat);
    setFromIdx(0);
    setToIdx(1);
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Category selector */}
      <div className="flex gap-1 rounded-lg bg-muted p-0.5">
        {CATEGORIES.map(({ value: cat, label }) => (
          <button key={cat} onClick={() => handleCategoryChange(cat)}
            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              category === cat ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* From */}
      <div className="space-y-1">
        <select value={fromIdx} onChange={(e) => setFromIdx(parseInt(e.target.value))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary">
          {units?.map((u, i) => <option key={u.label} value={i}>{u.label}</option>)}
        </select>
        <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
      </div>

      {/* Swap */}
      <button onClick={swapUnits}
        className="mx-auto flex items-center gap-1 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
        <ArrowLeftRight className="h-3.5 w-3.5" />
      </button>

      {/* To */}
      <div className="space-y-1">
        <select value={toIdx} onChange={(e) => setToIdx(parseInt(e.target.value))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary">
          {units?.map((u, i) => <option key={u.label} value={i}>{u.label}</option>)}
        </select>
        <div className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-mono text-foreground">
          {convert() || "—"}
        </div>
      </div>
    </div>
  );
}
