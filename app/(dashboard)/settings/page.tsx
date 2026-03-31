"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Palette, Smartphone } from "lucide-react";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { PwaInstallSection } from "@/components/settings/PwaInstallSection";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Configuration du dashboard
        </p>
      </div>

      <Tabs.Root defaultValue="appearance">
        <Tabs.List className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <Tabs.Trigger
            value="appearance"
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Palette className="h-4 w-4" />
            Apparence
          </Tabs.Trigger>
          <Tabs.Trigger
            value="application"
            className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Smartphone className="h-4 w-4" />
            Application
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="appearance">
          <AppearanceSection />
        </Tabs.Content>

        <Tabs.Content value="application">
          <PwaInstallSection />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
