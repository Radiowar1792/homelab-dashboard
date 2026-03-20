export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Homelab Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Connectez-vous pour accéder au dashboard</p>
        </div>
        {/* Formulaire de login — sera complété à l'étape Auth */}
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow">
          <p className="text-center text-sm text-muted-foreground">
            Authentification à configurer (NextAuth.js — Étape Auth)
          </p>
        </div>
      </div>
    </div>
  );
}
