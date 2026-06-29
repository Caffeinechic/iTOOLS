import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  prefix = "",
  highlight = false,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  prefix?: string;
  highlight?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={cn("stat-card", highlight && "stat-card-highlight")}>
      <div className="flex items-start justify-between gap-3">
        <p className="stat-card-label">{label}</p>
        {Icon && (
          <div className="stat-icon-wrap shrink-0">
            <Icon className="w-4 h-4" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <p className="stat-card-value">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
