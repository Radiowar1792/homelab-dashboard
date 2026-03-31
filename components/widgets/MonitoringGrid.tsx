"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { saveSetting, safeJson } from "@/lib/settings-client";
import { GridLayout, verticalCompactor } from "react-grid-layout";
import type { Layout, LayoutItem } from "react-grid-layout";
import { Plus, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonitoringWrapper } from "./MonitoringWrapper";
import { AddMonitoringWidgetDialog } from "./AddMonitoringWidgetDialog";
import type { WidgetSize } from "@/types";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const COLS = 12;
const ROW_HEIGHT = 80;
const LAYOUT_KEY = "monitoring_layout";
const WIDGETS_KEY = "monitoring_widgets";

export interface MonitoringWidget {
  id: string;
  type: "grafana-panel" | "grafana-dashboard" | "service-check";
  size: WidgetSize;
}

const DEFAULT_SIZES: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 3, h: 2 },
  medium: { w: 6, h: 3 },
  large: { w: 9, h: 4 },
  full: { w: 12, h: 4 },
};

function saveWidgets(widgets: MonitoringWidget[]) {
  saveSetting(WIDGETS_KEY, JSON.stringify(widgets));
}

function buildDefaultLayout(widgets: MonitoringWidget[]): LayoutItem[] {
  let x = 0;
  let y = 0;
  let rowMaxH = 0;
  return widgets.map((w) => {
    const { w: ww, h } = DEFAULT_SIZES[w.size];
    if (x + ww > COLS) { x = 0; y += rowMaxH; rowMaxH = 0; }
    const item: LayoutItem = { i: w.id, x, y, w: ww, h };
    x += ww;
    rowMaxH = Math.max(rowMaxH, h);
    return item;
  });
}

function saveLayout(items: LayoutItem[]) {
  saveSetting(LAYOUT_KEY, JSON.stringify(items));
}

export function MonitoringGrid() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [widgets, setWidgets] = useState<MonitoringWidget[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [layoutReady, setLayoutReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Charge widgets + layout depuis l'API au montage
  useEffect(() => {
    Promise.all([
      fetch(`/api/settings?key=${WIDGETS_KEY}`).then((r) => r.json()) as Promise<{ value: string | null }>,
      fetch(`/api/settings?key=${LAYOUT_KEY}`).then((r) => r.json()) as Promise<{ value: string | null }>,
    ])
      .then(([widgetsData, layoutData]) => {
        const loaded = safeJson<MonitoringWidget[]>(widgetsData.value, []);
        const savedLayout = safeJson<LayoutItem[]>(layoutData.value, []);
        setWidgets(loaded);
        if (savedLayout.length > 0) {
          const validIds = new Set(loaded.map((w) => w.id));
          setLayout(savedLayout.filter((l) => validIds.has(l.i)));
        } else {
          setLayout(buildDefaultLayout(loaded));
        }
      })
      .catch(() => { setWidgets([]); setLayout([]); })
      .finally(() => setLayoutReady(true));
  }, []);

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

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!layoutReady) return;
      const mutable = [...newLayout] as LayoutItem[];
      setLayout(mutable);
      saveLayout(mutable);
    },
    [layoutReady]
  );

  function handleAddWidget(widget: MonitoringWidget) {
    const { w, h } = DEFAULT_SIZES[widget.size];
    const maxY = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newItem: LayoutItem = { i: widget.id, x: 0, y: maxY, w, h };
    const newWidgets = [...widgets, widget];
    const newLayout = [...layout, newItem];
    setWidgets(newWidgets);
    setLayout(newLayout);
    saveWidgets(newWidgets);
    saveLayout(newLayout);
  }

  function handleDeleteWidget(id: string) {
    const newWidgets = widgets.filter((w) => w.id !== id);
    const newLayout = layout.filter((l) => l.i !== id);
    setWidgets(newWidgets);
    setLayout(newLayout);
    saveWidgets(newWidgets);
    saveLayout(newLayout);
  }

  const gridConfig = useMemo(() => ({
    cols: COLS,
    rowHeight: ROW_HEIGHT,
    margin: [16, 16] as [number, number],
    containerPadding: [0, 0] as [number, number],
  }), []);

  const dragConfig = useMemo(() => ({
    enabled: isEditMode,
    handle: ".drag-handle",
    threshold: 8,
    bounded: false,
  }), [isEditMode]);

  const resizeConfig = useMemo(() => ({
    enabled: isEditMode,
    handles: ["se"] as ["se"],
  }), [isEditMode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Monitoring</h1>
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
              <><Check className="h-4 w-4" />Verrouiller</>
            ) : (
              <><Pencil className="h-4 w-4" />Modifier la disposition</>
            )}
          </button>
        </div>
      </div>

      <div ref={containerRef}>
        {!layoutReady ? (
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="col-span-3 h-40 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : widgets.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border text-muted-foreground">
            <p className="text-sm">Aucun widget de monitoring configuré</p>
            <button
              onClick={() => { setIsEditMode(true); setIsAddOpen(true); }}
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
            {widgets.map((widget) => (
              <div key={widget.id} className="overflow-hidden rounded-xl">
                <MonitoringWrapper widget={widget} isEditMode={isEditMode} onDelete={handleDeleteWidget} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      <AddMonitoringWidgetDialog open={isAddOpen} onOpenChange={setIsAddOpen} onAdd={handleAddWidget} />
    </div>
  );
}
