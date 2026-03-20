"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Home, CheckSquare, Workflow, BookOpen, Wallet, Bot,
  Check, X, Loader2, ChevronDown, ChevronUp, ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationDef {
  name: string;
  label: string;
  icon: LucideIcon;
  color: string;
  fields: Array<{
    key: string;
    label: string;
    type: "url" | "text" | "password";
    placeholder: string;
    envVar: string;
    required?: boolean;
  }>;
  docsUrl?: string;
}

const INTEGRATIONS: IntegrationDef[] = [
  {
    name: "homeassistant",
    label: "Home Assistant",
    icon: Home,
    color: "text-blue-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "http://homeassistant.local:8123", envVar: "HOME_ASSISTANT_URL", required: true },
      { key: "token", label: "Long-lived Access Token", type: "password", placeholder: "eyJ0eXAiOiJKV1Q…", envVar: "HOME_ASSISTANT_TOKEN", required: true },
    ],
  },
  {
    name: "vikunja",
    label: "Vikunja",
    icon: CheckSquare,
    color: "text-green-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "https://vikunja.homelab.local", envVar: "VIKUNJA_URL", required: true },
      { key: "token", label: "API Token", type: "password", placeholder: "Token API Vikunja", envVar: "VIKUNJA_TOKEN", required: true },
    ],
  },
  {
    name: "n8n",
    label: "N8N",
    icon: Workflow,
    color: "text-orange-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "https://n8n.homelab.local", envVar: "N8N_URL", required: true },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Clé API N8N", envVar: "N8N_API_KEY", required: true },
    ],
  },
  {
    name: "docmost",
    label: "Docmost",
    icon: BookOpen,
    color: "text-purple-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "https://docmost.homelab.local", envVar: "DOCMOST_URL", required: true },
    ],
  },
  {
    name: "actual",
    label: "Actual Budget",
    icon: Wallet,
    color: "text-emerald-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "https://actual.homelab.local", envVar: "ACTUAL_URL", required: true },
    ],
  },
  {
    name: "ollama",
    label: "Ollama (LLM local)",
    icon: Bot,
    color: "text-yellow-400",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "http://localhost:11434", envVar: "OLLAMA_URL", required: true },
    ],
  },
];

interface TestResult {
  ok: boolean;
  message: string;
}

function IntegrationCard({ def }: { def: IntegrationDef }) {
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const Icon = def.icon;

  const testMutation = useMutation({
    mutationFn: async () => {
      const urlField = values.url ?? values.baseUrl ?? "";
      if (!urlField) throw new Error("URL requise");

      const endpoints: Record<string, string> = {
        homeassistant: "/api/integrations/homeassistant",
        vikunja: `/api/integrations/vikunja?resource=tasks`,
        n8n: `/api/integrations/n8n?resource=workflows`,
        docmost: `/api/integrations/docmost`,
        actual: `/api/integrations/actual`,
        ollama: `/api/llm`,
      };

      const endpoint = endpoints[def.name];
      if (!endpoint) throw new Error("Intégration inconnue");

      let res: Response;
      if (def.name === "homeassistant") {
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "states", entityId: undefined }),
        });
      } else {
        res = await fetch(endpoint);
      }

      return { ok: res.ok || res.status < 500, status: res.status };
    },
    onSuccess: (data) => {
      setTestResult({
        ok: data.ok,
        message: data.ok ? "Connexion réussie ✓" : `Erreur HTTP ${data.status}`,
      });
    },
    onError: (err) => {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : "Connexion impossible",
      });
    },
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/20"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", def.color)} />
          <span className="text-sm font-medium text-foreground">{def.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {testResult && (
            <span className={cn("text-xs", testResult.ok ? "text-green-400" : "text-red-400")}>
              {testResult.message}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-4 pt-3 space-y-3">
          {def.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
                <span className="font-mono text-muted-foreground/60">{field.envVar}</span>
              </label>
              <input
                type={field.type}
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}

          <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground/80 mb-1">Configuration via variables d&apos;environnement</p>
            <p>Ces valeurs sont lues depuis votre fichier <code className="rounded bg-muted px-1">.env</code> sur le serveur.</p>
            <p className="mt-1">Pour modifier, éditez votre <code className="rounded bg-muted px-1">.env</code> et redémarrez le conteneur.</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            {def.docsUrl && (
              <a
                href={def.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Documentation
              </a>
            )}
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="ml-auto flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent disabled:opacity-50"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : testResult?.ok ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : testResult ? (
                <X className="h-3.5 w-3.5 text-red-400" />
              ) : null}
              Tester la connexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function IntegrationsSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Intégrations</h2>
        <p className="text-sm text-muted-foreground">
          Configurez vos services via les variables d&apos;environnement et testez leur connexion
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
        <p className="font-medium">Configuration par variables d&apos;environnement</p>
        <p className="mt-0.5 text-xs text-amber-400/80">
          Les tokens et URLs sont définis dans <code className="rounded bg-amber-500/20 px-1">.env</code> sur votre serveur. Modifiez ce fichier puis redémarrez le conteneur Docker.
        </p>
      </div>

      <div className="space-y-2">
        {INTEGRATIONS.map((def) => (
          <IntegrationCard key={def.name} def={def} />
        ))}
      </div>
    </div>
  );
}
