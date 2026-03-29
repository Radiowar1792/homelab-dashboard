"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Globe, Palette } from "lucide-react";
import { ServicesSection } from "@/components/settings/ServicesSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";

const TABS = [
  { value: "services", label: "Services", icon: Globe },
  { value: "appearance", label: "Apparence", icon: Palette },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Configuration du dashboard
        </p>
      </div>

      <Tabs.Root defaultValue="services">
        <Tabs.List className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="services">
          <ServicesSection />
        </Tabs.Content>

        <Tabs.Content value="appearance">
          <AppearanceSection />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
