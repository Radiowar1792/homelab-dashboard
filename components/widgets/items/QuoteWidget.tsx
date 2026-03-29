"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Quote } from "lucide-react";
import type { WidgetProps } from "@/types";

interface QuoteResponse {
  content: string;
  author: string;
}

export function QuoteWidget({ config }: WidgetProps) {
  const tags = (config.tags as string | undefined) ?? "inspirational";

  const { data, isLoading, refetch, isRefetching } = useQuery<QuoteResponse>({
    queryKey: ["quote", tags],
    queryFn: () =>
      fetch(`https://api.quotable.io/random?tags=${encodeURIComponent(tags)}`).then((r) => r.json()),
    staleTime: Infinity,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <Quote className="h-8 w-8 shrink-0 text-primary/40" />
      {data ? (
        <>
          <p className="text-sm leading-relaxed text-foreground italic">&ldquo;{data.content}&rdquo;</p>
          <p className="text-xs font-medium text-primary">— {data.author}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Impossible de charger une citation</p>
      )}
      <button
        onClick={() => void refetch()}
        disabled={isRefetching}
        className="absolute bottom-3 right-3 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
        title="Nouvelle citation"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
