"use client";

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary pour isoler les pannes de widgets
 * Chaque widget est enveloppé dans un ErrorBoundary indépendant
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.widgetName ?? "Widget"} a planté:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm font-medium text-destructive">
            {this.props.widgetName ?? "Ce widget"} a rencontré une erreur
          </p>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message ?? "Erreur inconnue"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-md bg-destructive/10 px-3 py-1 text-xs text-destructive hover:bg-destructive/20"
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
