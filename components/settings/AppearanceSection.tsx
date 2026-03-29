"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check, Upload, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";
type Density = "compact" | "normal" | "spacious";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DENSITY_OPTIONS: { value: Density; label: string; desc: string }[] = [
  { value: "compact", label: "Compact", desc: "Padding réduit" },
  { value: "normal", label: "Normal", desc: "Défaut" },
  { value: "spacious", label: "Spacieux", desc: "Plus d'espace" },
];

interface ThemePreset {
  id: string;
  label: string;
  background: string;
  card: string;
  primary: string;
  primaryFg: string;
  foreground: string;
  muted: string;
  border: string;
  secondary: string;
  dark: boolean;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "catppuccin",
    label: "Catppuccin Mocha",
    background: "240 21% 15%",
    card: "237 14% 21%",
    primary: "267 84% 81%",
    primaryFg: "240 21% 15%",
    foreground: "230 78% 88%",
    muted: "240 11% 25%",
    border: "240 13% 28%",
    secondary: "240 11% 25%",
    dark: true,
  },
  {
    id: "nord",
    label: "Nord",
    background: "220 17% 22%",
    card: "222 16% 28%",
    primary: "193 43% 67%",
    primaryFg: "220 17% 22%",
    foreground: "218 27% 94%",
    muted: "220 13% 30%",
    border: "220 15% 32%",
    secondary: "220 13% 30%",
    dark: true,
  },
  {
    id: "dracula",
    label: "Dracula",
    background: "231 15% 18%",
    card: "232 14% 25%",
    primary: "265 89% 78%",
    primaryFg: "231 15% 18%",
    foreground: "60 30% 96%",
    muted: "232 14% 28%",
    border: "232 14% 32%",
    secondary: "232 14% 28%",
    dark: true,
  },
  {
    id: "gruvbox",
    label: "Gruvbox",
    background: "0 0% 16%",
    card: "6 5% 22%",
    primary: "42 77% 46%",
    primaryFg: "0 0% 16%",
    foreground: "43 56% 81%",
    muted: "6 5% 25%",
    border: "6 5% 28%",
    secondary: "6 5% 25%",
    dark: true,
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    background: "234 17% 12%",
    card: "229 26% 19%",
    primary: "220 89% 72%",
    primaryFg: "234 17% 12%",
    foreground: "230 72% 86%",
    muted: "229 20% 22%",
    border: "229 20% 24%",
    secondary: "229 20% 22%",
    dark: true,
  },
];

// ─── Color utilities ──────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHslChannels(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

function hslChannelsToHex(channels: string): string {
  const parts = channels.replace(/%/g, "").split(/\s+/);
  const h = parseFloat(parts[0] ?? "0");
  const s = parseFloat(parts[1] ?? "0");
  const l = parseFloat(parts[2] ?? "0");
  return hslToHex(h, s, l);
}

// ─── Apply functions ──────────────────────────────────────────────────────────

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

function applyRadius(px: number) {
  document.documentElement.style.setProperty("--radius", `${px}px`);
}

function applyDensity(density: Density) {
  const map: Record<Density, string> = { compact: "0.5rem", normal: "1rem", spacious: "1.5rem" };
  document.documentElement.style.setProperty("--density-padding", map[density]);
}

function applySidebarOpacity(pct: number) {
  document.documentElement.style.setProperty("--sidebar-opacity", String(pct / 100));
}

