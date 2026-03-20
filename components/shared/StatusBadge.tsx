import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/types";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<ServiceStatus, { label: string; className: string; dotClass: string }> = {
  online: {
    label: "En ligne",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
    dotClass: "bg-green-400",
  },
  offline: {
    label: "Hors ligne",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dotClass: "bg-red-400",
  },
  degraded: {
    label: "Dégradé",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dotClass: "bg-yellow-400",
  },
  unknown: {
    label: "Inconnu",
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    dotClass: "bg-gray-400",
  },
};

export function StatusBadge({ status, className, showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)}
        aria-hidden="true"
      />
      {showLabel && config.label}
    </span>
  );
}
