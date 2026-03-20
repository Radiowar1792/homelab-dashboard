import {
  Activity,
  Rss,
  Bot,
  Home,
  CheckSquare,
  Workflow,
  BookOpen,
  Wallet,
} from "lucide-react";
import type { WidgetDefinition } from "@/types";

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    type: "service-status",
    label: "Status des Services",
    description: "Monitore l'état de disponibilité de vos services",
    icon: Activity,
    defaultSize: "medium",
    defaultConfig: { refreshInterval: 30 },
    componentPath: "ServiceStatusWidget",
  },
  {
    type: "rss-feed",
    label: "Flux RSS",
    description: "Affiche les derniers articles de vos flux RSS",
    icon: Rss,
    defaultSize: "medium",
    defaultConfig: { maxItems: 10 },
    componentPath: "RSSFeedWidget",
  },
  {
    type: "llm-chat",
    label: "LLM Chat",
    description: "Interface de chat avec Ollama",
    icon: Bot,
    defaultSize: "large",
    defaultConfig: { model: "" },
    componentPath: "LLMChatWidget",
  },
  {
    type: "home-assistant",
    label: "Home Assistant",
    description: "Contrôlez vos entités Home Assistant",
    icon: Home,
    defaultSize: "medium",
    defaultConfig: { entities: [] },
    componentPath: "HomeAssistantWidget",
  },
  {
    type: "vikunja-tasks",
    label: "Tâches Vikunja",
    description: "Affiche vos tâches en cours",
    icon: CheckSquare,
    defaultSize: "medium",
    defaultConfig: { projectId: null, limit: 5 },
    componentPath: "VikunjaWidget",
  },
  {
    type: "n8n-workflows",
    label: "Workflows N8N",
    description: "Statut de vos automations N8N",
    icon: Workflow,
    defaultSize: "small",
    defaultConfig: {},
    componentPath: "N8NWidget",
  },
  {
    type: "docmost",
    label: "Docmost",
    description: "Pages récentes de votre wiki",
    icon: BookOpen,
    defaultSize: "small",
    defaultConfig: { limit: 5 },
    componentPath: "DocmostWidget",
  },
  {
    type: "actual-budget",
    label: "Actual Budget",
    description: "Vue d'ensemble de votre budget",
    icon: Wallet,
    defaultSize: "medium",
    defaultConfig: {},
    componentPath: "ActualBudgetWidget",
  },
];

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY.find((w) => w.type === type);
}
