"use client";

import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonitoringGrafanaPanelWidget } from "./items/MonitoringGrafanaPanelWidget";
import { GrafanaDashboardWidget } from "./items/GrafanaDashboardWidget";
import { ServiceCheckWidget } from "./items/ServiceCheckWidget";
import type { MonitoringWidget } from "./MonitoringGrid";

interface MonitoringWrapperProps {
  widget: MonitoringWidget;
  isEditMode: boolean;
  onDelete: (id: string) => void;
}

export function MonitoringWrapper({ widget, isEditMode, onDelete }: MonitoringWrapperProps) {
  function renderContent() {
    switch (widget.type) {
      case "grafana-panel":
        return <MonitoringGrafanaPanelWidget id={widget.id} />;
      case "grafana-dashboard":
        return <GrafanaDashboardWidget id={widget.id} />;
      case "service-check":
        return <ServiceCheckWidget id={widget.id} />;
    }
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        isEditMode && "ring-2 ring-primary/30"
      )}
    >
      {isEditMode && (
        <div className="drag-handle flex cursor-grab items-center justify-between border-b border-border bg-muted/30 px-2 py-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => onDelete(widget.id)}
            className="rounded p-0.5 text-muted-foreground hover:text-destructive"
            aria-label="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}
