"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Send, Trash2, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface OllamaModels {
  models: { name: string; size: number; modified_at: string }[];
}

interface OllamaResponse {
  message: { content: string };
}

function formatSize(bytes: number): string {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export default function LLMPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("Tu es un assistant utile et concis.");
  const [showSystem, setShowSystem] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: modelsData, isError: modelsError } = useQuery<OllamaModels>({
    queryKey: ["llm-models-page"],
    queryFn: async () => {
      const res = await fetch("/api/llm");
      if (!res.ok) throw new Error("Ollama inaccessible");
      return res.json() as Promise<OllamaModels>;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const models = useMemo(() => modelsData?.models ?? [], [modelsData]);

  useEffect(() => {
    if (!selectedModel && models.length > 0 && models[0]) {
      setSelectedModel(models[0].name);
    }
  }, [models, selectedModel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !selectedModel || isLoading) return;
    const userContent = input.trim();
    setInput("");
    textareaRef.current?.focus();

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userContent, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    // Placeholder assistant
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      const apiMessages = [
        { role: "system" as const, content: systemPrompt },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages: apiMessages, stream: false }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = (await res.json()) as OllamaResponse;
      const content = data.message?.content ?? "Aucune réponse";

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: `Erreur : ${err instanceof Error ? err.message : "Impossible de contacter Ollama"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  const currentModel = models.find((m) => m.name === selectedModel);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assistant LLM</h1>
          <p className="text-sm text-muted-foreground">
            Chat avec vos modèles Ollama locaux
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Effacer
          </button>
        )}
      </div>

      {modelsError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-muted-foreground">
          <Bot className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">Ollama inaccessible</p>
          <p className="text-xs opacity-60">
            Vérifiez qu&apos;Ollama est démarré et que OLLAMA_URL est configuré
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          {/* Sélecteur de modèle + system prompt */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4 shrink-0 text-primary" />
              <div className="relative flex-1">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full appearance-none rounded-md border border-border bg-muted/40 px-3 py-1.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {models.length === 0 ? (
                    <option>Chargement…</option>
                  ) : (
                    models.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              {currentModel && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatSize(currentModel.size)}
                </span>
              )}
              <button
                onClick={() => setShowSystem((v) => !v)}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  showSystem ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="Prompt système"
                title="Configurer le prompt système"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
            {showSystem && (
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Prompt système (instructions de comportement)…"
              />
            )}
          </div>

          {/* Fenêtre de chat */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Bot className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p className="text-sm">Commencez une conversation</p>
                  <p className="mt-1 text-xs opacity-60">Entrée pour envoyer · Maj+Entrée pour saut de ligne</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.content || (isLoading && i === messages.length - 1 ? (
                      <span className="flex gap-1">
                        <span className="animate-bounce">·</span>
                        <span className="animate-bounce [animation-delay:0.1s]">·</span>
                        <span className="animate-bounce [animation-delay:0.2s]">·</span>
                      </span>
                    ) : "")}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      U
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message… (Entrée pour envoyer)"
              rows={3}
              disabled={isLoading || !selectedModel}
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim() || !selectedModel}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
