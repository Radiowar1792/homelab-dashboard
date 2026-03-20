"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceDef {
  id: string;
  name: string;
  url: string;
  category: string | null;
  expectedStatus: number;
  timeout: number;
  isActive: boolean;
  position: number;
}

const EMPTY_FORM = {
  name: "",
  url: "",
  category: "",
  expectedStatus: 200,
  timeout: 5000,
};

type FormState = typeof EMPTY_FORM;

function ServiceForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof FormState, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Nom *
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Mon Service"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            URL *
          </label>
          <input
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://service.homelab.local"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Catégorie
          </label>
          <input
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="App, Infra, Media…"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status attendu
            </label>
            <input
              type="number"
              value={form.expectedStatus}
              onChange={(e) => set("expectedStatus", parseInt(e.target.value) || 200)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={form.timeout}
              onChange={(e) => set("timeout", parseInt(e.target.value) || 5000)}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
          Annuler
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={isPending || !form.name || !form.url}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}

export function ServicesSection() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ services: ServiceDef[] }>({
    queryKey: ["services-config"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      return res.json() as Promise<{ services: ServiceDef[] }>;
    },
  });

  const services = data?.services ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["services-config"] });
    void queryClient.invalidateQueries({ queryKey: ["widgets"] });
  };

  const createMutation = useMutation({
    mutationFn: async (form: FormState) => {
      const res = await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur création");
    },
    onSuccess: () => {
      toast.success("Service ajouté");
      setShowAdd(false);
      invalidate();
    },
    onError: () => toast.error("Impossible d'ajouter le service"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormState }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: form.category || null,
        }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");
    },
    onSuccess: () => {
      toast.success("Service mis à jour");
      setEditingId(null);
      invalidate();
    },
    onError: () => toast.error("Impossible de mettre à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
    },
    onSuccess: () => {
      toast.success("Service supprimé");
      invalidate();
    },
    onError: () => toast.error("Impossible de supprimer"),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Services à monitorer</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les services affichés dans le widget Status des Services
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {showAdd && (
        <ServiceForm
          initial={EMPTY_FORM}
          onSave={(form) => createMutation.mutate(form)}
          onCancel={() => setShowAdd(false)}
          isPending={createMutation.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-muted-foreground">
          <Globe className="h-8 w-8 opacity-30" />
          <p className="text-sm">Aucun service configuré</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {services.map((service) => (
            <li key={service.id}>
              {editingId === service.id ? (
                <ServiceForm
                  initial={{
                    name: service.name,
                    url: service.url,
                    category: service.category ?? "",
                    expectedStatus: service.expectedStatus,
                    timeout: service.timeout,
                  }}
                  onSave={(form) => updateMutation.mutate({ id: service.id, form })}
                  onCancel={() => setEditingId(null)}
                  isPending={updateMutation.isPending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      {service.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {service.category}
                        </span>
                      )}
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          service.isActive ? "bg-green-500" : "bg-muted-foreground"
                        )}
                      />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(service.id);
                        setShowAdd(false);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Modifier"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(service.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
