"use client";

import dynamic from "next/dynamic";
import type { WidgetConfig, WidgetProps } from "@/types";
import { PlaceholderWidget } from "./PlaceholderWidget";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const loadingFallback = (
  <div className="flex h-full items-center justify-center">
    <LoadingSpinner />
  </div>
);

const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetProps>> = {
  "service-status": dynamic(
    () => import("./items/ServiceStatusWidget").then((m) => m.ServiceStatusWidget),
    { loading: () => loadingFallback }
  ),
  "rss-feed": dynamic(
    () => import("./items/RSSFeedWidget").then((m) => m.RSSFeedWidget),
    { loading: () => loadingFallback }
  ),
  "llm-chat": dynamic(
    () => import("./items/LLMChatWidget").then((m) => m.LLMChatWidget),
    { loading: () => loadingFallback }
  ),
  "home-assistant": dynamic(
    () => import("./items/HomeAssistantWidget").then((m) => m.HomeAssistantWidget),
    { loading: () => loadingFallback }
  ),
  "vikunja-tasks": dynamic(
    () => import("./items/VikunjaWidget").then((m) => m.VikunjaWidget),
    { loading: () => loadingFallback }
  ),
  "n8n-workflows": dynamic(
    () => import("./items/N8NWidget").then((m) => m.N8NWidget),
    { loading: () => loadingFallback }
  ),
  docmost: dynamic(
    () => import("./items/DocmostWidget").then((m) => m.DocmostWidget),
    { loading: () => loadingFallback }
  ),
  "actual-budget": dynamic(
    () => import("./items/ActualBudgetWidget").then((m) => m.ActualBudgetWidget),
    { loading: () => loadingFallback }
  ),
};

interface WidgetContentProps {
  widget: WidgetConfig;
  isEditMode: boolean;
}

export function WidgetContent({ widget, isEditMode }: WidgetContentProps) {
  const Component = WIDGET_COMPONENTS[widget.type];
  if (!Component) return <PlaceholderWidget type={widget.type} />;
  return (
    <Component
      id={widget.id}
      config={widget.config}
      size={widget.size}
      isEditMode={isEditMode}
    />
  );
}
