import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  segmentedActiveClass,
  segmentedInactiveClass,
  segmentedTrackClass,
} from "@/lib/tokens";

export function SegmentedNav({
  items,
  activeHref,
  ariaLabel,
}: {
  items: { href: string; label: string }[];
  activeHref: string;
  ariaLabel: string;
}) {
  return (
    <nav className={cn(segmentedTrackClass, "mb-7")} aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = activeHref === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium rounded-full text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              isActive ? segmentedActiveClass : segmentedInactiveClass
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
