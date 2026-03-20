"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check, Upload, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "light", label: "Clair", icon: Sun },
  { value: "system", label: "Système", icon: Monitor },
];

const ACCENT_COLORS = [
  { label: "Cyan terminal (défaut)", value: "192 100% 42%", class: "bg-cyan-500" },
  { label: "Bleu", value: "221.2 83.2% 53.3%", class: "bg-blue-500" },
  { label: "Vert terminal", value: "150 100% 40%", class: "bg-green-500" },
  { label: "Violet", value: "262.1 83.3% 57.8%", class: "bg-violet-500" },
  { label: "Orange", value: "24.6 95% 53.1%", class: "bg-orange-500" },
  { label: "Rose", value: "346.8 77.2% 49.8%", class: "bg-rose-500" },
];

const FONTS = [
  { id: "inter", label: "Inter (défaut)", variable: "var(--font-inter), system-ui, sans-serif" },
  { id: "jetbrains-mono", label: "JetBrains Mono", variable: "var(--font-jetbrains-mono), monospace" },
  { id: "fira-code", label: "Fira Code", variable: "var(--font-fira-code), monospace" },
  { id: "source-code-pro", label: "Source Code Pro", variable: "var(--font-source-code-pro), monospace" },
  { id: "space-mono", label: "Space Mono", variable: "var(--font-space-mono), monospace" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", variable: "var(--font-ibm-plex-mono), monospace" },
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

function applyFont(variable: string) {
  document.documentElement.style.setProperty("--font-app", variable);
  document.body.style.fontFamily = variable;
}

export function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState(ACCENT_COLORS[0]?.value ?? "");
  const [font, setFont] = useState("inter");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger depuis localStorage au montage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent");
    const storedFont = localStorage.getItem("app-font");
    const storedLogo = localStorage.getItem("app-logo");
    if (storedTheme) setTheme(storedTheme);
    if (storedAccent) setAccent(storedAccent);
    if (storedFont) {
      setFont(storedFont);
      const fontDef = FONTS.find((f) => f.id === storedFont);
      if (fontDef) applyFont(fontDef.variable);
    }
    if (storedLogo) setLogoUrl(storedLogo);
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

  function handleFontChange(fontId: string) {
    setFont(fontId);
    localStorage.setItem("app-font", fontId);
    const fontDef = FONTS.find((f) => f.id === fontId);
    if (fontDef) applyFont(fontDef.variable);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoUrl(dataUrl);
      localStorage.setItem("app-logo", dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleLogoReset() {
    setLogoUrl(null);
    localStorage.removeItem("app-logo");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
                    value === "light" ? "bg-blue-500/80" : "bg-cyan-600/80"
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

      {/* Police */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Police d&apos;écriture</h3>
        <div className="space-y-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFontChange(f.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                font === f.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p
                  className="mt-0.5 text-xs text-muted-foreground"
                  style={{ fontFamily: f.variable }}
                >
                  The quick brown fox — 0123456789
                </p>
              </div>
              {font === f.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          La police s&apos;applique à l&apos;ensemble de l&apos;interface
        </p>
      </div>

      {/* Logo */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">Logo du dashboard</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-muted/40 overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-primary">H</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <Upload className="h-3.5 w-3.5" />
              Choisir une image
            </label>
            {logoUrl && (
              <button
                onClick={handleLogoReset}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, SVG ou JPG recommandé. Stocké localement dans le navigateur.
        </p>
      </div>
    </div>
  );
}
