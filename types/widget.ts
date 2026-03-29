import type { LucideIcon } from "lucide-react";

// Tailles disponibles pour les widgets
export type WidgetSize = "small" | "medium" | "large" | "full";

// Props communes à tous les widgets
export interface WidgetProps {
  id: string;
  config: Record<string, unknown>;
  size: WidgetSize;
  isEditMode: boolean;
}

// Configuration persistée en base de données
export interface WidgetConfig {
  id: string;
  type: string;
  position: number;
  size: WidgetSize;
  config: Record<string, unknown>;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Définition d'un widget dans le registre
export interface WidgetDefinition {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  defaultConfig: Record<string, unknown>;
  category: string;
  // Le composant est importé dynamiquement dans le registre
  componentPath: string;
}

// Mapping des classes CSS selon la taille
export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
  small: "col-span-1 row-span-1",
  medium: "col-span-2 row-span-1",
  large: "col-span-2 row-span-2",
  full: "col-span-full row-span-2",
};
