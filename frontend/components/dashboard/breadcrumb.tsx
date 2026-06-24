"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  dashboard: "Overview",
  pipelines: "Pipelines",
  communications: "Communications",
  budget: "Budget",
  members: "Members",
  notifications: "Notifications",
  settings: "System",
};

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: { href: string; label: string }[] = [];
  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;
    path += `/${segment}`;
    if (segment === "dashboard" && i === 0) continue;
    const label = LABELS[segment] || (segment.length > 20 ? "Board" : segment);
    crumbs.push({ href: path, label });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[var(--itools-muted)] mb-1">
      <Link href="/dashboard" className="hover:text-[var(--itools-navy)] transition-colors">
        Overview
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 opacity-50" />
          {i === crumbs.length - 1 ? (
            <span className="text-[var(--itools-navy-deep)] font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-[var(--itools-navy)] transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
