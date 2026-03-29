"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun, Check, Upload, RotateCcw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";
type Density = "compact" | "normal" | "spacious";

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

function applyBackground(url: string | null, opacity: number) {
  const body = document.body;
  if (url) {
    body.style.backgroundImage = `url(${url})`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundAttachment = "fixed";
    document.documentElement.style.setProperty("--bg-overlay-opacity", String(opacity / 100));
  } else {
    body.style.backgroundImage = "";
    document.documentElement.style.setProperty("--bg-overlay-opacity", "0");
  }
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedAccent = localStorage.getItem("accent");
    const storedFont = localStorage.getItem("app-font");
    const storedLogo = localStorage.getItem("app-logo");
    const storedRadius = localStorage.getItem("app-radius");
    const storedDensity = localStorage.getItem("app-density") as Density | null;
    const storedSidebarOpacity = localStorage.getItem("app-sidebar-opacity");
    const storedBgUrl = localStorage.getItem("app-bg-url");
    const storedBgOpacity = localStorage.getItem("app-bg-opacity");

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
    if (storedBgUrl) { setBgUrl(storedBgUrl); }
    if (storedBgOpacity) { setBgOpacity(parseInt(storedBgOpacity)); }
    if (storedBgUrl) applyBackground(storedBgUrl, storedBgOpacity ? parseInt(storedBgOpacity) : 60);
  }, []);

  function handleThemeChange(t: Theme) {
    setTheme(t); localStorage.setItem("theme", t); applyTheme(t);
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
      applyBackground(url.trim(), bgOpacity);
    } else {
      localStorage.removeItem("app-bg-url");
      applyBackground(null, bgOpacity);
    }
  }

  function handleBgOpacityChange(value: number) {
    setBgOpacity(value); localStorage.setItem("app-bg-opacity", String(value));
    if (bgUrl.trim()) applyBackground(bgUrl.trim(), value);
  }

  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgUrl(dataUrl);
      localStorage.setItem("app-bg-url", dataUrl);
      applyBackground(dataUrl, bgOpacity);
    };
    reader.readAsDataURL(file);
  }

  function handleBgReset() {
    setBgUrl("");
    localStorage.removeItem("app-bg-url");
    applyBackground(null, bgOpacity);
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
    setLogoUrl(null);
    localStorage.removeItem("app-logo");
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.dispatchEvent(new CustomEvent("homelab:logo-change", { detail: null }));
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
                theme === value ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50")}>
              <div className={cn("relative h-16 w-full overflow-hidden rounded-md border border-border",
                value === "light" ? "bg-white" : value === "dark" ? "bg-zinc-900" : "bg-gradient-to-r from-zinc-900 to-white")}>
                <div className={cn("absolute left-2 top-2 h-2 w-8 rounded", value === "light" ? "bg-zinc-200" : "bg-zinc-700")} />
                <div className={cn("absolute left-2 top-6 h-1.5 w-12 rounded", value === "light" ? "bg-zinc-100" : "bg-zinc-800")} />
                <div className={cn("absolute bottom-2 right-2 h-4 w-10 rounded", value === "light" ? "bg-blue-500/80" : "bg-cyan-600/80")} />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
                {theme === value && <Check className="h-3 w-3 text-primary" />}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Couleur d'accent */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">Couleur d&apos;accent</h3>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((color) => (
            <button key={color.value} onClick={() => handleAccentChange(color.value)} title={color.label}
              className={cn("h-9 w-9 rounded-full transition-transform hover:scale-110", color.class,
                accent === color.value && "ring-2 ring-offset-2 ring-offset-background ring-foreground/30")}
              aria-label={color.label}>
              {accent === color.value && <Check className="mx-auto h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Préférence sauvegardée localement</p>
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
        <p className="mb-3 text-xs text-muted-foreground">Cards et widgets : 0 px (carré) → 16 px (arrondi)</p>
        <div className="flex items-center gap-4">
          <input type="range" min={0} max={16} step={1} value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="flex-1 accent-primary" />
          <span className="w-12 text-right text-sm font-mono text-foreground">{radius} px</span>
        </div>
        <div className="mt-3 flex gap-3">
          {[0, 4, 8, 12, 16].map((v) => (
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
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Opacité de l&apos;overlay : {bgOpacity} %</p>
              <input type="range" min={0} max={100} step={5} value={bgOpacity}
                onChange={(e) => handleBgOpacityChange(parseInt(e.target.value))}
                className="w-full accent-primary" />
            </div>
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
