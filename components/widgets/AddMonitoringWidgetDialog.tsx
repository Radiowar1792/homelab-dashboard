"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, BarChart2, LayoutDashboard, Activity } from "lucide-react";
import type { MonitoringWidget } from "./MonitoringGrid";

const MONITORING_WIDGET_TYPES = [
  {
    type: "grafana-panel" as const,
    label: "Panel Grafana",
    description: "Intègre un panel Grafana en iframe",
    icon: BarChart2,
    defaultSize: "large" as const,
  },
  {
    type: "grafana-dashboard" as const,
    label: "Dashboard Grafana",
    description: "Affiche un dashboard Grafana complet en iframe",
    icon: LayoutDashboard,
    defaultSize: "full" as const,
  },
  {
    type: "service-check" as const,
    label: "Vérification Service",
    description: "Vérifie la disponibilité HTTP d'un service",
    icon: Activity,
    defaultSize: "small" as const,
  },
];

interface AddMonitoringWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widget: MonitoringWidget) => void;
}

export function AddMonitoringWidgetDialog({ open, onOpenChange, onAdd }: AddMonitoringWidgetDialogProps) {
  function handleAdd(type: MonitoringWidget["type"], defaultSize: MonitoringWidget["size"]) {
    const id = crypto.randomUUID();
    onAdd({ id, type, size: defaultSize });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border dialog-bg p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Ajouter un widget de monitoring
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {MONITORING_WIDGET_TYPES.map((def) => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => handleAdd(def.type, def.defaultSize)}
                  className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
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
