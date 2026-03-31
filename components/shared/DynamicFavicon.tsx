"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/lib/settings-context";
import { safeJson } from "@/lib/settings-client";

/** Met à jour le favicon <link rel="icon"> dynamiquement depuis les settings. */
export function DynamicFavicon() {
  const { settings } = useAppSettings();

  useEffect(() => {
    function setFavicon(url: string | null) {
      if (!url) return;
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    }

    const a = safeJson<Record<string, unknown>>(settings["appearance"], {});
    setFavicon((a["logo"] as string | null | undefined) ?? null);
  }, [settings]);

  useEffect(() => {
    function onLogoChange(e: Event) {
      const url = (e as CustomEvent<string | null>).detail;
      if (!url) return;
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    }
    window.addEventListener("homelab:logo-change", onLogoChange);
    return () => window.removeEventListener("homelab:logo-change", onLogoChange);
  }, []);

  return null;
}
