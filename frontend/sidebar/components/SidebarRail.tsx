"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isRouteActive } from "../services/PermissionService";
import type { NavModule } from "../types/navigation";

interface SidebarRailProps {
  modules: NavModule[];
  dynamicBadges?: Record<string, { variant: "count"; value: number }>;
  onExpand: () => void;
  onModuleSelect?: (module: NavModule) => void;
  showExpand?: boolean;
  showLogo?: boolean;
  className?: string;
}

export const SidebarRail = memo(function SidebarRail({
  modules,
  dynamicBadges,
  onExpand,
  onModuleSelect,
  showExpand = false,
  showLogo = true,
  className,
}: SidebarRailProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sidebar-rail flex flex-col items-center min-h-0 h-full py-4",
          !showLogo && "pt-4",
          className
        )}
      >
        {showLogo && (
          <Link href="/dashboard" className="mb-3 shrink-0 block" aria-label="iTOOLS home">
            <BrandLogo size="sm" variant="icon" />
          </Link>
        )}

        {showExpand && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 mb-2 shrink-0 text-muted-foreground"
            onClick={onExpand}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <div className="sidebar-nav-scroll flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1 pb-3">
        {modules.map((mod) => {
          const active = isRouteActive(pathname, mod.route, mod.activeMatch ?? "prefix");
          const badge = dynamicBadges?.[mod.id];

          return (
            <Tooltip key={mod.id}>
              <TooltipTrigger asChild>
                <Link
                  href={mod.route}
                  onClick={() => onModuleSelect?.(mod)}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150",
                    active
                      ? "bg-brand text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  aria-label={mod.label}
                  aria-current={active ? "page" : undefined}
                >
                  <mod.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {badge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-accent text-[9px] font-bold text-brand-deep flex items-center justify-center">
                      {badge.value > 9 ? "9+" : badge.value}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl text-xs">
                {mod.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        </div>
      </aside>
    </TooltipProvider>
  );
});
