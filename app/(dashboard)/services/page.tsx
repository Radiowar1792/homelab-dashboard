/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Server, Search, ChevronDown, Pencil, FolderPlus, Folder } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  siGrafana, siHomeassistant, siJellyfin, siNextcloud, siGitea,
  siSyncthing, siNginx, siN8n, siProxmox, siPortainer,
  siDocker, siPlex, siGitlab, siAdguard, siUptimekuma,
  siImmich, siVaultwarden, siAuthentik, siPaperlessngx,
} from "simple-icons";

// ─── Types ───────────────────────────────────────────────────────────────────

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
];

interface Service {
  id: string;
  name: string;
  url: string;
  iconTitle?: string | undefined;
  groupId?: string | undefined;
}

interface Group {
  id: string;
  name: string;
}

const SERVICES_KEY = "homelab-launcher-services";
const GROUPS_KEY = "homelab-launcher-groups";

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function GalleryIcon({ icon, size = 40 }: { icon: SimpleIconDef; size?: number }) {
  const colored = icon.svg.replace("<svg ", `<svg fill="#${icon.hex}" `);
  return (
    <div style={{ width: size, height: size }} className="[&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: colored }} />
  );
}

function ServiceLogo({ service }: { service: Service }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const galleryEntry = service.iconTitle ? GALLERY.find((g) => g.name === service.iconTitle) : null;
  if (galleryEntry) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background p-2">
        <GalleryIcon icon={galleryEntry.icon} size={40} />
      </div>
    );
  }
  const origin = (() => { try { return new URL(service.url).origin; } catch { return null; } })();
  const faviconUrl = origin ? `${origin}/favicon.ico` : null;
  if (!faviconUrl || faviconFailed) {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white"
        style={{ background: getAvatarColor(service.name) }}>
        {service.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background">
      <img src={faviconUrl} alt={service.name} className="h-10 w-10 object-contain"
        onError={() => setFaviconFailed(true)} />
    </div>
  );
}

// Small version used inside groups
function ServiceLogoSmall({ service }: { service: Service }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const galleryEntry = service.iconTitle ? GALLERY.find((g) => g.name === service.iconTitle) : null;
  if (galleryEntry) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background p-1.5">
        <GalleryIcon icon={galleryEntry.icon} size={28} />
      </div>
    );
  }
  const origin = (() => { try { return new URL(service.url).origin; } catch { return null; } })();
  const faviconUrl = origin ? `${origin}/favicon.ico` : null;
  if (!faviconUrl || faviconFailed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
        style={{ background: getAvatarColor(service.name) }}>
        {service.name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
      <img src={faviconUrl} alt={service.name} className="h-7 w-7 object-contain"
        onError={() => setFaviconFailed(true)} />
    </div>
  );
}

// ─── Draggable service tile ───────────────────────────────────────────────────

