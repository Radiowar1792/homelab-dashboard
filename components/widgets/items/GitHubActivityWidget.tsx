"use client";

import { useQuery } from "@tanstack/react-query";
import { Github, GitCommit, GitPullRequest, Star, AlertCircle } from "lucide-react";
import type { WidgetProps } from "@/types";

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

function EventIcon({ type }: { type: string }) {
  if (type === "PushEvent") return <GitCommit className="h-3.5 w-3.5 text-green-500" />;
  if (type === "PullRequestEvent") return <GitPullRequest className="h-3.5 w-3.5 text-purple-500" />;
  if (type === "WatchEvent") return <Star className="h-3.5 w-3.5 text-yellow-500" />;
  return <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />;
}

function eventLabel(event: GitHubEvent): string {
  switch (event.type) {
    case "PushEvent": {
      const commits = (event.payload.commits as unknown[])?.length ?? 1;
      return `Pushed ${commits} commit${commits > 1 ? "s" : ""}`;
    }
    case "PullRequestEvent":
      return `PR ${event.payload.action as string}`;
    case "WatchEvent":
      return "Starred";
    case "CreateEvent":
      return `Created ${event.payload.ref_type as string}`;
    case "ForkEvent":
      return "Forked";
    case "IssuesEvent":
      return `Issue ${event.payload.action as string}`;
    default:
      return event.type.replace("Event", "");
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}

export function GitHubActivityWidget({ config }: WidgetProps) {
  const username = (config.username as string | undefined) ?? "";
  const maxItems = (config.maxItems as number | undefined) ?? 8;

  const { data, isLoading, error } = useQuery<GitHubEvent[]>({
    queryKey: ["github-activity", username],
    queryFn: () =>
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`)
        .then((r) => { if (!r.ok) throw new Error("Utilisateur introuvable"); return r.json(); }),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!username) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Github className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Configurez votre nom d&apos;utilisateur GitHub</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Erreur : {String(error)}</p>
      </div>
    );
  }

  const events = data.slice(0, maxItems);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Github className="h-4 w-4 text-foreground" />
        <p className="text-xs font-semibold text-foreground">{username}</p>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2">
        {events.length === 0 ? (
          <p className="pt-4 text-center text-xs text-muted-foreground">Aucune activité</p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0"><EventIcon type={event.type} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] text-muted-foreground">{event.repo.name}</p>
                  <p className="text-xs text-foreground">{eventLabel(event)}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(event.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
