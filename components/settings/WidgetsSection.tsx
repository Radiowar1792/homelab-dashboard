"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { getWidgetDefinition, WIDGET_REGISTRY } from "@/components/widgets/registry";
import type { WidgetConfig, WidgetSize } from "@/types";

// Définition des champs de config par type de widget
const WIDGET_CONFIG_FIELDS: Record<
  string,
  Array<{
    key: string;
    label: string;
    type: "text" | "number" | "url" | "textarea";
    placeholder?: string;
    hint?: string;
  }>
> = {
  "service-status": [
    {
      key: "refreshInterval",
      label: "Intervalle de rafraîchissement (secondes)",
      type: "number",
      placeholder: "30",
    },
  ],
  "rss-feed": [
    { key: "url", label: "URL du flux RSS", type: "url", placeholder: "https://example.com/feed.xml" },
    { key: "maxItems", label: "Nombre d'articles max", type: "number", placeholder: "10" },
  ],
  "llm-chat": [
    { key: "model", label: "Modèle par défaut", type: "text", placeholder: "llama3.2", hint: "Laissez vide pour utiliser le premier modèle disponible" },
  ],
  "home-assistant": [
    {
      key: "entities",
      label: "Entity IDs (une par ligne)",
      type: "textarea",
      placeholder: "light.living_room\nswitch.heater\nsensor.temperature",
      hint: "Entrez les IDs d'entités Home Assistant, un par ligne",
    },
  ],
  "vikunja-tasks": [
    { key: "limit", label: "Nombre de tâches max", type: "number", placeholder: "5" },
  ],
  "n8n-workflows": [],
  docmost: [{ key: "limit", label: "Nombre de pages max", type: "number", placeholder: "5" }],
  "actual-budget": [],
};

const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: "small", label: "Petit (1×1)" },
  { value: "medium", label: "Moyen (2×1)" },
  { value: "large", label: "Grand (2×2)" },
  { value: "full", label: "Pleine largeur" },
];

async function fetchWidgets(): Promise<WidgetConfig[]> {
  const res = await fetch("/api/widgets");
  const data = (await res.json()) as { widgets: WidgetConfig[] };
  return data.widgets;
}

function WidgetConfigEditor({ widget }: { widget: WidgetConfig }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState<Record<string, unknown>>(widget.config);
  const [size, setSize] = useState<WidgetSize>(widget.size);
  const def = getWidgetDefinition(widget.type);
  const fields = WIDGET_CONFIG_FIELDS[widget.type] ?? [];
  const Icon = def?.icon;

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Convertir les textarea "entities" (string) en tableau
      const finalConfig = { ...config };
      if (widget.type === "home-assistant" && typeof finalConfig.entities === "string") {
        finalConfig.entities = (finalConfig.entities as string)
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const res = await fetch(`/api/widgets/${widget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: finalConfig, size }),
      });
      if (!res.ok) throw new Error("Erreur");
    },
    onSuccess: () => {
      toast.success("Widget mis à jour");
      void queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
    onError: () => toast.error("Impossible de sauvegarder"),
  });

  function getFieldValue(key: string): string {
    const val = config[key];
    if (key === "entities" && Array.isArray(val)) return (val as string[]).join("\n");
    return val !== undefined && val !== null ? String(val) : "";
  }

  function setField(key: string, raw: string, type: string) {
    setConfig((prev) => ({
      ...prev,
      [key]: type === "number" ? (raw === "" ? undefined : Number(raw)) : raw,
    }));
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <div>
            <p className="text-sm font-medium text-foreground">{def?.label ?? widget.type}</p>
            <p className="text-xs text-muted-foreground">{SIZE_OPTIONS.find(s => s.value === widget.size)?.label}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Taille */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Taille</label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSize(opt.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    size === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs de config */}
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune configuration disponible pour ce widget.</p>
          ) : (
            fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={getFieldValue(field.key)}
                    onChange={(e) => setField(field.key, e.target.value, "text")}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={getFieldValue(field.key)}
                    onChange={(e) => setField(field.key, e.target.value, field.type)}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
                {field.hint && (
                  <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
                )}
              </div>
            ))
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function WidgetsSection() {
  const { data: widgets = [], isLoading } = useQuery<WidgetConfig[]>({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const configuredTypes = new Set(widgets.map((w) => w.type));
  const availableToAdd = WIDGET_REGISTRY.filter((d) => !configuredTypes.has(d.type));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Configuration des widgets</h2>
        <p className="text-sm text-muted-foreground">
          Ajustez la taille et les paramètres de chaque widget
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun widget actif. Ajoutez-en depuis le dashboard.
        </p>
      ) : (
        <div className="space-y-2">
          {widgets.map((widget) => (
            <WidgetConfigEditor key={widget.id} widget={widget} />
          ))}
        </div>
      )}

      {availableToAdd.length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Types disponibles non configurés
          </p>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.map((def) => {
              const Icon = def.icon;
              return (
                <span
                  key={def.type}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                >
                  <Icon className="h-3 w-3" />
                  {def.label}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Ajoutez-les depuis le bouton &quot;Modifier → Ajouter&quot; sur le dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
