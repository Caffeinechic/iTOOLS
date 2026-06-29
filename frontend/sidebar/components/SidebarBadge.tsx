import { cn } from "@/lib/utils";
import type { NavBadge } from "../types/navigation";

export function SidebarBadge({
  badge,
  className,
}: {
  badge?: NavBadge;
  className?: string;
}) {
  if (!badge) return null;

  const label =
    badge.variant === "count" && badge.value != null
      ? typeof badge.value === "number" && badge.value > 99
        ? "99+"
        : String(badge.value)
      : badge.variant === "soon"
        ? "Soon"
        : badge.variant === "beta"
          ? "Beta"
          : badge.variant === "new"
            ? "New"
            : badge.variant === "live"
              ? "Live"
              : badge.variant === "alert"
                ? "!"
                : null;

  if (!label) return null;

  const isSoon = badge.variant === "soon" || badge.variant === "beta" || badge.variant === "new";

  return (
    <span
      className={cn(
        "text-[9px] font-semibold shrink-0 leading-none",
        isSoon
          ? "px-1.5 py-0.5 rounded-full border border-border text-muted-foreground"
          : "min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-accent text-brand-deep px-1",
        className
      )}
    >
      {label}
    </span>
  );
}
