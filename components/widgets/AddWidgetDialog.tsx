"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search } from "lucide-react";
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from "./registry";
import { cn } from "@/lib/utils";
import type { WidgetConfig, WidgetSize } from "@/types";

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetAdded?: (id: string, size: WidgetSize) => void;
}

export function AddWidgetDialog({ open, onOpenChange, onWidgetAdded }: AddWidgetDialogProps) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<string>("Tous");
  const [search, setSearch] = useState("");

  const { data: existingWidgets = [] } = useQuery<WidgetConfig[]>({
    queryKey: ["widgets"],
  });

  const addMutation = useMutation({
    mutationFn: async (type: string) => {
      const definition = WIDGET_REGISTRY.find((w) => w.type === type);
      if (!definition) throw new Error("Type de widget inconnu");
      const position = existingWidgets.length;
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          position,
          size: definition.defaultSize,
          config: definition.defaultConfig,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      return res.json();
    },
    onSuccess: (data: { widget: WidgetConfig }) => {
      if (onWidgetAdded) onWidgetAdded(data.widget.id, data.widget.size);
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      toast.success("Widget ajouté");
      onOpenChange(false);
    },
    onError: () => toast.error("Impossible d'ajouter le widget"),
  });

  const categories = ["Tous", ...WIDGET_CATEGORIES];

  const filtered = useMemo(() => {
    return WIDGET_REGISTRY.filter((def) => {
      const matchCat = activeCategory === "Tous" || def.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        def.label.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  function handleClose() {
    onOpenChange(false);
    setSearch("");
    setActiveCategory("Tous");
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[85vh] max-h-[680px] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border dialog-bg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Ajouter un widget
            </Dialog.Title>
            <Dialog.Close onClick={handleClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Search */}
          <div className="border-b border-border px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un widget…"
                className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-border px-5 py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Widget grid */}
          <div className="flex-1 overflow-auto p-5">
            {filtered.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Aucun widget trouvé
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((def) => {
                  const Icon = def.icon;
                  return (
                    <button
                      key={def.type}
                      onClick={() => addMutation.mutate(def.type)}
                      disabled={addMutation.isPending}
                      className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 disabled:opacity-50"
                    >
                      <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{def.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{def.description}</p>
                        <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {def.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} widget{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