function applyBackground(url: string | null, opacity: number, blur: number) {
  let bgEl = document.getElementById("app-bg-layer") as HTMLDivElement | null;
  if (!bgEl) {
    bgEl = document.createElement("div");
    bgEl.id = "app-bg-layer";
    bgEl.style.cssText =
      "position:fixed;inset:0;z-index:-1;pointer-events:none;background-size:cover;background-position:center;background-attachment:fixed;transition:opacity 0.3s;";
    document.body.prepend(bgEl);
  }
  if (url) {
    bgEl.style.backgroundImage = `url(${url})`;
    bgEl.style.filter = blur > 0 ? `blur(${blur}px)` : "";
    bgEl.style.opacity = String(opacity / 100);
    bgEl.style.inset = blur > 0 ? `-${blur * 2}px` : "0";
  } else {
    bgEl.style.backgroundImage = "";
    bgEl.style.filter = "";
    bgEl.style.opacity = "0";
    bgEl.style.inset = "0";
  }
  // Reset body background (the fixed element handles it)
  document.body.style.backgroundImage = "";
  document.documentElement.style.setProperty("--bg-overlay-opacity", url ? String(opacity / 100) : "0");
}

function applyCardShadow(enabled: boolean) {
  document.documentElement.style.setProperty(
    "--card-shadow",
    enabled ? "0 4px 24px rgba(0,0,0,0.18)" : "none"
  );
}

function applyCardBorder(enabled: boolean) {
  document.documentElement.style.setProperty("--card-border-width", enabled ? "1px" : "0px");
}

function applyAnimations(enabled: boolean) {
  document.documentElement.classList.toggle("no-animations", !enabled);
}

function applyAnimationSpeed(ms: number) {
  document.documentElement.style.setProperty("--anim-duration", `${ms}ms`);
}

function applyPreset(preset: ThemePreset) {
  const root = document.documentElement;
  root.style.setProperty("--background", preset.background);
  root.style.setProperty("--card", preset.card);
  root.style.setProperty("--popover", preset.card);
  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--primary-foreground", preset.primaryFg);
  root.style.setProperty("--foreground", preset.foreground);
  root.style.setProperty("--card-foreground", preset.foreground);
  root.style.setProperty("--muted", preset.muted);
  root.style.setProperty("--muted-foreground", preset.muted + " / 0.7");
  root.style.setProperty("--accent", preset.secondary);
  root.style.setProperty("--accent-foreground", preset.foreground);
  root.style.setProperty("--secondary", preset.secondary);
  root.style.setProperty("--secondary-foreground", preset.foreground);
  root.style.setProperty("--border", preset.border);
  root.style.setProperty("--input", preset.muted);
  root.style.setProperty("--ring", preset.primary);
  if (preset.dark) root.classList.add("dark");
  else root.classList.remove("dark");
}

