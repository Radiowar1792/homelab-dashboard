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
    () =>
      import("./items/ServiceStatusWidget").then(
        (m) => m.ServiceStatusWidget
      ),
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
  clock: dynamic(
    () => import("./items/ClockWidget").then((m) => m.ClockWidget),
    { loading: () => loadingFallback }
  ),
  "search-bar": dynamic(
    () =>
      import("./items/SearchBarWidget").then((m) => m.SearchBarWidget),
    { loading: () => loadingFallback }
  ),
  "grafana-panel": dynamic(
    () =>
      import("./items/GrafanaPanelWidget").then(
        (m) => m.GrafanaPanelWidget
      ),
    { loading: () => loadingFallback }
  ),
  weather: dynamic(
    () => import("./items/WeatherWidget").then((m) => m.WeatherWidget),
    { loading: () => loadingFallback }
  ),
  "quick-notes": dynamic(
    () =>
      import("./items/QuickNotesWidget").then((m) => m.QuickNotesWidget),
    { loading: () => loadingFallback }
  ),
  "public-ip": dynamic(
    () =>
      import("./items/PublicIPWidget").then((m) => m.PublicIPWidget),
    { loading: () => loadingFallback }
  ),
  "ping-monitor": dynamic(
    () =>
      import("./items/PingMonitorWidget").then((m) => m.PingMonitorWidget),
    { loading: () => loadingFallback }
  ),
  shortcuts: dynamic(
    () =>
      import("./items/ShortcutsWidget").then((m) => m.ShortcutsWidget),
    { loading: () => loadingFallback }
  ),
  calendar: dynamic(
    () =>
      import("./items/CalendarWidget").then((m) => m.CalendarWidget),
    { loading: () => loadingFallback }
  ),
  pomodoro: dynamic(
    () =>
      import("./items/PomodoroWidget").then((m) => m.PomodoroWidget),
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
