"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WIDGET_SIZE_CLASSES } from "@/types";
import { WidgetContent } from "./WidgetContent";
import type { WidgetConfig } from "@/types";


interface WidgetWrapperProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function WidgetWrapper({
  widget,
  isEditMode,
  dragHandleProps,
  isDragging,
}: WidgetWrapperProps) {
  const queryClient = useQueryClient();

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
    <div
      className={cn(
        WIDGET_SIZE_CLASSES[widget.size],
        "glass relative min-h-32 rounded-xl transition-all",
        isDragging && "opacity-50 ring-2 ring-primary",
        isEditMode && "ring-1 ring-border"
      )}
    >
      {/* Contrôles d'édition */}
      {isEditMode && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between rounded-t-xl bg-card/80 px-2 py-1 backdrop-blur-sm">
          <button
            {...dragHandleProps}
            className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Déplacer le widget"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="text-muted-foreground hover:text-destructive-foreground"
            aria-label="Supprimer le widget"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Contenu du widget */}
      <div className={cn("h-full", isEditMode && "pt-8")}>
        <WidgetContent widget={widget} isEditMode={isEditMode} />
      </div>
    </div>
  );
}
