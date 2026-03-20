import { ExternalLink, AlertCircle } from "lucide-react";

const vikunjaUrl = process.env["NEXT_PUBLIC_VIKUNJA_URL"] ?? "";

export default function VikunjaPage() {
  if (!vikunjaUrl) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4 text-muted-foreground">
        <AlertCircle className="h-12 w-12 opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium text-foreground">Vikunja non configuré</p>
          <p className="mt-1 text-sm">
            Définis{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_VIKUNJA_URL
            </code>{" "}
            dans ton{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env</code>{" "}
            puis redémarre le conteneur.
          </p>
          <p className="mt-2 rounded-lg bg-muted px-4 py-2 font-mono text-xs text-muted-foreground">
            NEXT_PUBLIC_VIKUNJA_URL=http://192.168.1.x:3456
          </p>
        </div>
      </div>
    );
  }

  return (
    /* -m-6 annule le padding p-6 du shell pour aller bord à bord */
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col">
      {/* Barre supérieure */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2">
        <p className="text-xs text-muted-foreground">
          Vikunja —{" "}
          <span className="font-mono">{vikunjaUrl}</span>
        </p>
        <a
          href={vikunjaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir dans un nouvel onglet
        </a>
      </div>

      {/* iFrame pleine hauteur */}
      <iframe
        src={vikunjaUrl}
        className="flex-1 w-full border-0"
        title="Vikunja"
        allow="fullscreen"
      />
    </div>
  );
}
