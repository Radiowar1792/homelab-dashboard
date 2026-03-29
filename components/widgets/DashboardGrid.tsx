"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GridLayout, verticalCompactor } from "react-grid-layout";
import type { Layout, LayoutItem } from "react-grid-layout";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetWrapper } from "./WidgetWrapper";
import { AddWidgetDialog } from "./AddWidgetDialog";
import type { WidgetConfig, WidgetSize } from "@/types";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const COLS = 12;
const ROW_HEIGHT = 80;
const STORAGE_KEY = "dashboard-grid-layout";

const DEFAULT_SIZES: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
};

async function fetchWidgets(): Promise<WidgetConfig[]> {
  const res = await fetch("/api/widgets");
  const data = (await res.json()) as { widgets: WidgetConfig[] };
  return data.widgets;
}

function buildDefaultLayout(widgets: WidgetConfig[]): LayoutItem[] {
  let x = 0;
  let y = 0;
  let rowMaxH = 0;
  return widgets.map((w) => {
    const { w: ww, h } = DEFAULT_SIZES[w.size];
    if (x + ww > COLS) {
      x = 0;
      y += rowMaxH;
      rowMaxH = 0;
    }
    const item: LayoutItem = { i: w.id, x, y, w: ww, h };
    x += ww;
    rowMaxH = Math.max(rowMaxH, h);
    return item;
  });
}

/**
 * Charge le layout depuis localStorage, en fusionnant avec les widgets actuels.
 * Si un widget n'a pas de position sauvegardée, il est placé en bas du layout.
 */
function loadLayoutFromStorage(widgets: WidgetConfig[]): LayoutItem[] {
  if (typeof window === "undefined") return buildDefaultLayout(widgets);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultLayout(widgets);

    const saved = JSON.parse(raw) as LayoutItem[];
    const savedMap = new Map(saved.map((l) => [l.i, l]));
    const validIds = new Set(widgets.map((w) => w.id));

    // Items sauvegardés valides (widget existe toujours)
    const filteredSaved = saved.filter((l) => validIds.has(l.i));

    // Widgets sans position sauvegardée (nouveaux widgets non encore positionnés)
    const unsaved = widgets.filter((w) => !savedMap.has(w.id));
    if (unsaved.length === 0) return filteredSaved;

    const maxY = filteredSaved.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    let x = 0;
    const extra = unsaved.map((w) => {
      const { w: ww, h } = DEFAULT_SIZES[w.size];
      if (x + ww > COLS) x = 0;
      const item: LayoutItem = { i: w.id, x, y: maxY, w: ww, h };
      x += ww;
      return item;
    });

    return [...filteredSaved, ...extra];
  } catch {
    return buildDefaultLayout(widgets);
  }
}

/**
 * Fusionne le layout existant avec la nouvelle liste de widgets.
 * Utilisé après ajout/suppression de widgets pour éviter de réinitialiser
 * tout le layout depuis localStorage.
 */
function mergeLayout(
  current: LayoutItem[],
  visible: WidgetConfig[]
): LayoutItem[] {
  const existingIds = new Set(current.map((l) => l.i));
  const validIds = new Set(visible.map((w) => w.id));

  // Early return if layout is already in sync — avoids spurious re-renders
  const allValid = current.every((l) => validIds.has(l.i));
  const noNew = visible.every((w) => existingIds.has(w.id));
  if (allValid && noNew) return current;

  // Garder uniquement les widgets qui existent encore
  const filtered = current.filter((l) => validIds.has(l.i));

  // Ajouter les nouveaux widgets en bas
  const newWidgets = visible.filter((w) => !existingIds.has(w.id));
  if (newWidgets.length === 0) return filtered;

  const maxY = filtered.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  let x = 0;
  const extra = newWidgets.map((w) => {
    const { w: ww, h } = DEFAULT_SIZES[w.size];
    if (x + ww > COLS) x = 0;
    const item: LayoutItem = { i: w.id, x, y: maxY, w: ww, h };
    x += ww;
    return item;
  });

  return [...filtered, ...extra];
}

function saveLayout(items: LayoutItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function DashboardGrid() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  // layoutReady = true uniquement après chargement depuis localStorage.
  // On n'affiche GridLayout qu'à ce moment pour éviter qu'il
  // appelle onLayoutChange avec un layout vide et écrase la sauvegarde.
  const [layoutReady, setLayoutReady] = useState(false);
  const initializedRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const visibleWidgets = widgets.filter((w) => w.isVisible);
  const widgetIdsKey = visibleWidgets.map((w) => w.id).join(",");

  useEffect(() => {
    // Attendre que le chargement initial soit terminé
    if (isLoading) return;

    const visible = widgets.filter((w) => w.isVisible);

    if (!initializedRef.current) {
      // Première initialisation : charger depuis localStorage
      const loaded =
        visible.length > 0 ? loadLayoutFromStorage(visible) : [];
      setLayout(loaded);
      initializedRef.current = true;
      setLayoutReady(true);
    } else {
      // Changement de widgets (ajout/suppression) :
      // fusionner sans réinitialiser tout le layout
      setLayout((prev) => {
        const merged = mergeLayout(prev, visible);
        saveLayout(merged);
        return merged;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetIdsKey, isLoading]);

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

  // Insère immédiatement le layout item du nouveau widget avant que
  // la query se rafraîchisse, pour éviter le saut de position.
  const handleWidgetAdded = useCallback(
    (id: string, size: WidgetSize) => {
      setLayout((prev) => {
        const { w, h } = DEFAULT_SIZES[size];
        const maxY = prev.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        const newItem: LayoutItem = { i: id, x: 0, y: maxY, w, h };
        const next = [...prev, newItem];
        saveLayout(next);
        return next;
      });
    },
    []
  );

  // Sauvegarde le layout dans localStorage après chaque drag/resize.
  // Ne sauvegarde PAS avant que layoutReady=true pour éviter d'écraser
  // le layout stocké avec un layout auto-généré vide.
  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!layoutReady) return;
      const mutable = [...newLayout] as LayoutItem[];
      setLayout(mutable);
      saveLayout(mutable);
    },
    [layoutReady]
  );

  const gridConfig = useMemo(
    () => ({
      cols: COLS,
      rowHeight: ROW_HEIGHT,
      margin: [16, 16] as [number, number],
      containerPadding: [0, 0] as [number, number],
    }),
    []
  );

  const dragConfig = useMemo(
    () => ({
      enabled: isEditMode,
      handle: ".drag-handle",
      threshold: 8,
      bounded: false,
    }),
    [isEditMode]
  );

  const resizeConfig = useMemo(
    () => ({
      enabled: isEditMode,
      handles: ["se"] as ["se"],
    }),
    [isEditMode]
  );

  const showSkeleton = isLoading || !layoutReady;

  return (
    <div className="space-y-4">
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
                Verrouiller
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Modifier la disposition
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grille */}
      <div ref={containerRef}>
        {showSkeleton ? (
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
          <GridLayout
            layout={layout}
            width={containerWidth}
            gridConfig={gridConfig}
            dragConfig={dragConfig}
            resizeConfig={resizeConfig}
            compactor={verticalCompactor}
            onLayoutChange={handleLayoutChange}
          >
            {visibleWidgets.map((widget) => (
              <div key={widget.id} className="overflow-hidden rounded-xl">
                <WidgetWrapper widget={widget} isEditMode={isEditMode} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      <AddWidgetDialog open={isAddOpen} onOpenChange={setIsAddOpen} onWidgetAdded={handleWidgetAdded} />
    </div>
  );
}
