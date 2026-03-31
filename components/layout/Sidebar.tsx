"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  Rss,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/lib/settings-context";
import { safeJson } from "@/lib/settings-client";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/services", label: "Services", icon: Activity },
  { href: "/monitoring", label: "Monitoring", icon: BarChart2 },
  { href: "/rss", label: "Flux RSS", icon: Rss },
  { href: "/llm", label: "LLM Chat", icon: Bot },
];

const bottomItems = [
  { href: "/settings", label: "Paramètres", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { settings } = useAppSettings();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Logo depuis le contexte settings (clé appearance.logo)
  useEffect(() => {
    const a = safeJson<Record<string, unknown>>(settings["appearance"], {});
    const logo = (a["logo"] as string | null | undefined) ?? null;
    setLogoUrl(logo);
  }, [settings]);

  useEffect(() => {
    function onLogoChange(e: Event) {
      setLogoUrl((e as CustomEvent<string | null>).detail);
    }
    window.addEventListener("homelab:logo-change", onLogoChange);
    return () => window.removeEventListener("homelab:logo-change", onLogoChange);
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex h-screen shrink-0 flex-col border-r border-border bg-[hsl(var(--sidebar-background))]"
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="h-6 w-6 shrink-0 rounded-sm object-contain" />
        ) : (
          <Server className="h-6 w-6 shrink-0 text-primary" />
        )}
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="ml-3 overflow-hidden whitespace-nowrap font-semibold text-foreground"
            >
              Homelab
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation principale */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Navigation bas */}
      <div className="flex flex-col gap-1 border-t border-border p-2">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Bouton collapse */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[52px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={collapsed ? "Ouvrir la sidebar" : "Réduire la sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
