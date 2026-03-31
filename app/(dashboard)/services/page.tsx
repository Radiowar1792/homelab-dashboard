/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GridLayout, verticalCompactor } from "react-grid-layout";
import type { Layout, LayoutItem } from "react-grid-layout";
import {
  Plus, X, Server, Search, ChevronDown, Pencil, FolderPlus,
  Folder, Move, Check, GripVertical,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  siGrafana, siHomeassistant, siJellyfin, siNextcloud, siGitea,
  siSyncthing, siNginx, siN8n, siProxmox, siPortainer,
  siDocker, siPlex, siGitlab, siAdguard, siUptimekuma,
  siImmich, siVaultwarden, siAuthentik, siPaperlessngx,
  siSonarr, siRadarr, siBitwarden, siKeycloak, siNetdata,
  siPrometheus, siMinio, siSeafile, siOnlyoffice, siMatrix,
  siElement, siJitsi, siBookstack, siOutline, siNginxproxymanager,
} from "simple-icons";
import { cn } from "@/lib/utils";
import { saveSetting, safeJson } from "@/lib/settings-client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimpleIconDef { title: string; hex: string; svg: string }

const GALLERY: Array<{ name: string; icon: SimpleIconDef }> = [
  { name: "Proxmox", icon: siProxmox }, { name: "Jellyfin", icon: siJellyfin },
  { name: "Nextcloud", icon: siNextcloud }, { name: "Grafana", icon: siGrafana },
  { name: "Home Assistant", icon: siHomeassistant }, { name: "Portainer", icon: siPortainer },
  { name: "Gitea", icon: siGitea }, { name: "n8n", icon: siN8n },
  { name: "Syncthing", icon: siSyncthing }, { name: "Nginx", icon: siNginx },
  { name: "AdGuard", icon: siAdguard }, { name: "Uptime Kuma", icon: siUptimekuma },
  { name: "Docker", icon: siDocker }, { name: "Plex", icon: siPlex },
  { name: "GitLab", icon: siGitlab }, { name: "Vaultwarden", icon: siVaultwarden },
  { name: "Immich", icon: siImmich }, { name: "Paperless-ngx", icon: siPaperlessngx },
  { name: "Authentik", icon: siAuthentik },
  { name: "Sonarr", icon: siSonarr }, { name: "Radarr", icon: siRadarr },
  { name: "Bitwarden", icon: siBitwarden }, { name: "Keycloak", icon: siKeycloak },
  { name: "Netdata", icon: siNetdata }, { name: "Prometheus", icon: siPrometheus },
  { name: "MinIO", icon: siMinio }, { name: "Seafile", icon: siSeafile },
  { name: "OnlyOffice", icon: siOnlyoffice }, { name: "Matrix", icon: siMatrix },
  { name: "Element", icon: siElement }, { name: "Jitsi", icon: siJitsi },
  { name: "BookStack", icon: siBookstack }, { name: "Outline", icon: siOutline },
  { name: "Nginx Proxy Manager", icon: siNginxproxymanager },
];

interface Service {
  id: string;
  name: string;
  url: string;
  iconTitle?: string | undefined;
  groupId?: string | undefined;
  customLogo?: string | undefined;
}

interface Group {
  id: string;
  name: string;
}

// ─── Grid config ──────────────────────────────────────────────────────────────

const COLS = 12;
const ROW_HEIGHT = 80;
const SERVICES_API_KEY = "services";
const LAYOUT_API_KEY = "services_layout";

const DEFAULT_SVC = { w: 2, h: 2 };
const DEFAULT_GRP = { w: 6, h: 3 };

// ─── Layout helpers ───────────────────────────────────────────────────────────

function buildDefaultLayout(itemIds: string[]): LayoutItem[] {
  let x = 0, y = 0, rowMaxH = 0;
  return itemIds.map((id) => {
    const size = id.startsWith("grp-") ? DEFAULT_GRP : DEFAULT_SVC;
    if (x + size.w > COLS) { x = 0; y += rowMaxH; rowMaxH = 0; }
    const item: LayoutItem = { i: id, x, y, w: size.w, h: size.h };
    x += size.w; rowMaxH = Math.max(rowMaxH, size.h);
    return item;
  });
}