function DraggableServiceTile({
  service, onEdit, onDelete, compact = false,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: service.id });

  if (compact) {
    return (
      <div ref={setNodeRef} {...attributes} {...listeners}
        className={`group relative cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}>
        <a href={service.url} target="_blank" rel="noopener noreferrer"
          onClick={(e) => isDragging && e.preventDefault()}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
          <ServiceLogoSmall service={service} />
          <span className="w-full truncate text-center text-[10px] font-medium text-foreground">{service.name}</span>
        </a>
        <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
          <button onClick={(e) => { e.preventDefault(); onEdit(service); }}
            className="rounded-full bg-card border border-border p-0.5 text-muted-foreground shadow hover:text-primary">
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button onClick={(e) => { e.preventDefault(); onDelete(service.id); }}
            className="rounded-full bg-destructive p-0.5 text-destructive-foreground shadow">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      className={`group relative cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""}`}>
      <a href={service.url} target="_blank" rel="noopener noreferrer"
        onClick={(e) => isDragging && e.preventDefault()}
        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
        <ServiceLogo service={service} />
        <span className="w-full truncate text-center text-xs font-medium text-foreground">{service.name}</span>
      </a>
      <div className="absolute -right-1.5 -top-1.5 hidden gap-1 group-hover:flex">
        <button onClick={(e) => { e.preventDefault(); onEdit(service); }}
          className="rounded-full bg-card border border-border p-0.5 text-muted-foreground shadow hover:text-primary">
          <Pencil className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.preventDefault(); onDelete(service.id); }}
          className="rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-md">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Droppable group card ─────────────────────────────────────────────────────

function DroppableGroup({
  group, services, onEdit, onDelete, onRenameGroup, onDeleteGroup,
}: {
  group: Group;
  services: Service[];
  onEdit: (s: Service) => void;
  onDelete: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
  onDeleteGroup: (id: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `group:${group.id}` });
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing) inputRef.current?.focus(); }, [isEditing]);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed) onRenameGroup(group.id, trimmed);
    else setDraftName(group.name);
    setIsEditing(false);
  }

  return (
    <div className="space-y-2">
      {/* Group header */}
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 text-primary" />
        {isEditing ? (
          <input ref={inputRef} value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setDraftName(group.name); setIsEditing(false); } }}
            className="flex-1 rounded border border-primary bg-background px-2 py-0.5 text-sm font-semibold outline-none" />
        ) : (
          <button onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm font-semibold text-foreground hover:text-primary">
            {group.name}
          </button>
        )}
        <button onClick={() => onDeleteGroup(group.id)}
          className="rounded p-0.5 text-muted-foreground hover:text-destructive" title="Supprimer le groupe">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div ref={setNodeRef}
        className={`min-h-24 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-border bg-card/50"
        }`}>
        {services.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-xs text-muted-foreground">
            Glissez des services ici
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {services.map((s) => (
              <DraggableServiceTile key={s.id} service={s} onEdit={onEdit} onDelete={onDelete} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Logo picker ──────────────────────────────────────────────────────────────

function LogoPicker({
  value, onChange,
}: { value: string | null; onChange: (v: string | null) => void }) {
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
                <GalleryIcon icon={entry.icon} size={24} />
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

// ─── Droppable ungrouped area ─────────────────────────────────────────────────

function DroppableUngrouped({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: "ungrouped" });
  return (
    <div ref={setNodeRef}
      className={`min-h-20 rounded-xl transition-colors ${isOver ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formIcon, setFormIcon] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(SERVICES_KEY);
      if (s) setServices(JSON.parse(s) as Service[]);
      const g = localStorage.getItem(GROUPS_KEY);
      if (g) setGroups(JSON.parse(g) as Group[]);
    } catch {}
  }, []);

  const persistServices = useCallback((updated: Service[]) => {
    setServices(updated);
    try { localStorage.setItem(SERVICES_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  const persistGroups = useCallback((updated: Group[]) => {
    setGroups(updated);
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(updated)); } catch {}
  }, []);

  // Dialog helpers
  function openAddDialog() {
    setEditingService(null);
    setFormName("");
    setFormUrl("");
    setFormIcon(null);
    setIsDialogOpen(true);
  }

  function openEditDialog(service: Service) {
    setEditingService(service);
    setFormName(service.name);
    setFormUrl(service.url);
    setFormIcon(service.iconTitle ?? null);
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
          ? { ...s, name: trimName, url: normalized, ...(formIcon ? { iconTitle: formIcon } : { iconTitle: undefined }) }
          : s
      ));
    } else {
      persistServices([
        ...services,
        { id: crypto.randomUUID(), name: trimName, url: normalized, ...(formIcon ? { iconTitle: formIcon } : {}) },
      ]);
    }
    setIsDialogOpen(false);
  }

  function handleDeleteService(id: string) {
    persistServices(services.filter((s) => s.id !== id));
  }

  // Groups
  function createGroup() {
    const newGroup: Group = { id: crypto.randomUUID(), name: "Nouveau groupe" };
    persistGroups([...groups, newGroup]);
  }

  function renameGroup(id: string, name: string) {
    persistGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
  }

  function deleteGroup(id: string) {
    // Move services back to ungrouped
    persistServices(services.map((s) => (s.groupId === id ? { ...s, groupId: undefined } : s)));
    persistGroups(groups.filter((g) => g.id !== id));
  }

  // Drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const serviceId = active.id as string;
    const overId = over.id as string;

    let newGroupId: string | undefined;
    if (overId === "ungrouped") {
      newGroupId = undefined;
    } else if (overId.startsWith("group:")) {
      newGroupId = overId.slice(6);
    } else {
      // Dropped on another service → move to same group
      const overService = services.find((s) => s.id === overId);
      if (!overService) return;
      newGroupId = overService.groupId;
    }

    const updated = services.map((s) =>
      s.id === serviceId ? { ...s, groupId: newGroupId } : s
    );
    persistServices(updated);
  }

  // Derived data
  const ungroupedServices = services.filter((s) => !s.groupId);
  const activeService = activeId ? services.find((s) => s.id === activeId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">Accès rapide à vos services homelab</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={createGroup}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
            <FolderPlus className="h-4 w-4" />
            Groupe
          </button>
          <button onClick={openAddDialog}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* DnD context */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Groups */}
          {groups.map((group) => (
            <DroppableGroup key={group.id} group={group}
              services={services.filter((s) => s.groupId === group.id)}
              onEdit={openEditDialog} onDelete={handleDeleteService}
              onRenameGroup={renameGroup} onDeleteGroup={deleteGroup} />
          ))}

          {/* Ungrouped services */}
          {(ungroupedServices.length > 0 || services.length === 0) && (
            <div>
              {groups.length > 0 && (
                <p className="mb-2 text-xs font-medium text-muted-foreground">Sans groupe</p>
              )}
              {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-muted-foreground">
                  <Server className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Aucun service configuré</p>
                  <button onClick={openAddDialog}
                    className="mt-1 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Ajouter un service
                  </button>
                </div>
              ) : (
                <DroppableUngrouped>
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                    {ungroupedServices.map((service) => (
                      <DraggableServiceTile key={service.id} service={service}
                        onEdit={openEditDialog} onDelete={handleDeleteService} />
                    ))}
                  </div>
                </DroppableUngrouped>
              )}
            </div>
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeService && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-primary/50 bg-card p-4 opacity-90 shadow-xl">
              <ServiceLogo service={activeService} />
              <span className="text-xs font-medium">{activeService.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add / Edit dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl">
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
              <LogoPicker value={formIcon} onChange={setFormIcon} />
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
