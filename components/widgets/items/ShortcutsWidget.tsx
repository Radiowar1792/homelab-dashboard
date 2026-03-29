"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Plus, X, Link } from "lucide-react";
import type { WidgetProps } from "@/types";

interface Shortcut {
  id: string;
  name: string;
  url: string;
  emoji: string;
}

const STORAGE_PREFIX = "dashboard-shortcuts-";

export function ShortcutsWidget({ id }: WidgetProps) {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newEmoji, setNewEmoji] = useState("🔗");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setShortcuts(JSON.parse(saved) as Shortcut[]);
    } catch {}
  }, [storageKey]);

  function persist(updated: Shortcut[]) {
    setShortcuts(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
  }

  function handleAdd() {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name || !url) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    persist([
      ...shortcuts,
      { id: crypto.randomUUID(), name, url: normalized, emoji: newEmoji || "🔗" },
    ]);
    setNewName("");
    setNewUrl("");
    setNewEmoji("🔗");
    setIsAdding(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Link className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Raccourcis</span>
        </div>
        <button
          onClick={() => setIsAdding((v) => !v)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Ajouter un raccourci"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isAdding && (
          <div className="mb-2 space-y-1.5 rounded-lg border border-border bg-muted/30 p-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                maxLength={2}
                className="w-10 rounded border border-border bg-background px-1.5 py-1 text-center text-sm outline-none focus:ring-1 focus:ring-primary"
                placeholder="🔗"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom"
                autoFocus
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || !newUrl.trim()}
                className="flex-1 rounded bg-primary py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                Ajouter
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 rounded border border-border py-1 text-xs hover:bg-muted"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {shortcuts.length === 0 && !isAdding ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-4 text-center text-muted-foreground">
            <Link className="h-6 w-6 opacity-30" />
            <p className="text-xs">Aucun raccourci</p>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-primary hover:underline"
            >
              Ajouter
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {shortcuts.map((s) => (
              <div key={s.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <span className="text-base leading-none">{s.emoji}</span>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center gap-1 overflow-hidden text-sm font-medium text-foreground hover:text-primary"
                >
                  <span className="truncate">{s.name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60" />
                </a>
                <button
                  onClick={() => persist(shortcuts.filter((sc) => sc.id !== s.id))}
                  className="rounded p-0.5 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  aria-label="Supprimer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
