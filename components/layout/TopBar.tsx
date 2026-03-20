"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Bell, Download } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/services": "Status des Services",
  "/rss": "Flux RSS",
  "/llm": "LLM Chat",
  "/settings": "Paramètres",
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function TopBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  const title = pageTitles[pathname] ?? "Dashboard";

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detect iOS/Safari
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    setIsIos(ios);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }

  const showInstallBtn = installPrompt !== null || isIos;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        {/* PWA Install */}
        {showInstallBtn && (
          <div className="relative">
            <button
              onClick={isIos ? () => setShowIosTip((v) => !v) : () => void handleInstall()}
              className="flex h-8 items-center gap-1.5 rounded-md border border-primary/40 px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
              aria-label="Installer l'application"
            >
              <Download className="h-3.5 w-3.5" />
              Installer
            </button>
            {isIos && showIosTip && (
              <div className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
                <p className="font-medium text-foreground mb-1">Installer sur iOS</p>
                <p>Appuyez sur le bouton <strong>Partager</strong> ⬆ dans Safari, puis sélectionnez <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong>.</p>
                <button
                  onClick={() => setShowIosTip(false)}
                  className="mt-2 text-primary hover:underline"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notifications — placeholder */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Toggle thème */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Basculer le thème"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}
