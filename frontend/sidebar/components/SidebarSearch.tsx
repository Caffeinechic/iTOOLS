"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { navigationRegistry } from "../services/NavigationRegistry";
import { initIToolsNavigation } from "../modules/itools-modules";
import type { NavModule } from "../types/navigation";

export function SidebarSearch({
  open,
  onOpenChange,
  roleTier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleTier?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    initIToolsNavigation();
    return navigationRegistry.searchModules(query, {
      roleTier,
      pathname: "",
    });
  }, [query, roleTier]);

  const go = (mod: NavModule) => {
    onOpenChange(false);
    router.push(mod.route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search navigation
          </DialogTitle>
        </DialogHeader>
        <div className="p-3">
          <Input
            autoFocus
            placeholder="Pages, modules, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto px-2 pb-3">
          {results.length === 0 && query.trim() && (
            <li className="px-3 py-4 text-sm text-muted-foreground text-center">No results</li>
          )}
          {results.map((mod) => (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => go(mod)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-secondary/80 transition-colors"
              >
                <mod.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{mod.label}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{mod.categoryId}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