function applyCustomColor(variable: string, hslChannels: string) {
  document.documentElement.style.setProperty(variable, hslChannels);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [accent, setAccent] = useState(ACCENT_COLORS[0]?.value ?? "");
  const [font, setFont] = useState("inter");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [radius, setRadius] = useState(8);
  const [density, setDensity] = useState<Density>("normal");
  const [sidebarOpacity, setSidebarOpacity] = useState(100);
  const [bgUrl, setBgUrl] = useState("");
  const [bgOpacity, setBgOpacity] = useState(60);
  const [bgBlur, setBgBlur] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [cardShadows, setCardShadows] = useState(false);
  const [cardBorders, setCardBorders] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(300);
  // Custom color pickers
  const [customBg, setCustomBg] = useState("");
  const [customCard, setCustomCard] = useState("");
  const [customText, setCustomText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const get = (k: string) => localStorage.getItem(k);
    const storedTheme = get("theme") as Theme | null;
    const storedAccent = get("accent");
    const storedFont = get("app-font");
    const storedLogo = get("app-logo");
    const storedRadius = get("app-radius");
    const storedDensity = get("app-density") as Density | null;
    const storedSidebarOpacity = get("app-sidebar-opacity");
    const storedBgUrl = get("app-bg-url");
    const storedBgOpacity = get("app-bg-opacity");
    const storedBgBlur = get("app-bg-blur");
    const storedPreset = get("app-preset");
    const storedCardShadows = get("app-card-shadows");
    const storedCardBorders = get("app-card-borders");
    const storedAnimations = get("app-animations");
    const storedAnimSpeed = get("app-anim-speed");
    const storedCustomBg = get("app-color-bg");
    const storedCustomCard = get("app-color-card");
    const storedCustomText = get("app-color-text");

    if (storedTheme) setTheme(storedTheme);
    if (storedAccent) { setAccent(storedAccent); applyAccent(storedAccent); }
    if (storedFont) {
      setFont(storedFont);
      const fontDef = FONTS.find((f) => f.id === storedFont);
      if (fontDef) applyFont(fontDef.variable);
    }
    if (storedLogo) setLogoUrl(storedLogo);
    if (storedRadius) { const r = parseInt(storedRadius); setRadius(r); applyRadius(r); }
    if (storedDensity) { setDensity(storedDensity); applyDensity(storedDensity); }
    if (storedSidebarOpacity) { const v = parseInt(storedSidebarOpacity); setSidebarOpacity(v); applySidebarOpacity(v); }
    if (storedBgBlur) { const v = parseInt(storedBgBlur); setBgBlur(v); }
    if (storedBgUrl) setBgUrl(storedBgUrl);
    if (storedBgOpacity) setBgOpacity(parseInt(storedBgOpacity));
    if (storedBgUrl) applyBackground(storedBgUrl, storedBgOpacity ? parseInt(storedBgOpacity) : 60, storedBgBlur ? parseInt(storedBgBlur) : 0);
    if (storedPreset) {
      setActivePreset(storedPreset);
      const preset = THEME_PRESETS.find((p) => p.id === storedPreset);
      if (preset) applyPreset(preset);
    }
    if (storedCardShadows !== null) { const v = storedCardShadows === "true"; setCardShadows(v); applyCardShadow(v); }
    if (storedCardBorders !== null) { const v = storedCardBorders !== "false"; setCardBorders(v); applyCardBorder(v); }
    if (storedAnimations !== null) { const v = storedAnimations !== "false"; setAnimations(v); applyAnimations(v); }
    if (storedAnimSpeed) { const v = parseInt(storedAnimSpeed); setAnimationSpeed(v); applyAnimationSpeed(v); }
    if (storedCustomBg) { setCustomBg(hslChannelsToHex(storedCustomBg)); applyCustomColor("--background", storedCustomBg); }
    if (storedCustomCard) { setCustomCard(hslChannelsToHex(storedCustomCard)); applyCustomColor("--card", storedCustomCard); }
    if (storedCustomText) { setCustomText(hslChannelsToHex(storedCustomText)); applyCustomColor("--foreground", storedCustomText); }
  }, []);

  function handleThemeChange(t: Theme) {
    setTheme(t); setActivePreset(null);
    localStorage.setItem("theme", t); localStorage.removeItem("app-preset");
    applyTheme(t);
  }

  function handleAccentChange(value: string) {
    setAccent(value); localStorage.setItem("accent", value); applyAccent(value);
  }

  function handleFontChange(fontId: string) {
    setFont(fontId); localStorage.setItem("app-font", fontId);
    const fontDef = FONTS.find((f) => f.id === fontId);
    if (fontDef) applyFont(fontDef.variable);
  }

  function handleRadiusChange(value: number) {
    setRadius(value); localStorage.setItem("app-radius", String(value)); applyRadius(value);
  }

  function handleDensityChange(d: Density) {
    setDensity(d); localStorage.setItem("app-density", d); applyDensity(d);
  }

  function handleSidebarOpacityChange(value: number) {
    setSidebarOpacity(value); localStorage.setItem("app-sidebar-opacity", String(value)); applySidebarOpacity(value);
  }

  function handleBgUrlChange(url: string) {
    setBgUrl(url);
    if (url.trim()) {
      localStorage.setItem("app-bg-url", url.trim());
      applyBackground(url.trim(), bgOpacity, bgBlur);
    } else {
      localStorage.removeItem("app-bg-url");
      applyBackground(null, bgOpacity, bgBlur);
    }
  }

  function handleBgOpacityChange(value: number) {
    setBgOpacity(value); localStorage.setItem("app-bg-opacity", String(value));
    if (bgUrl.trim()) applyBackground(bgUrl.trim(), value, bgBlur);
  }

  function handleBgBlurChange(value: number) {
    setBgBlur(value); localStorage.setItem("app-bg-blur", String(value));
    if (bgUrl.trim()) applyBackground(bgUrl.trim(), bgOpacity, value);
  }

  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgUrl(dataUrl);
      localStorage.setItem("app-bg-url", dataUrl);
      applyBackground(dataUrl, bgOpacity, bgBlur);
    };
    reader.readAsDataURL(file);
  }

  function handleBgReset() {
    setBgUrl(""); localStorage.removeItem("app-bg-url");
    applyBackground(null, bgOpacity, bgBlur);
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoUrl(dataUrl);
      localStorage.setItem("app-logo", dataUrl);
      window.dispatchEvent(new CustomEvent("homelab:logo-change", { detail: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleLogoReset() {
    setLogoUrl(null); localStorage.removeItem("app-logo");
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.dispatchEvent(new CustomEvent("homelab:logo-change", { detail: null }));
  }

  function handlePresetApply(preset: ThemePreset) {
    setActivePreset(preset.id);
    localStorage.setItem("app-preset", preset.id);
    applyPreset(preset);
    if (preset.dark) { setTheme("dark"); localStorage.setItem("theme", "dark"); }
    else { setTheme("light"); localStorage.setItem("theme", "light"); }
    // Update accent to match preset primary
    setAccent(preset.primary); localStorage.setItem("accent", preset.primary);
  }

  function handleCardShadowsToggle() {
    const next = !cardShadows; setCardShadows(next);
    localStorage.setItem("app-card-shadows", String(next)); applyCardShadow(next);
  }

  function handleCardBordersToggle() {
    const next = !cardBorders; setCardBorders(next);
    localStorage.setItem("app-card-borders", String(next)); applyCardBorder(next);
  }

  function handleAnimationsToggle() {
    const next = !animations; setAnimations(next);
    localStorage.setItem("app-animations", String(next)); applyAnimations(next);
  }

  function handleAnimationSpeedChange(ms: number) {
    setAnimationSpeed(ms); localStorage.setItem("app-anim-speed", String(ms)); applyAnimationSpeed(ms);
  }

  function handleCustomBgChange(hex: string) {
    setCustomBg(hex);
    const channels = hexToHslChannels(hex);
    localStorage.setItem("app-color-bg", channels); applyCustomColor("--background", channels);
    setActivePreset(null); localStorage.removeItem("app-preset");
  }

  function handleCustomCardChange(hex: string) {
    setCustomCard(hex);
    const channels = hexToHslChannels(hex);
    localStorage.setItem("app-color-card", channels); applyCustomColor("--card", channels);
    setActivePreset(null); localStorage.removeItem("app-preset");
  }

  function handleCustomTextChange(hex: string) {
    setCustomText(hex);
    const channels = hexToHslChannels(hex);
    localStorage.setItem("app-color-text", channels); applyCustomColor("--foreground", channels);
    setActivePreset(null); localStorage.removeItem("app-preset");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground">Apparence</h2>
        <p className="text-sm text-muted-foreground">Personnalisez l&apos;aspect visuel du dashboard</p>
      </div>

      {/* Thème */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Thème</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <button key={value} onClick={() => handleThemeChange(value)}
              className={cn("flex flex-col items-center gap-3 rounded-lg border p-4 transition-colors",
                theme === value && activePreset === null ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
              <div className={cn("relative h-16 w-full overflow-hidden rounded-md border border-border",
                value === "light" ? "bg-white" : value === "dark" ? "bg-zinc-900" : "bg-gradient-to-r from-zinc-900 to-white")}>
                <div className={cn("absolute left-2 top-2 h-2 w-8 rounded", value === "light" ? "bg-zinc-200" : "bg-zinc-700")} />
                <div className={cn("absolute left-2 top-6 h-1.5 w-12 rounded", value === "light" ? "bg-zinc-100" : "bg-zinc-800")} />
                <div className={cn("absolute bottom-2 right-2 h-4 w-10 rounded", value === "light" ? "bg-blue-500/80" : "bg-cyan-600/80")} />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
                {theme === value && activePreset === null && <Check className="h-3 w-3 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Thèmes prédéfinis */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Thèmes prédéfinis</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {THEME_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => handlePresetApply(preset)}
              className={cn(
                "group relative overflow-hidden rounded-lg border p-3 text-left transition-colors",
                activePreset === preset.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
              )}>
              <div className="mb-2 flex gap-1">
                {[preset.background, preset.card, preset.primary, preset.foreground].map((color, i) => (
                  <div key={i} className="h-4 flex-1 rounded-sm"
                    style={{ background: `hsl(${color})` }} />
                ))}
              </div>
              <p className="text-xs font-medium text-foreground">{preset.label}</p>
              {activePreset === preset.id && (
                <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Couleur d'accent */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Couleur d&apos;accent</h3>
        <div className="flex flex-wrap items-center gap-3">
          {ACCENT_COLORS.map((color) => (
            <button key={color.value} onClick={() => handleAccentChange(color.value)} title={color.label}
              className={cn("h-9 w-9 rounded-full transition-transform hover:scale-110", color.class,
                accent === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground/30")}
              aria-label={color.label}>
              {accent === color.value && <Check className="mx-auto h-4 w-4 text-white" />}
            </button>
          ))}
          <div className="relative">
            <input type="color" id="custom-accent"
              defaultValue="#00d4ff"
              onChange={(e) => handleAccentChange(hexToHslChannels(e.target.value))}
              className="h-9 w-9 cursor-pointer rounded-full border-2 border-border p-0.5 bg-transparent"
              title="Couleur personnalisée" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Préférence sauvegardée localement</p>
      </section>

      {/* Couleurs personnalisées */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Couleurs personnalisées</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Arrière-plan", value: customBg, onChange: handleCustomBgChange, defaultColor: "#0b1120" },
            { label: "Cards", value: customCard, onChange: handleCustomCardChange, defaultColor: "#141b2d" },
            { label: "Texte", value: customText, onChange: handleCustomTextChange, defaultColor: "#e2e8f0" },
          ].map(({ label, value, onChange, defaultColor }) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-lg border border-border p-3">
              <span className="text-xs text-muted-foreground">{label}</span>
              <input type="color" value={value || defaultColor}
                onChange={(e) => onChange(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-md border border-border p-0.5 bg-transparent"
                title={label} />
            </div>
          ))}
        </div>
      </section>

      {/* Police */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Police d&apos;écriture</h3>
        <div className="space-y-2">
          {FONTS.map((f) => (
            <button key={f.id} onClick={() => handleFontChange(f.id)}
              className={cn("flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors",
                font === f.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
              <div>
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: f.variable }}>
                  The quick brown fox — 0123456789
                </p>
              </div>
              {font === f.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </section>

      {/* Rayon des bordures */}
      <section>
        <h3 className="mb-1 text-sm font-medium text-foreground">Rayon des bordures</h3>
        <p className="mb-3 text-xs text-muted-foreground">Cards et widgets : 0 px (carré) → 20 px (arrondi)</p>
        <div className="flex items-center gap-4">
          <input type="range" min={0} max={20} step={1} value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="w-12 text-right text-sm font-mono text-foreground">{radius} px</span>
        </div>
        <div className="mt-3 flex gap-2">
          {[0, 4, 8, 12, 16, 20].map((v) => (
            <button key={v} onClick={() => handleRadiusChange(v)}
              className={cn("flex h-8 w-8 items-center justify-center border text-xs transition-colors",
                radius === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}
              style={{ borderRadius: v }}>
              {v}
            </button>
          ))}
        </div>
      </section>

      {/* Densité */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Densité de l&apos;interface</h3>
        <div className="grid grid-cols-3 gap-2">
          {DENSITY_OPTIONS.map(({ value, label, desc }) => (
            <button key={value} onClick={() => handleDensityChange(value)}
              className={cn("flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors",
                density === value ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
              {density === value && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Cards &amp; widgets</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Ombres</p>
              <p className="text-xs text-muted-foreground">Ombre portée sous les cards</p>
            </div>
            <button onClick={handleCardShadowsToggle}
              className={cn("relative h-6 w-10 rounded-full transition-colors",
                cardShadows ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                cardShadows ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Bordures</p>
              <p className="text-xs text-muted-foreground">Contour des cards</p>
            </div>
            <button onClick={handleCardBordersToggle}
              className={cn("relative h-6 w-10 rounded-full transition-colors",
                cardBorders ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                cardBorders ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        </div>
      </section>

      {/* Animations */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Animations</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Activer les animations</p>
              <p className="text-xs text-muted-foreground">Transitions et effets visuels</p>
            </div>
            <button onClick={handleAnimationsToggle}
              className={cn("relative h-6 w-10 rounded-full transition-colors",
                animations ? "bg-primary" : "bg-muted")}>
              <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                animations ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
          {animations && (
            <div className="rounded-lg border border-border px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Vitesse</p>
                <span className="text-xs font-mono text-muted-foreground">{animationSpeed} ms</span>
              </div>
              <input type="range" min={100} max={600} step={50} value={animationSpeed}
                onChange={(e) => handleAnimationSpeedChange(parseInt(e.target.value))}
                className="w-full accent-primary" />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Rapide</span><span>Normal</span><span>Lent</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Opacité de la sidebar */}
      <section>
        <h3 className="mb-1 text-sm font-medium text-foreground">Opacité de la sidebar</h3>
        <p className="mb-3 text-xs text-muted-foreground">60 % (translucide) → 100 % (opaque)</p>
        <div className="flex items-center gap-4">
          <input type="range" min={60} max={100} step={1} value={sidebarOpacity}
            onChange={(e) => handleSidebarOpacityChange(parseInt(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="w-12 text-right text-sm font-mono text-foreground">{sidebarOpacity} %</span>
        </div>
      </section>

      {/* Arrière-plan */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Arrière-plan personnalisé</h3>
        <div className="space-y-3">
          <input type="text" value={typeof bgUrl === "string" && bgUrl.startsWith("data:") ? "" : bgUrl}
            onChange={(e) => handleBgUrlChange(e.target.value)}
            placeholder="https://exemple.com/wallpaper.jpg"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex items-center gap-3">
            <input ref={bgFileInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" id="bg-upload" />
            <label htmlFor="bg-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <Upload className="h-3.5 w-3.5" />
              Choisir un fichier
            </label>
            {bgUrl && (
              <button onClick={handleBgReset}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50">
                <RotateCcw className="h-3.5 w-3.5" />
                Retirer
              </button>
            )}
          </div>
          {bgUrl && (
            <>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Opacité de l&apos;overlay</span><span>{bgOpacity} %</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={bgOpacity}
                  onChange={(e) => handleBgOpacityChange(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Flou</span><span>{bgBlur} px</span>
                </div>
                <input type="range" min={0} max={20} step={1} value={bgBlur}
                  onChange={(e) => handleBgBlurChange(parseInt(e.target.value))}
                  className="w-full accent-primary" />
              </div>
            </>
          )}
        </div>
      </section>

      {/* Logo */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Logo du dashboard</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-primary">H</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
            <label htmlFor="logo-upload"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent">
              <Upload className="h-3.5 w-3.5" />
              Choisir une image
            </label>
            {logoUrl && (
              <button onClick={handleLogoReset}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50">
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">PNG, SVG ou JPG recommandé. Stocké localement.</p>
      </section>
    </div>
  );
}
