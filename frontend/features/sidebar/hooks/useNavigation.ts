"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { navigationRegistry } from "../services/NavigationRegistry";
import { initIToolsNavigation } from "../modules/itools-modules";
import type { NavigationContext, ResolvedCategory } from "../types/navigation";

export function useNavigation(roleTier?: string, dynamicBadges?: NavigationContext["dynamicBadges"]) {
  const pathname = usePathname();

  return useMemo(() => {
    initIToolsNavigation();
    const ctx: NavigationContext = { roleTier, pathname, dynamicBadges };
    const categories = navigationRegistry.resolveNavigation(ctx);
    const railModules = navigationRegistry.getRailModules(ctx);
    return { categories, railModules, ctx };
  }, [roleTier, pathname, dynamicBadges]);
}

export type { ResolvedCategory };