function mergeLayoutWithSaved(saved: LayoutItem[], itemIds: string[]): LayoutItem[] {
  const savedMap = new Map(saved.map((l) => [l.i, l]));
  const validIdSet = new Set(itemIds);
  const filteredSaved = saved.filter((l) => validIdSet.has(l.i));
  const unsaved = itemIds.filter((id) => !savedMap.has(id));
  if (unsaved.length === 0) return filteredSaved;
  const maxY = filteredSaved.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  let x = 0;
  const extra = unsaved.map((id) => {
    const size = id.startsWith("grp-") ? DEFAULT_GRP : DEFAULT_SVC;
    if (x + size.w > COLS) x = 0;
    const item: LayoutItem = { i: id, x, y: maxY, w: size.w, h: size.h };
    x += size.w;
    return item;
  });
  return [...filteredSaved, ...extra];
}

function mergeLayout(current: LayoutItem[], itemIds: string[]): LayoutItem[] {
  const existingIds = new Set(current.map((l) => l.i));
  const validIds = new Set(itemIds);
  const allValid = current.every((l) => validIds.has(l.i));
  const noNew = itemIds.every((id) => existingIds.has(id));
  if (allValid && noNew) return current;
  const filtered = current.filter((l) => validIds.has(l.i));
  const newIds = itemIds.filter((id) => !existingIds.has(id));
  if (newIds.length === 0) return filtered;
  const maxY = filtered.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  let x = 0;
  const extra = newIds.map((id) => {
    const size = id.startsWith("grp-") ? DEFAULT_GRP : DEFAULT_SVC;
    if (x + size.w > COLS) x = 0;
    const item: LayoutItem = { i: id, x, y: maxY, w: size.w, h: size.h };
    x += size.w;
    return item;
  });
  return [...filtered, ...extra];
}

function saveLayout(items: LayoutItem[]) {
  saveSetting(LAYOUT_API_KEY, JSON.stringify(items));
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
  "#f97316", "#06b6d4",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? "#6366f1";
}

// ─── Icon components ──────────────────────────────────────────────────────────

function GalleryIcon({ icon, size = 40 }: { icon: SimpleIconDef; size?: number }) {
  const colored = icon.svg.replace("<svg ", `<svg fill="#${icon.hex}" `);
  return (
    <div style={{ width: size, height: size }} className="[&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: colored }} />
  );
}

