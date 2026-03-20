"use client";

import { useEffect } from "react";

/** Met à jour le favicon <link rel="icon"> dynamiquement depuis localStorage. */
export function DynamicFavicon() {
  useEffect(() => {
    function setFavicon(url: string | null) {
      if (!url) return;
      // Cherche ou crée l'élément <link rel="icon">
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    }

    // Appliquer au montage
    setFavicon(localStorage.getItem("app-logo"));

    // Écouter les changements en temps réel
    function onLogoChange(e: Event) {
      setFavicon((e as CustomEvent<string | null>).detail);
    }
    window.addEventListener("homelab:logo-change", onLogoChange);
    return () => window.removeEventListener("homelab:logo-change", onLogoChange);
  }, []);

  return null;
}
