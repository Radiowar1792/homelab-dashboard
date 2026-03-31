"use client";

import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppSettingsProvider } from "@/lib/settings-context";
import { setInstallPrompt, type InstallPromptEvent } from "@/lib/pwa-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enregistrement du service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Force la mise à jour si un ancien SW est détecté
          registration.update().catch(() => {});
        })
        .catch(() => {});
    }

    // Capture de l'événement d'installation PWA (Brave/Chrome)
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // Nettoyage si l'app est installée
    function onAppInstalled() {
      setInstallPrompt(null);
    }
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        {children}
        <Toaster position="bottom-right" theme="dark" richColors />
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
