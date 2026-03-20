"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, Power, Lightbulb, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface HAState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    brightness?: number;
    temperature?: number;
    unit_of_measurement?: string;
  };
}

function entityIcon(entityId: string) {
  if (entityId.startsWith("light.")) return Lightbulb;
  if (entityId.startsWith("climate.") || entityId.startsWith("sensor.")) return Thermometer;
  return Power;
}

function isToggleable(entityId: string) {
  return (
    entityId.startsWith("light.") ||
    entityId.startsWith("switch.") ||
    entityId.startsWith("input_boolean.")
  );
}

export function HomeAssistantWidget({ id, config }: WidgetProps) {
  const entities = (config.entities as string[] | undefined) ?? [];
  const queryClient = useQueryClient();

  const { data: states, isLoading, isError } = useQuery<HAState[]>({
    queryKey: ["ha-states", id, entities],
    queryFn: async () => {
      const results = await Promise.all(
        entities.map(async (entityId) => {
          const res = await fetch("/api/integrations/homeassistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "states", entityId }),
          });
          if (!res.ok) throw new Error("Home Assistant inaccessible");
          return res.json() as Promise<HAState>;
        })
      );
      return results;
    },
    enabled: entities.length > 0,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ entityId, currentState }: { entityId: string; currentState: string }) => {
      const domain = entityId.split(".")[0] ?? "homeassistant";
      const service = currentState === "on" ? "turn_off" : "turn_on";
      await fetch("/api/integrations/homeassistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call-service",
          domain,
          service,
          serviceData: { entity_id: entityId },
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ha-states", id] });
    },
  });

  if (entities.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-muted-foreground">
        <Home className="h-8 w-8 opacity-30" />
        <p className="text-xs">Aucune entité configurée</p>
        <p className="text-xs opacity-60">Ajoutez des entités dans les paramètres</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <Home className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Home Assistant</span>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {entities.map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
          Home Assistant inaccessible
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-2">
          {states?.map((entity) => {
            const Icon = entityIcon(entity.entity_id);
            const name = entity.attributes.friendly_name ?? entity.entity_id;
            const isOn = entity.state === "on";
            const canToggle = isToggleable(entity.entity_id);

            return (
              <li
                key={entity.entity_id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isOn ? "text-yellow-400" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate text-sm text-foreground">{name}</span>
                </div>
                {canToggle ? (
                  <button
                    onClick={() =>
                      toggleMutation.mutate({
                        entityId: entity.entity_id,
                        currentState: entity.state,
                      })
                    }
                    disabled={toggleMutation.isPending}
                    className={cn(
                      "h-5 w-9 rounded-full transition-colors disabled:opacity-50",
                      isOn ? "bg-primary" : "bg-muted"
                    )}
                    aria-label={isOn ? "Éteindre" : "Allumer"}
                  >
                    <span
                      className={cn(
                        "block h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5",
                        isOn ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {entity.state}
                    {entity.attributes.unit_of_measurement}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
