"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, GripVertical, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WidgetContent } from "./WidgetContent";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import type { WidgetConfig } from "@/types";

interface WidgetWrapperProps {
  widget: WidgetConfig;
  isEditMode: boolean;
}

export function WidgetWrapper({ widget, isEditMode }: WidgetWrapperProps) {
  const queryClient = useQueryClient();
  const [showConfig, setShowConfig] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/widgets/${widget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      toast.success("Widget supprimé");
    },
    onError: () => toast.error("Impossible de supprimer le widget"),
  });

  return (
    <>
      <div
        className={cn(
          "glass bg-card relative h-full w-full overflow-hidden rounded-xl transition-all",
          isEditMode && "ring-1 ring-dashed ring-primary/50"
        )}
      >
        {/* Contrôles d'édition */}
        {isEditMode && (
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-muted/80 px-2 py-1.5 backdrop-blur-sm">
            <button
              className="drag-handle cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label="Déplacer le widget"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowConfig(true)}
                className="rounded p-0.5 text-muted-foreground hover:text-primary"
                aria-label="Personnaliser le widget"
                title="Personnaliser"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Supprimer le widget"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Contenu du widget */}
        <div className={cn("h-full overflow-auto", isEditMode && "pt-8")}>
          <WidgetContent widget={widget} isEditMode={isEditMode} />
        </div>
      </div>

      {/* Panneau de configuration */}
      {showConfig && (
        <WidgetConfigPanel widget={widget} onClose={() => setShowConfig(false)} />
      )}
    </>
  );
}
