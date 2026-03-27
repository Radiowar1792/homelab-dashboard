"use client";

import { useState, useEffect } from "react";
import { Edit2, Check } from "lucide-react";
import type { WidgetProps } from "@/types";

const STORAGE_PREFIX = "dashboard-notes-";

function renderMarkdown(text: string): string {
  // HTML escape first for security
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Titres
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 style="font-size:0.875rem;font-weight:700;margin:0.75rem 0 0.25rem">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 style="font-size:1rem;font-weight:700;margin:1rem 0 0.25rem">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 style="font-size:1.125rem;font-weight:700;margin:1rem 0 0.5rem">$1</h1>'
  );

  // Gras et italique
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Listes
  html = html.replace(
    /^- (.+)$/gm,
    '<li style="margin-left:1.25rem;list-style-type:disc">$1</li>'
  );

  // Sauts de ligne
  html = html.replace(/\n/g, "<br>");

  return html;
}

export function QuickNotesWidget({ id }: WidgetProps) {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setContent(saved);
    } catch {}
  }, [storageKey]);

  function handleChange(val: string) {
    setContent(val);
    try {
      localStorage.setItem(storageKey, val);
    } catch {}
  }

  return (
    <div className="flex h-full flex-col">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Notes rapides</span>
        <button
          onClick={() => setIsEditing((e) => !e)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={isEditing ? "Aperçu" : "Éditer"}
        >
          {isEditing ? (
            <Check className="h-4 w-4" />
          ) : (
            <Edit2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            className="h-full w-full resize-none bg-transparent p-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={
              "# Mes notes\n\nCommencez à écrire...\n\nSupports **gras**, *italique*, # titres, - listes"
            }
            autoFocus
          />
        ) : content ? (
          <div
            className="p-3 text-sm text-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <div
            className="flex h-full cursor-pointer items-center justify-center text-sm text-muted-foreground"
            onClick={() => setIsEditing(true)}
          >
            Cliquez sur le crayon pour écrire
          </div>
        )}
      </div>
    </div>
  );
}
