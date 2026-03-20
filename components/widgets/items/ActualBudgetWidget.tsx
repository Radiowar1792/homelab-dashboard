"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface Account {
  id: string;
  name: string;
  balance: number;
  type?: string;
}

interface ActualResponse {
  accounts: Account[];
  message?: string;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function ActualBudgetWidget({ id }: WidgetProps) {
  const { data, isLoading, isError } = useQuery<ActualResponse>({
    queryKey: ["actual-budget", id],
    queryFn: async () => {
      const res = await fetch("/api/integrations/actual");
      if (!res.ok) throw new Error("Actual Budget inaccessible");
      return res.json() as Promise<ActualResponse>;
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: false,
  });

  const accounts = data?.accounts ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex h-full flex-col p-4">
      {/* En-tête */}
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Budget</span>
        {accounts.length > 0 && (
          <span
            className={cn(
              "ml-auto text-sm font-semibold",
              totalBalance >= 0 ? "text-green-400" : "text-red-400"
            )}
          >
            {formatAmount(totalBalance)}
          </span>
        )}
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex-1 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
          <div>
            <p className="text-xs">Actual Budget inaccessible</p>
            <p className="text-xs opacity-60">Vérifiez la configuration</p>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
          <Wallet className="h-8 w-8 opacity-30" />
          <p className="text-xs">
            {data?.message ?? "Intégration Actual Budget en cours de développement"}
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto space-y-1.5">
          {accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                {account.balance >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-400" />
                )}
                <span className="truncate text-sm text-foreground">{account.name}</span>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-medium",
                  account.balance >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {formatAmount(account.balance)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
