"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableWidget } from "./SortableWidget";
import { AddWidgetDialog } from "./AddWidgetDialog";
import type { WidgetConfig } from "@/types";

async function fetchWidgets(): Promise<WidgetConfig[]> {
  const res = await fetch("/api/widgets");
  const data = (await res.json()) as { widgets: WidgetConfig[] };
  return data.widgets;
}

export function DashboardGrid() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; position: number }>) => {
      const res = await fetch("/api/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Erreur lors de la réorganisation");
    },
    onError: () => {
      toast.error("Impossible de sauvegarder l'ordre");
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(widgets, oldIndex, newIndex);

    // Mise à jour optimiste
    queryClient.setQueryData(["widgets"], reordered);

    reorderMutation.mutate(reordered.map((w, i) => ({ id: w.id, position: i })));
  }

  const visibleWidgets = widgets.filter((w) => w.isVisible);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          )}
          <button
            onClick={() => setIsEditMode((e) => !e)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isEditMode
                ? "bg-green-600 text-white hover:bg-green-700"
                : "border border-border bg-card text-foreground hover:bg-accent"
            )}
          >
            {isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                Terminer
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Modifier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grille */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="col-span-2 h-40 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : visibleWidgets.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border text-muted-foreground">
          <p className="text-sm">Aucun widget configuré</p>
          <button
            onClick={() => {
              setIsEditMode(true);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter un widget
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleWidgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-4 gap-4">
              {visibleWidgets.map((widget) => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddWidgetDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
