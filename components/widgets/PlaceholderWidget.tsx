import { getWidgetDefinition } from "./registry";

interface PlaceholderWidgetProps {
  type: string;
}

export function PlaceholderWidget({ type }: PlaceholderWidgetProps) {
  const definition = getWidgetDefinition(type);
  const Icon = definition?.icon;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
      {Icon && <Icon className="h-8 w-8 opacity-40" />}
      <p className="text-sm font-medium">{definition?.label ?? type}</p>
      <p className="text-center text-xs opacity-60">Disponible à l&apos;étape 6</p>
    </div>
  );
}
