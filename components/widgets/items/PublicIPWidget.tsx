"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe, Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "@/types";

interface IPApiResponse {
  country: string;
  city: string;
  org: string;
}

async function fetchPublicIP(): Promise<string> {
  const res = await fetch("https://api.ipify.org?format=json");
  const data = (await res.json()) as { ip: string };
  return data.ip;
}

async function fetchIPInfo(ip: string): Promise<IPApiResponse> {
  const res = await fetch(
    `http://ip-api.com/json/${ip}?fields=country,city,org`
  );
  return res.json();
}

export function PublicIPWidget({ config }: WidgetProps) {
  const referenceIP = config.referenceIP as string | undefined;

  const {
    data: ip,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["public-ip"],
    queryFn: fetchPublicIP,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const { data: ipInfo } = useQuery({
    queryKey: ["ip-info", ip],
    queryFn: () => fetchIPInfo(ip as string),
    enabled: !!ip,
    staleTime: 5 * 60 * 1000,
  });

  const isVPN = referenceIP && ip && ip !== referenceIP;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">IP Publique</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Rafraîchir"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : error || !ip ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs">Impossible de récupérer l&apos;IP</span>
        </div>
      ) : (
        <>
          <div className="font-mono text-2xl font-bold tracking-tight">
            {ip}
          </div>

          {ipInfo && (
            <div className="text-xs text-muted-foreground">
              <div>
                {ipInfo.city}, {ipInfo.country}
              </div>
              <div className="truncate">{ipInfo.org}</div>
            </div>
          )}

          {referenceIP && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                isVPN
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-green-500/10 text-green-500"
              )}
            >
              {isVPN ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  VPN actif
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Connexion directe
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
