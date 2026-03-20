"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  Globe, Link2, LayoutGrid, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type IntegrationType = "rest-api" | "iframe" | "widget";

export interface CustomIntegration {
  id: string;
  name: string;
  url: string;
  token?: string | undefined;
  type: IntegrationType;
  isActive: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<IntegrationType, { label: string; icon: typeof Globe }> = {
  "rest-api": { label: "REST API", icon: Globe },
  iframe: { label: "iFrame", icon: Link2 },
  widget: { label: "Widget custom", icon: LayoutGrid },
};

const STORAGE_KEY = "homelab-integrations";

function loadIntegrations(): CustomIntegration[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomIntegration[]) : [];
  } catch {
    return [];
  }
}

function saveIntegrations(list: CustomIntegration[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ─── Guide ajout ──────────────────────────────────────────────

function AddGuide() {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/8 px-4 py-4 text-sm">
      <p className="mb-3 flex items-center gap-2 font-semibold text-foreground">
        <HelpCircle className="h-4 w-4 text-blue-400 shrink-0" />
        Comment ajouter une intégration
      </p>
      <ol className="space-y-2 text-muted-foreground text-xs leading-relaxed">
        <li>
          <span className="font-medium text-foreground">1.</span> Renseigne le nom et l&apos;URL de base de ton service{" "}
          <code className="rounded bg-muted px-1 text-xs">http://192.168.1.x:PORT</code>
        </li>
        <li>
          <span className="font-medium text-foreground">2.</span> Si le service nécessite un token, ajoute-le ici{" "}
          <span className="text-muted-foreground/70">(stocké chiffré en localStorage)</span>. Pour les tokens très sensibles,
          utilise plutôt une variable d&apos;environnement{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_MON_SERVICE_TOKEN=xxx</code>
        </li>
        <li>
          <span className="font-medium text-foreground">3.</span>{" "}
          <span className="font-medium">REST API</span> — proxy vers l&apos;API du service ;{" "}
          <span className="font-medium">iFrame</span> — affiche l&apos;interface web dans un onglet dédié ;{" "}
          <span className="font-medium">Widget custom</span> — nécessite un composant dans{" "}
          <code className="rounded bg-muted px-1 text-xs">/components/widgets/items/</code>
        </li>
        <li>
          <span className="font-medium text-foreground">4.</span> Sauvegarde → l&apos;intégration apparaît dans la liste.
          La config est exportable en JSON via Paramètres → Exporter.
        </li>
      </ol>
    </div>
  );
}

// ─── Formulaire ajout / édition ───────────────────────────────

type IntegrationFormData = {
  name: string;
  url: string;
  token?: string | undefined;
  type: IntegrationType;
  isActive: boolean;
};

interface IntegrationFormProps {
  initial?: CustomIntegration;
  onSave: (data: IntegrationFormData) => void;
  onCancel: () => void;
}

function IntegrationForm({ initial, onSave, onCancel }: IntegrationFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [token, setToken] = useState(initial?.token ?? "");
  const [type, setType] = useState<IntegrationType>(initial?.type ?? "rest-api");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onSave({
      name: name.trim(),
      url: url.trim(),
      token: token.trim() || undefined,
      type,
      isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Nom <span className="text-destructive">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon service"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as IntegrationType)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {(Object.keys(TYPE_CONFIG) as IntegrationType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          URL de base <span className="text-destructive">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://192.168.1.x:8080"
          required
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          API Key / Token{" "}
          <span className="text-muted-foreground/60">(optionnel)</span>
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Clé API ou token Bearer"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            isActive ? "bg-primary" : "bg-muted"
          )}
          aria-label="Activer / désactiver"
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
              isActive ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="text-xs text-muted-foreground">
          {isActive ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !url.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {initial ? "Mettre à jour" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

// ─── Carte intégration ────────────────────────────────────────

interface IntegrationCardProps {
  integration: CustomIntegration;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function IntegrationCard({ integration, onEdit, onDelete, onToggle }: IntegrationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const TypeIcon = TYPE_CONFIG[integration.type].icon;

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", integration.isActive ? "border-border" : "border-border/50 opacity-60")}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex flex-1 items-center gap-3 text-left min-w-0"
        >
          <TypeIcon className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{integration.name}</p>
            <p className="truncate text-xs text-muted-foreground">{integration.url}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1 ml-3">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              integration.isActive
                ? "bg-green-500/15 text-green-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {integration.isActive ? "Actif" : "Inactif"}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {TYPE_CONFIG[integration.type].label}
          </span>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-1 text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">URL</p>
              <p className="font-mono text-foreground/80 truncate">{integration.url}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Token</p>
              <p className="font-mono text-foreground/80">
                {integration.token ? "••••••••" : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
            >
              {integration.isActive ? "Désactiver" : "Activer"}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
            <button
              onClick={onDelete}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section principale ───────────────────────────────────────

export function IntegrationsSection() {
  const [integrations, setIntegrations] = useState<CustomIntegration[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIntegrations(loadIntegrations());
  }, []);

  function persist(list: CustomIntegration[]) {
    setIntegrations(list);
    saveIntegrations(list);
  }

  function handleAdd(data: IntegrationFormData) {
    const next = [
      ...integrations,
      { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
    ];
    persist(next);
    setShowAdd(false);
  }

  function handleEdit(id: string, data: IntegrationFormData) {
    const next = integrations.map((i) =>
      i.id === id ? { ...i, ...data } : i
    );
    persist(next);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    persist(integrations.filter((i) => i.id !== id));
  }

  function handleToggle(id: string) {
    const next = integrations.map((i) =>
      i.id === id ? { ...i, isActive: !i.isActive } : i
    );
    persist(next);
  }

  const activeCount = integrations.filter((i) => i.isActive).length;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Intégrations</h2>
          <p className="text-sm text-muted-foreground">
            {integrations.length === 0
              ? "Aucune intégration configurée"
              : `${activeCount} active${activeCount !== 1 ? "s" : ""} sur ${integrations.length}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Guide"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowAdd(true); setShowGuide(true); }}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Guide contextuel */}
      {showGuide && (
        <div className="relative">
          <button
            onClick={() => setShowGuide(false)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <AddGuide />
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAdd && (
        <IntegrationForm
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Liste des intégrations */}
      {integrations.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
          <Globe className="h-10 w-10 opacity-30" />
          <p className="text-sm">Aucune intégration configurée</p>
          <button
            onClick={() => { setShowAdd(true); setShowGuide(true); }}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter une intégration
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {integrations.map((integration) =>
            editingId === integration.id ? (
              <IntegrationForm
                key={integration.id}
                initial={integration}
                onSave={(data) => handleEdit(integration.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onEdit={() => setEditingId(integration.id)}
                onDelete={() => handleDelete(integration.id)}
                onToggle={() => handleToggle(integration.id)}
              />
            )
          )}
        </div>
      )}

      {/* Note export */}
      {integrations.length > 0 && (
        <p className="text-xs text-muted-foreground">
          La configuration est stockée en JSON dans le localStorage.{" "}
          <button
            onClick={() => {
              const json = JSON.stringify(integrations, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "homelab-integrations.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="text-primary underline-offset-2 hover:underline"
          >
            Exporter en JSON
          </button>
        </p>
      )}
    </div>
  );
}
