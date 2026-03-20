"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface OllamaModels {
  models: { name: string }[];
}

interface OllamaResponse {
  message: { content: string };
}

export function LLMChatWidget({ id, config }: WidgetProps) {
  const defaultModel = config.model as string | undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(defaultModel ?? "");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: modelsData } = useQuery<OllamaModels>({
    queryKey: ["llm-models", id],
    queryFn: async () => {
      const res = await fetch("/api/llm");
      if (!res.ok) throw new Error("Ollama inaccessible");
      return res.json() as Promise<OllamaModels>;
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const models = useMemo(() => modelsData?.models ?? [], [modelsData]);

  // Sélectionner le premier modèle disponible si aucun n'est configuré
  useEffect(() => {
    if (!selectedModel && models.length > 0 && models[0]) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !selectedModel || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Ajouter un message assistant vide pour le streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error("Erreur LLM");
      const data = (await res.json()) as OllamaResponse;
      const content = data.message?.content ?? "";

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Erreur : impossible de contacter Ollama." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  if (models.length === 0 && !modelsData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-muted-foreground">
        <Bot className="h-8 w-8 opacity-30" />
        <p className="text-xs">Ollama inaccessible</p>
        <p className="text-xs opacity-60">Vérifiez que Ollama est démarré</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-3">
      {/* Sélecteur de modèle */}
      <div className="mb-2 flex items-center gap-2">
        <Bot className="h-4 w-4 shrink-0 text-primary" />
        <div className="relative flex-1">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full appearance-none rounded-md border border-border bg-muted/40 px-3 py-1 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Commencez une conversation…
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2 text-xs",
                msg.role === "user"
                  ? "ml-4 bg-primary/20 text-foreground"
                  : "mr-4 bg-muted/60 text-foreground"
              )}
            >
              {msg.content || (isStreaming && i === messages.length - 1 ? "…" : "")}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Saisie */}
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez un message… (Entrée pour envoyer)"
          rows={2}
          disabled={isStreaming || !selectedModel}
          className="flex-1 resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          onClick={() => void sendMessage()}
          disabled={isStreaming || !input.trim() || !selectedModel}
          className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
