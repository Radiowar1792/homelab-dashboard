"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "light", label: "Clair", icon: Sun },
  { value: "system", label: "Système", icon: Monitor },
];

const ACCENT_COLORS = [
  { label: "Bleu (défaut)", value: "221.2 83.2% 53.3%", class: "bg-blue-500" },
  { label: "Violet", value: "262.1 83.3% 57.8%", class: "bg-violet-500" },
  { label: "Vert", value: "142.1 76.2% 36.3%", class: "bg-green-600" },
  { label: "Orange", value: "24.6 95% 53.1%", class: "bg-orange-500" },
  { label: "Rose", value: "346.8 77.2% 49.8%", class: "bg-rose-500" },
  { label: "Cyan", value: "188.7 95.5% 37.3%", class: "bg-cyan-500" },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }
}

function applyAccent(hsl: string) {
  document.documentElement.style.setProperty("--primary", hsl);
}

export function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState(ACCENT_COLORS[0]?.value ?? "");

  // Charger depuis localStorage au montage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent");
    if (storedTheme) setTheme(storedTheme);
    if (storedAccent) setAccent(storedAccent);
  }, []);

  function handleThemeChange(t: Theme) {
    setTheme(t);
    localStorage.setItem("theme", t);
    applyTheme(t);
  }

  function handleAccentChange(value: string) {
    setAccent(value);
    localStorage.setItem("accent", value);
    applyAccent(value);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Apparence</h2>
        <p className="text-sm text-muted-foreground">
          Personnalisez l&apos;aspect visuel du dashboard
        </p>
      </div>

      {/* Thème */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Thème</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleThemeChange(value)}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors",
                theme === value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50"
              )}
            >
              {/* Aperçu du thème */}
              <div
                className={cn(
                  "relative h-16 w-full overflow-hidden rounded-md border border-border",
                  value === "light" ? "bg-white" : value === "dark" ? "bg-zinc-900" : "bg-gradient-to-r from-zinc-900 to-white"
                )}
              >
                <div
                  className={cn(
                    "absolute left-2 top-2 h-2 w-8 rounded",
                    value === "light" ? "bg-zinc-200" : "bg-zinc-700"
                  )}
                />
                <div
                  className={cn(
                    "absolute left-2 top-6 h-1.5 w-12 rounded",
                    value === "light" ? "bg-zinc-100" : "bg-zinc-800"
                  )}
                />
                <div
                  className={cn(
                    "absolute bottom-2 right-2 h-4 w-10 rounded",
                    value === "light" ? "bg-blue-500/80" : "bg-blue-600/80"
                  )}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
                {theme === value && <Check className="h-3 w-3 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Couleur d'accent */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Couleur d&apos;accent</h3>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => handleAccentChange(color.value)}
              title={color.label}
              className={cn(
                "h-9 w-9 rounded-full transition-transform hover:scale-110",
                color.class,
                accent === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground/30"
              )}
              aria-label={color.label}
            >
              {accent === color.value && (
                <Check className="mx-auto h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Préférence sauvegardée localement dans le navigateur
        </p>
      </div>
    </div>
  );
}
