/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Server, Search, ChevronDown } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  siGrafana,
  siHomeassistant,
  siJellyfin,
  siNextcloud,
  siGitea,
  siSyncthing,
  siNginx,
  siN8n,
  siProxmox,
  siPortainer,
  siDocker,
  siPlex,
  siGitlab,
  siAdguard,
  siUptimekuma,
  siImmich,
  siVaultwarden,
  siAuthentik,
  siPaperlessngx,
} from "simple-icons";

interface SimpleIcon {
  title: string;
  hex: string;
  svg: string;
}

const GALLERY: Array<{ name: string; icon: SimpleIcon }> = [
  { name: "Proxmox", icon: siProxmox },
  { name: "Jellyfin", icon: siJellyfin },
  { name: "Nextcloud", icon: siNextcloud },
  { name: "Grafana", icon: siGrafana },
  { name: "Home Assistant", icon: siHomeassistant },
  { name: "Portainer", icon: siPortainer },
  { name: "Gitea", icon: siGitea },
  { name: "n8n", icon: siN8n },
  { name: "Syncthing", icon: siSyncthing },
  { name: "Nginx", icon: siNginx },
  { name: "AdGuard", icon: siAdguard },
  { name: "Uptime Kuma", icon: siUptimekuma },
  { name: "Docker", icon: siDocker },
  { name: "Plex", icon: siPlex },
  { name: "GitLab", icon: siGitlab },
  { name: "Vaultwarden", icon: siVaultwarden },
  { name: "Immich", icon: siImmich },
  { name: "Paperless-ngx", icon: siPaperlessngx },
  { name: "Authentik", icon: siAuthentik },
];

interface Service {
  id: string;
  name: string;
  url: string;
  /** simple-icons title key, e.g. "Grafana" */
  iconTitle?: string | undefined;
}

const STORAGE_KEY = "homelab-launcher-services";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
  "#f97316", "#06b6d4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#6366f1";
}

function GalleryIcon({ icon, size = 40 }: { icon: SimpleIcon; size?: number }) {
  const colored = icon.svg.replace("<svg ", `<svg fill="#${icon.hex}" `);
  return (
    <div
      style={{ width: size, height: size }}
      className="[&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: colored }}
    />
  );
}

function ServiceLogo({ service }: { service: Service }) {
  const [faviconFailed, setFaviconFailed] = useState(false);

  const galleryEntry = service.iconTitle
    ? GALLERY.find((g) => g.name === service.iconTitle)
    : null;

  if (galleryEntry) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background p-2">
        <GalleryIcon icon={galleryEntry.icon} size={40} />
      </div>
    );
  }

  const origin = (() => {
    try { return new URL(service.url).origin; } catch { return null; }
  })();
  const faviconUrl = origin ? `${origin}/favicon.ico` : null;
  const letter = service.name.charAt(0).toUpperCase();
  const color = getAvatarColor(service.name);

  if (!faviconUrl || faviconFailed) {
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
        alt={service.name}
        className="h-10 w-10 object-contain"
        onError={() => setFaviconFailed(true)}
      />
    </div>
  );
}

interface StatusState {
  online: boolean | null;
  latency: number | null;
}

function StatusBadge({ url }: { url: string }) {
  const [status, setStatus] = useState<StatusState>({ online: null, latency: null });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`/api/ping?url=${encodeURIComponent(url)}`);
      const data = (await res.json()) as { online: boolean; latency: number | null };
      setStatus({ online: data.online, latency: data.latency });
    } catch {
      setStatus({ online: false, latency: null });
    }
  }, [url]);

  useEffect(() => {
    void check();
    timerRef.current = setInterval(() => void check(), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [check]);

  if (status.online === null) {
    return <span className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-pulse" />;
  }
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${status.online ? "bg-green-500" : "bg-red-500"}`} />
      {status.online && status.latency !== null && (
        <span className="text-[10px] text-muted-foreground">{status.latency}ms</span>
      )}
    </span>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIconTitle, setSelectedIconTitle] = useState<string | null>(null);
  const [gallerySearch, setGallerySearch] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setServices(JSON.parse(saved) as Service[]);
    } catch {}
  }, []);

  const persist = useCallback((updated: Service[]) => {
    setServices(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  function resetDialog() {
    setName("");
    setUrl("");
    setSelectedIconTitle(null);
    setGallerySearch("");
    setShowGallery(false);
  }

  function handleAdd() {
    const trimName = name.trim();
    const trimUrl = url.trim();
    if (!trimName || !trimUrl) return;
    const normalized = trimUrl.startsWith("http") ? trimUrl : `http://${trimUrl}`;
    persist([
      ...services,
      {
        id: crypto.randomUUID(),
        name: trimName,
        url: normalized,
        ...(selectedIconTitle ? { iconTitle: selectedIconTitle } : {}),
      },
    ]);
    resetDialog();
    setIsDialogOpen(false);
  }

  const filteredGallery = gallerySearch.trim()
    ? GALLERY.filter((g) => g.name.toLowerCase().includes(gallerySearch.toLowerCase()))
    : GALLERY;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">Accès rapide à vos services homelab</p>
        </div>

        <Dialog.Root
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetDialog();
          }}
        >
          <Dialog.Trigger asChild>
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
              <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
                Ajouter un service
              </Dialog.Title>

              <div className="space-y-3">
                {/* Nom */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Proxmox, Jellyfin, pfSense…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">URL</label>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://192.168.1.100:8006"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>

                {/* Logo — galerie */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Logo</label>
                  <button
                    type="button"
                    onClick={() => setShowGallery((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary/50"
                  >
                    <span className="flex items-center gap-2">
                      {selectedIconTitle ? (
                        <>
                          {(() => {
                            const entry = GALLERY.find((g) => g.name === selectedIconTitle);
                            return entry ? (
                              <GalleryIcon icon={entry.icon} size={20} />
                            ) : null;
                          })()}
                          <span>{selectedIconTitle}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Favicon auto ou galerie…</span>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showGallery ? "rotate-180" : ""}`} />
                  </button>

                  {showGallery && (
                    <div className="mt-2 rounded-lg border border-border bg-background p-3">
                      {/* Recherche dans la galerie */}
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={gallerySearch}
                          onChange={(e) => setGallerySearch(e.target.value)}
                          placeholder="Rechercher un service…"
                          className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {/* Option "aucun" */}
                      <button
                        type="button"
                        onClick={() => { setSelectedIconTitle(null); setShowGallery(false); }}
                        className={`mb-2 w-full rounded-md px-3 py-1.5 text-left text-xs ${
                          !selectedIconTitle ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Favicon automatique
                      </button>
                      {/* Grille d'icônes */}
                      <div className="grid max-h-48 grid-cols-5 gap-1 overflow-y-auto">
                        {filteredGallery.map((entry) => (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() => { setSelectedIconTitle(entry.name); setShowGallery(false); }}
                            title={entry.name}
                            className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                              selectedIconTitle === entry.name
                                ? "bg-primary/10 ring-1 ring-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            <GalleryIcon icon={entry.icon} size={24} />
                            <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                              {entry.name}
                            </span>
                          </button>
                        ))}
                        {filteredGallery.length === 0 && (
                          <p className="col-span-5 py-4 text-center text-xs text-muted-foreground">
                            Aucun résultat
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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
                <ServiceLogo service={service} />
                <span className="w-full truncate text-center text-xs font-medium text-foreground">
                  {service.name}
                </span>
                <StatusBadge url={service.url} />
              </a>
              <button
                onClick={() => persist(services.filter((s) => s.id !== service.id))}
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
