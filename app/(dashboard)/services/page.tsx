"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Server } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface Service {
  id: string;
  name: string;
  url: string;
}

const STORAGE_KEY = "homelab-launcher-services";

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f97316",
  "#06b6d4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#6366f1";
}

function ServiceLogo({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  })();
  const faviconUrl = origin ? `${origin}/favicon.ico` : null;
  const letter = name.charAt(0).toUpperCase();
  const color = getAvatarColor(name);

  if (!faviconUrl || failed) {
    return (
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white"
        style={{ background: color }}
      >
        {letter}
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background">
      <img
        src={faviconUrl}
        alt={name}
        className="h-10 w-10 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setServices(JSON.parse(saved) as Service[]);
    } catch {}
  }, []);

  const persist = useCallback((updated: Service[]) => {
    setServices(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  function handleAdd() {
    const trimName = name.trim();
    const trimUrl = url.trim();
    if (!trimName || !trimUrl) return;
    const normalized = trimUrl.startsWith("http") ? trimUrl : `http://${trimUrl}`;
    persist([
      ...services,
      { id: crypto.randomUUID(), name: trimName, url: normalized },
    ]);
    setName("");
    setUrl("");
    setIsDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Accès rapide à vos services homelab
          </p>
        </div>

        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
              <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
                Ajouter un service
              </Dialog.Title>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nom
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Proxmox, Jellyfin, pfSense…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    URL
                  </label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://192.168.1.100:8006"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleAdd}
                    disabled={!name.trim() || !url.trim()}
                    className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Ajouter
                  </button>
                  <Dialog.Close asChild>
                    <button className="flex-1 rounded-md border border-border py-2 text-sm hover:bg-accent">
                      Annuler
                    </button>
                  </Dialog.Close>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Grille */}
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-muted-foreground">
          <Server className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucun service configuré</p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter un service
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {services.map((service) => (
            <div key={service.id} className="group relative">
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <ServiceLogo url={service.url} name={service.name} />
                <span className="w-full truncate text-center text-xs font-medium text-foreground">
                  {service.name}
                </span>
              </a>
              <button
                onClick={() =>
                  persist(services.filter((s) => s.id !== service.id))
                }
                className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
