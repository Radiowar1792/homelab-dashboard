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
const STORAGE_KEY = "dashboard-grid-layout-v2";

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

function mergeWithSaved(
  widgets: WidgetConfig[],
  saved: LayoutItem[]
): LayoutItem[] {
  const savedMap = new Map(saved.map((l) => [l.i, l]));
  const validIds = new Set(widgets.map((w) => w.id));

  const filteredSaved = saved.filter((l) => validIds.has(l.i));
  const newWidgets = widgets.filter((w) => !savedMap.has(w.id));

  if (newWidgets.length === 0) return filteredSaved;

  const maxY = filteredSaved.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  let x = 0;
  const extra = newWidgets.map((w) => {
    const { w: ww, h } = DEFAULT_SIZES[w.size];
    if (x + ww > COLS) x = 0;
    const item: LayoutItem = { i: w.id, x, y: maxY, w: ww, h };
    x += ww;
    return item;
  });

  return [...filteredSaved, ...extra];
}

function loadLayout(widgets: WidgetConfig[]): LayoutItem[] {
  if (typeof window === "undefined") return buildDefaultLayout(widgets);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LayoutItem[];
      return mergeWithSaved(widgets, parsed);
    }
  } catch {}
  return buildDefaultLayout(widgets);
}

export function DashboardGrid() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const visibleWidgets = widgets.filter((w) => w.isVisible);
  const widgetIdsKey = visibleWidgets.map((w) => w.id).join(",");

  useEffect(() => {
    const visible = widgets.filter((w) => w.isVisible);
    if (visible.length > 0) {
      setLayout(loadLayout(visible));
    } else {
      setLayout([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetIdsKey]);

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

  const handleLayoutChange = useCallback((newLayout: Layout) => {
    const mutable = [...newLayout] as LayoutItem[];
    setLayout(mutable);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mutable));
    } catch {}
  }, []);

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

      <AddWidgetDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}