function ServiceLogo({ service, compact = false }: { service: Service; compact?: boolean }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const iconSize = compact ? 24 : 32;
  const containerCls = compact ? "h-9 w-9" : "h-11 w-11";

  // Custom logo (base64) takes priority
  if (service.customLogo) {
    return (
      <div className={`flex ${containerCls} items-center justify-center rounded-lg bg-background p-1`}>
        <img src={service.customLogo} alt={service.name} className="h-full w-full object-contain" />
      </div>
    );
  }

  const galleryEntry = service.iconTitle ? GALLERY.find((g) => g.name === service.iconTitle) : null;
  if (galleryEntry) {
    return (
      <div className={`flex ${containerCls} items-center justify-center rounded-lg bg-background p-1.5`}>
        <GalleryIcon icon={galleryEntry.icon} size={iconSize} />
      </div>
    );
  }
  const origin = (() => { try { return new URL(service.url).origin; } catch { return null; } })();
  const faviconUrl = origin ? `${origin}/favicon.ico` : null;
  if (!faviconUrl || faviconFailed) {
    return (
      <div className={`flex ${containerCls} items-center justify-center rounded-lg text-sm font-bold text-white`}
        style={{ background: getAvatarColor(service.name) }}>
        {service.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className={`flex ${containerCls} items-center justify-center rounded-lg bg-background`}>
      <img src={faviconUrl} alt={service.name} className="h-6 w-6 object-contain"
        onError={() => setFaviconFailed(true)} />
    </div>
  );
}

// ─── Logo picker ──────────────────────────────────────────────────────────────

function LogoPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [showGallery, setShowGallery] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const filtered = gallerySearch.trim()
    ? GALLERY.filter((g) => g.name.toLowerCase().includes(gallerySearch.toLowerCase()))
    : GALLERY;
  const selected = value ? GALLERY.find((g) => g.name === value) : null;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">Logo</label>
      <button type="button" onClick={() => setShowGallery((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary/50">
        <span className="flex items-center gap-2">
          {selected ? (
            <><GalleryIcon icon={selected.icon} size={20} /><span>{selected.name}</span></>
          ) : (
            <span className="text-muted-foreground">Favicon auto ou galerie…</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showGallery ? "rotate-180" : ""}`} />
      </button>
      {showGallery && (
        <div className="mt-2 rounded-lg border border-border bg-background p-3">
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={gallerySearch} onChange={(e) => setGallerySearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button type="button" onClick={() => { onChange(null); setShowGallery(false); }}
            className={`mb-2 w-full rounded-md px-3 py-1.5 text-left text-xs ${!value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            Favicon automatique
          </button>
          <div className="grid max-h-48 grid-cols-5 gap-1 overflow-y-auto">
            {filtered.map((entry) => (
              <button key={entry.name} type="button"
                onClick={() => { onChange(entry.name); setShowGallery(false); }}
                title={entry.name}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${value === entry.name ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}>
                <GalleryIcon icon={entry.icon} size={22} />
                <span className="w-full truncate text-center text-[9px] text-muted-foreground">{entry.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-5 py-4 text-center text-xs text-muted-foreground">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Service tile (inside group) ──────────────────────────────────────────────

function ServiceTileCompact({
  service, isEditMode, groups, onEdit, onDelete, onMoveToGroup,
}: {
  service: Service; isEditMode: boolean; groups: Group[];
  onEdit: (s: Service) => void; onDelete: (id: string) => void;
  onMoveToGroup: (serviceId: string, groupId: string | undefined) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group relative">
      <a href={service.url} target="_blank" rel="noopener noreferrer"
        className={cn(
          "flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 transition-all",
          !isEditMode && "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        )}>
        <ServiceLogo service={service} compact />
        <span className="w-full truncate text-center text-[10px] font-medium text-foreground">{service.name}</span>
      </a>
      {isEditMode && (
        <div className="absolute -right-1 -top-1 flex gap-0.5">
          <div className="relative">
            <button onClick={() => setShowMenu((v) => !v)}
              className="rounded-full bg-card border border-border p-0.5 text-muted-foreground shadow hover:text-primary">
              <Folder className="h-2.5 w-2.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-28 rounded-lg border border-border dialog-bg shadow-lg">
                <button onClick={() => { onMoveToGroup(service.id, undefined); setShowMenu(false); }}
                  className={cn("w-full px-3 py-1.5 text-left text-[10px] hover:bg-muted rounded-t-lg", !service.groupId && "text-primary font-medium")}>
                  Sans groupe
                </button>
                {groups.map((g) => (
                  <button key={g.id} onClick={() => { onMoveToGroup(service.id, g.id); setShowMenu(false); }}
                    className={cn("w-full px-3 py-1.5 text-left text-[10px] hover:bg-muted last:rounded-b-lg", service.groupId === g.id && "text-primary font-medium")}>
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => onEdit(service)}
            className="rounded-full bg-card border border-border p-0.5 text-muted-foreground shadow hover:text-primary">
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button onClick={() => onDelete(service.id)}
            className="rounded-full bg-destructive p-0.5 text-destructive-foreground shadow">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Service grid item ────────────────────────────────────────────────────────

function ServiceGridItem({
  service, isEditMode, groups, layoutItem, onEdit, onDelete, onMoveToGroup, onDimensionChange,
}: {
  service: Service; isEditMode: boolean; groups: Group[];
  layoutItem: LayoutItem | undefined;
  onEdit: (s: Service) => void; onDelete: (id: string) => void;
  onMoveToGroup: (serviceId: string, groupId: string | undefined) => void;
  onDimensionChange: (id: string, dim: "w" | "h", v: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const itemId = `svc-${service.id}`;

  return (
    <div className={cn(
      "relative h-full w-full overflow-hidden rounded-xl border border-border bg-card transition-all",
      isEditMode && "ring-1 ring-dashed ring-primary/50"
    )}>
      {isEditMode && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-muted/80 px-2 py-1 backdrop-blur-sm">
          <button className="drag-handle cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1">
            {layoutItem && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground"
                onMouseDown={(e) => e.stopPropagation()}>
                <span>w</span>
                <input type="number" min={1} max={COLS} value={layoutItem.w}
                  onChange={(e) => onDimensionChange(itemId, "w", parseInt(e.target.value) || 1)}
                  className="w-7 rounded border border-border bg-background px-1 py-0 text-center text-[10px] outline-none focus:ring-1 focus:ring-primary" />
                <span>h</span>
                <input type="number" min={1} max={20} value={layoutItem.h}
                  onChange={(e) => onDimensionChange(itemId, "h", parseInt(e.target.value) || 1)}
                  className="w-7 rounded border border-border bg-background px-1 py-0 text-center text-[10px] outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            <div className="relative">
              <button onClick={() => setShowMenu((v) => !v)}
                className="rounded p-0.5 text-muted-foreground hover:text-primary" title="Groupe">
                <Folder className="h-3 w-3" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-32 rounded-lg border border-border dialog-bg shadow-lg">
                  <button onClick={() => { onMoveToGroup(service.id, undefined); setShowMenu(false); }}
                    className={cn("w-full px-3 py-1.5 text-left text-xs hover:bg-muted rounded-t-lg", !service.groupId && "text-primary font-medium")}>
                    Sans groupe
                  </button>
                  {groups.map((g) => (
                    <button key={g.id} onClick={() => { onMoveToGroup(service.id, g.id); setShowMenu(false); }}
                      className={cn("w-full px-3 py-1.5 text-left text-xs hover:bg-muted last:rounded-b-lg", service.groupId === g.id && "text-primary font-medium")}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onEdit(service)}
              className="rounded p-0.5 text-muted-foreground hover:text-primary">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(service.id)}
              className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <a href={service.url} target="_blank" rel="noopener noreferrer"
        className={cn(
          "flex h-full flex-col items-center justify-center gap-2 p-3 transition-all",
          !isEditMode && "hover:bg-accent/30",
          isEditMode && "pointer-events-none pt-9"
        )}>
        <ServiceLogo service={service} />
        <span className="w-full truncate text-center text-xs font-medium text-foreground">{service.name}</span>
      </a>
    </div>
  );
}

// ─── Group grid item ──────────────────────────────────────────────────────────

function GroupGridItem({
  group, services, isEditMode, groups, layoutItem, onEdit, onDelete, onMoveToGroup,
  onRenameGroup, onDeleteGroup, onDimensionChange,
}: {
  group: Group; services: Service[]; isEditMode: boolean; groups: Group[];
  layoutItem: LayoutItem | undefined;
  onEdit: (s: Service) => void; onDelete: (id: string) => void;
  onMoveToGroup: (serviceId: string, groupId: string | undefined) => void;
  onRenameGroup: (id: string, name: string) => void; onDeleteGroup: (id: string) => void;
  onDimensionChange: (id: string, dim: "w" | "h", v: number) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemId = `grp-${group.id}`;

  useEffect(() => { if (isRenaming) inputRef.current?.focus(); }, [isRenaming]);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed) onRenameGroup(group.id, trimmed);
    else setDraftName(group.name);
    setIsRenaming(false);
  }

  return (
    <div className={cn(
      "relative h-full w-full overflow-hidden rounded-xl border border-border bg-card transition-all",
      isEditMode && "ring-1 ring-dashed ring-primary/50"
    )}>
      {isEditMode && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-muted/80 px-2 py-1 backdrop-blur-sm">
          <button className="drag-handle cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-1">
            {layoutItem && (
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground"
                onMouseDown={(e) => e.stopPropagation()}>
                <span>w</span>
                <input type="number" min={1} max={COLS} value={layoutItem.w}
                  onChange={(e) => onDimensionChange(itemId, "w", parseInt(e.target.value) || 1)}
                  className="w-7 rounded border border-border bg-background px-1 py-0 text-center text-[10px] outline-none focus:ring-1 focus:ring-primary" />
                <span>h</span>
                <input type="number" min={1} max={20} value={layoutItem.h}
                  onChange={(e) => onDimensionChange(itemId, "h", parseInt(e.target.value) || 1)}
                  className="w-7 rounded border border-border bg-background px-1 py-0 text-center text-[10px] outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            <button onClick={() => onDeleteGroup(group.id)}
              className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <div className={cn("h-full overflow-auto p-3", isEditMode && "pt-9")}>
        <div className="mb-2 flex items-center gap-1.5">
          <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />
          {isRenaming ? (
            <input ref={inputRef} value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setDraftName(group.name); setIsRenaming(false); }
              }}
              className="flex-1 rounded border border-primary bg-background px-2 py-0.5 text-xs font-semibold outline-none" />
          ) : (
            <button onClick={() => isEditMode && setIsRenaming(true)}
              className={cn("flex-1 text-left text-xs font-semibold text-foreground", isEditMode && "hover:text-primary")}>
              {group.name}
            </button>
          )}
        </div>
        {services.length === 0 ? (
          <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            {isEditMode ? "Déplacez des services ici" : "Vide"}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {services.map((s) => (
              <ServiceTileCompact key={s.id} service={s} isEditMode={isEditMode}
                groups={groups} onEdit={onEdit} onDelete={onDelete} onMoveToGroup={onMoveToGroup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const [resizingItem, setResizingItem] = useState<{ id: string; w: number; h: number } | null>(null);
  const initializedRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIcon, setFormIcon] = useState<string | null>(null);
  const [formCustomLogo, setFormCustomLogo] = useState<string | null>(null);

  // Charge services + groupes depuis l'API en une seule passe
  useEffect(() => {
    fetch(`/api/settings?key=${SERVICES_API_KEY}`)
      .then((r) => r.json())
      .then((data: { value: string | null }) => {
        const payload = safeJson<{ services: Service[]; groups: Group[] }>(
          data.value,
          { services: [], groups: [] }
        );
        setServices(payload.services ?? []);
        setGroups(payload.groups ?? []);
      })
      .catch(() => {})
      .finally(() => setDataLoaded(true));
  }, []);

  // Container width observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const persistServices = useCallback((updated: Service[], currentGroups?: Group[]) => {
    setServices(updated);
    const payload = { services: updated, groups: currentGroups ?? groups };
    saveSetting(SERVICES_API_KEY, JSON.stringify(payload));
  }, [groups]);

  const persistGroups = useCallback((updated: Group[], currentServices?: Service[]) => {
    setGroups(updated);
    const payload = { services: currentServices ?? services, groups: updated };
    saveSetting(SERVICES_API_KEY, JSON.stringify(payload));
  }, [services]);

  // All grid item IDs: ungrouped services + groups
  const allItemIds = useMemo(() => {
    const svcIds = services.filter((s) => !s.groupId).map((s) => `svc-${s.id}`);
    const grpIds = groups.map((g) => `grp-${g.id}`);
    return [...svcIds, ...grpIds];
  }, [services, groups]);

  const itemIdsKey = allItemIds.join(",");

  // Charge le layout depuis l'API une fois les données chargées
  useEffect(() => {
    if (!dataLoaded || initializedRef.current) return;
    fetch(`/api/settings?key=${LAYOUT_API_KEY}`)
      .then((r) => r.json())
      .then((data: { value: string | null }) => {
        const saved = safeJson<LayoutItem[]>(data.value, []);
        const loaded = allItemIds.length > 0
          ? (saved.length > 0 ? mergeLayoutWithSaved(saved, allItemIds) : buildDefaultLayout(allItemIds))
          : [];
        setLayout(loaded);
      })
      .catch(() => setLayout(allItemIds.length > 0 ? buildDefaultLayout(allItemIds) : []))
      .finally(() => {
        initializedRef.current = true;
        setLayoutReady(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  // Sync layout quand la liste d'items change (ajout/suppression)
  useEffect(() => {
    if (!dataLoaded || !initializedRef.current) return;
    setLayout((prev) => {
      const merged = mergeLayout(prev, allItemIds);
      saveLayout(merged);
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemIdsKey]);

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    if (!layoutReady) return;
    const mutable = [...newLayout] as LayoutItem[];
    setLayout(mutable);
    saveLayout(mutable);
  }, [layoutReady]);

  const handleResizeStart = useCallback((_layout: Layout, item: LayoutItem | null) => {
    if (!item) return;
    setResizingItem({ id: item.i, w: item.w, h: item.h });
  }, []);

  const handleResize = useCallback((_layout: Layout, item: LayoutItem | null) => {
    if (!item) return;
    setResizingItem({ id: item.i, w: item.w, h: item.h });
  }, []);

  const handleResizeStop = useCallback((newLayout: Layout) => {
    setResizingItem(null);
    const mutable = [...newLayout] as LayoutItem[];
    setLayout(mutable);
    saveLayout(mutable);
  }, []);

  const handleDimensionChange = useCallback((id: string, dim: "w" | "h", value: number) => {
    setLayout((prev) => {
      const updated = prev.map((item) =>
        item.i === id
          ? { ...item, [dim]: Math.max(1, Math.min(dim === "w" ? COLS : 20, value)) }
          : item
      );
      saveLayout(updated);
      return updated;
    });
  }, []);

  const gridConfig = useMemo(() => ({
    cols: COLS,
    rowHeight: ROW_HEIGHT,
    margin: [16, 16] as [number, number],
    containerPadding: [0, 0] as [number, number],
  }), []);

  const dragConfig = useMemo(() => ({
    enabled: isEditMode,
    handle: ".drag-handle",
    threshold: 8,
    bounded: false,
  }), [isEditMode]);

  const resizeConfig = useMemo(() => ({
    enabled: isEditMode,
    handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"] as Array<"s" | "w" | "e" | "n" | "sw" | "nw" | "se" | "ne">,
  }), [isEditMode]);

  // Dialog helpers
  function openAddDialog() {
    setEditingService(null); setFormName(""); setFormUrl(""); setFormIcon(null); setFormCustomLogo(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(service: Service) {
    setEditingService(service);
    setFormName(service.name); setFormUrl(service.url);
    setFormIcon(service.iconTitle ?? null);
    setFormCustomLogo(service.customLogo ?? null);
    setIsDialogOpen(true);
  }

  function handleSave() {
    const trimName = formName.trim();
    const trimUrl = formUrl.trim();
    if (!trimName || !trimUrl) return;
    const normalized = trimUrl.startsWith("http") ? trimUrl : `http://${trimUrl}`;
    if (editingService) {
      persistServices(services.map((s) =>
        s.id === editingService.id
          ? { ...s, name: trimName, url: normalized, ...(formIcon ? { iconTitle: formIcon } : { iconTitle: undefined }), customLogo: formCustomLogo ?? undefined }
          : s
      ));
    } else {
      const newId = crypto.randomUUID();
      const itemId = `svc-${newId}`;
      persistServices([
        ...services,
        { id: newId, name: trimName, url: normalized, ...(formIcon ? { iconTitle: formIcon } : {}), ...(formCustomLogo ? { customLogo: formCustomLogo } : {}) },
      ]);
      // Immediately insert layout item to avoid position jump on first render
      setLayout((prev) => {
        const maxY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        const newItem: LayoutItem = { i: itemId, x: 0, y: maxY, w: DEFAULT_SVC.w, h: DEFAULT_SVC.h };
        const next = [...prev, newItem];
        saveLayout(next);
        return next;
      });
    }
    setIsDialogOpen(false);
  }

  function handleDeleteService(id: string) {
    persistServices(services.filter((s) => s.id !== id));
  }

  function handleMoveToGroup(serviceId: string, groupId: string | undefined) {
    persistServices(services.map((s) => s.id === serviceId ? { ...s, groupId } : s));
  }

  function createGroup() {
    const newId = crypto.randomUUID();
    const itemId = `grp-${newId}`;
    persistGroups([...groups, { id: newId, name: "Nouveau groupe" }]);
    // Immediately insert layout item to avoid position jump on first render
    setLayout((prev) => {
      const maxY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      const newItem: LayoutItem = { i: itemId, x: 0, y: maxY, w: DEFAULT_GRP.w, h: DEFAULT_GRP.h };
      const next = [...prev, newItem];
      saveLayout(next);
      return next;
    });
  }

  function renameGroup(id: string, name: string) {
    persistGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
  }

  function deleteGroup(id: string) {
    persistServices(services.map((s) => (s.groupId === id ? { ...s, groupId: undefined } : s)));
    persistGroups(groups.filter((g) => g.id !== id));
  }

  const ungroupedServices = services.filter((s) => !s.groupId);
  const isEmpty = services.length === 0 && groups.length === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">Accès rapide à vos services homelab</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <button onClick={createGroup}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent">
                <FolderPlus className="h-4 w-4" />
                Groupe
              </button>
              <button onClick={openAddDialog}
                className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </>
          )}
          <button onClick={() => setIsEditMode((e) => !e)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isEditMode
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border border-border bg-card text-foreground hover:bg-accent"
            )}>
            {isEditMode ? (
              <><Check className="h-4 w-4" />Verrouiller</>
            ) : (
              <><Pencil className="h-4 w-4" />Modifier</>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={containerRef}>
        {!dataLoaded || !layoutReady ? (
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-muted-foreground">
            <Server className="h-10 w-10 opacity-30" />
            <p className="text-sm">Aucun service configuré</p>
            <button onClick={() => { setIsEditMode(true); openAddDialog(); }}
              className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Ajouter un service
            </button>
          </div>
        ) : (
          <GridLayout
            layout={layout}
            width={containerWidth}
            gridConfig={gridConfig}
            dragConfig={dragConfig}
            resizeConfig={resizeConfig}
            compactor={verticalCompactor}
            onLayoutChange={handleLayoutChange}
            onResizeStart={handleResizeStart}
            onResize={handleResize}
            onResizeStop={handleResizeStop}
          >
            {ungroupedServices.map((service) => {
              const itemId = `svc-${service.id}`;
              const layoutItem = layout.find((l) => l.i === itemId);
              return (
                <div key={itemId} className="overflow-hidden rounded-xl">
                  <ServiceGridItem
                    service={service}
                    isEditMode={isEditMode}
                    groups={groups}
                    layoutItem={layoutItem}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteService}
                    onMoveToGroup={handleMoveToGroup}
                    onDimensionChange={handleDimensionChange}
                  />
                  {resizingItem?.id === itemId && (
                    <div className="pointer-events-none absolute bottom-7 right-2 z-20 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                      <Move className="h-3 w-3" />
                      {resizingItem.w} × {resizingItem.h}
                    </div>
                  )}
                </div>
              );
            })}
            {groups.map((group) => {
              const itemId = `grp-${group.id}`;
              const layoutItem = layout.find((l) => l.i === itemId);
              return (
                <div key={itemId} className="overflow-hidden rounded-xl">
                  <GroupGridItem
                    group={group}
                    services={services.filter((s) => s.groupId === group.id)}
                    isEditMode={isEditMode}
                    groups={groups}
                    layoutItem={layoutItem}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteService}
                    onMoveToGroup={handleMoveToGroup}
                    onRenameGroup={renameGroup}
                    onDeleteGroup={deleteGroup}
                    onDimensionChange={handleDimensionChange}
                  />
                  {resizingItem?.id === itemId && (
                    <div className="pointer-events-none absolute bottom-7 right-2 z-20 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
                      <Move className="h-3 w-3" />
                      {resizingItem.w} × {resizingItem.h}
                    </div>
                  )}
                </div>
              );
            })}
          </GridLayout>
        )}
      </div>

      {/* Add / Edit service dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border dialog-bg p-6 shadow-xl">
            <Dialog.Title className="mb-4 text-base font-semibold text-foreground">
              {editingService ? "Modifier le service" : "Ajouter un service"}
            </Dialog.Title>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom</label>
                <input autoFocus value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="Proxmox, Jellyfin, pfSense…"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">URL</label>
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="http://192.168.1.100:8006"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()} />
              </div>
              <LogoPicker value={formIcon} onChange={(v) => { setFormIcon(v); if (v) setFormCustomLogo(null); }} />
              {/* Custom logo upload */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Logo personnalisé (PNG, SVG, JPG, WebP — max 500 ko)</label>
                <div className="flex items-center gap-2">
                  {formCustomLogo && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background p-1">
                      <img src={formCustomLogo} alt="preview" className="h-full w-full object-contain" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer rounded-md border border-dashed border-border bg-background px-3 py-2 text-center text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">
                    {formCustomLogo ? "Changer le logo…" : "Importer un logo…"}
                    <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 500 * 1024) { alert("Fichier trop grand (max 500 ko)"); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setFormCustomLogo(result);
                          setFormIcon(null);
                        };
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                  {formCustomLogo && (
                    <button type="button" onClick={() => setFormCustomLogo(null)}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handleSave} disabled={!formName.trim() || !formUrl.trim()}
                  className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {editingService ? "Enregistrer" : "Ajouter"}
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
  );
}
