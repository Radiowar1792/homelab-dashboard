"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { WIDGET_REGISTRY } from "./registry";
import type { WidgetConfig, WidgetSize } from "@/types";

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetAdded?: (id: string, size: WidgetSize) => void;
}

export function AddWidgetDialog({ open, onOpenChange, onWidgetAdded }: AddWidgetDialogProps) {
  const queryClient = useQueryClient();

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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Ajouter un widget
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {WIDGET_REGISTRY.map((def) => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => addMutation.mutate(def.type)}
                  disabled={addMutation.isPending}
                  className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{def.label}</p>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
