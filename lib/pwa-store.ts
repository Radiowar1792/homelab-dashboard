"use client";

/**
 * Store minimaliste pour l'événement beforeinstallprompt.
 * Utilise un module-level singleton (pas de zustand/context supplémentaire).
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let _deferredPrompt: InstallPromptEvent | null = null;
const _listeners = new Set<(e: InstallPromptEvent | null) => void>();

export function getInstallPrompt(): InstallPromptEvent | null {
  return _deferredPrompt;
}

export function setInstallPrompt(e: InstallPromptEvent | null) {
  _deferredPrompt = e;
  _listeners.forEach((fn) => fn(e));
}

export function subscribeInstallPrompt(
  fn: (e: InstallPromptEvent | null) => void
): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export type { InstallPromptEvent };
