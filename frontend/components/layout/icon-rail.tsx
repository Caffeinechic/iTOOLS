"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BrandIcon } from "@/components/brand/brand-logo";
import { cn } from "@/lib/utils";
import { ICON_RAIL, isNavActive } from "@/lib/navigation";

export function IconRail({
  notificationCount,
  className,
}: {
  notificationCount?: number;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn("icon-rail flex flex-col items-center py-4 gap-1", className)}>
        <Link href="/dashboard" className="mb-4" aria-label="iTools home">
          <BrandIcon size={40} />
        </Link>

        {ICON_RAIL.map((item) => {
          const active = isNavActive(pathname, item);
          const showBadge =
            item.id === "rail-notifications" && notificationCount && notificationCount > 0;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full transition-all",
                    active
                      ? "bg-brand text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {showBadge ? (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-accent text-[9px] font-bold text-brand-deep flex items-center justify-center">
                      {notificationCount! > 9 ? "9+" : notificationCount}
                    </span>
                  ) : null}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="rounded-xl text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
    </TooltipProvider>
  );
}
