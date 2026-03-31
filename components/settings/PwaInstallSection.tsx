"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2, Monitor } from "lucide-react";
import {
  getInstallPrompt,
  subscribeInstallPrompt,
  type InstallPromptEvent,
} from "@/lib/pwa-store";

export function PwaInstallSection() {
  const [installPrompt, setInstallPromptState] = useState<InstallPromptEvent | null>(
    () => getInstallPrompt()
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Détecte le mode standalone (app déjà installée)
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener("change", onChange);

    // Écoute les mises à jour du prompt
    const unsub = subscribeInstallPrompt(setInstallPromptState);

    return () => {
      mq.removeEventListener("change", onChange);
      unsub();
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setInstallPromptState(null);
      }
    } catch {
      // Ignore les erreurs (prompt déjà utilisé, etc.)
    } finally {
      setIsInstalling(false);
    }
  }

  const isPwaSupported =
    typeof window !== "undefined" && "serviceWorker" in navigator;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-foreground">Application</h2>
        <p className="text-sm text-muted-foreground">
          Installez et gérez le dashboard comme application native
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Installer le dashboard
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Installez le dashboard comme application native sur votre
              ordinateur ou mobile pour un accès rapide sans navigateur.
            </p>

            <div className="mt-4">
              {isStandalone || installed ? (
                <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  Application déjà installée
                </div>
              ) : installPrompt ? (
                <button
                  onClick={() => void handleInstall()}
                  disabled={isInstalling}
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {isInstalling ? "Installation…" : "Installer l'application"}
                </button>
              ) : isPwaSupported ? (
                <p className="text-sm text-muted-foreground">
                  Le bouton d&apos;installation apparaîtra automatiquement une fois
                  que le navigateur aura validé les critères PWA.{" "}
                  <span className="text-foreground/60">
                    Assurez-vous que le site est servi en HTTPS.
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Utilisez Chrome ou Brave pour installer l&apos;application.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
