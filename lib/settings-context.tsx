"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { saveSetting } from "./settings-client";

interface SettingsContextValue {
  /** Données brutes clé→valeur JSON stringifiée. */
  settings: Record<string, string>;
  /** True une fois que /api/settings/all a répondu. */
  loaded: boolean;
  /** Met à jour la valeur en mémoire ET déclenche une sauvegarde debounced. */
  updateSetting: (key: string, value: string) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: {},
  loaded: false,
  updateSetting: () => {},
});

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  // Hydratation initiale : une seule requête pour toutes les clés
  useEffect(() => {
    fetch("/api/settings/all")
      .then((r) => r.json())
      .then((data: { settings?: Record<string, string> }) => {
        setSettings(data.settings ?? {});
      })
      .catch((err) => {
        console.warn("[settings] hydration failed:", err);
      })
      .finally(() => setLoaded(true));
  }, []);

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    saveSetting(key, value);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loaded, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
